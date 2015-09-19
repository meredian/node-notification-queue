var _ = require('lodash');
var utils = require('../utils');
var PropertyCacheProxy = require('../propertyCacheProxy');
var NotificationApi = require('../notificationApi');

var sendNotificationAsync = utils.promisify(
    NotificationApi.sendNotification,
    NotificationApi
);

var Task = module.exports = function(mongoTaskObject, players) {
    this._obj = mongoTaskObject;
    this._notifyPerformed = false;
    this.players = players;
    this.logEvents = [];

    return PropertyCacheProxy(this, [
        '_id', 'message', 'lastVkId', 'lastName'
    ]);
};

Task.prototype.toJSON = function() {
    return {
        _id: this._id,
        message: this.message
    };
};

Task.prototype.flushCache = function() {
    this._cache = {};
};

Task.prototype.sync = function(tasks) {
    if (!this._cache) {
        return Promise.resolve();
    }

    return tasks.updateOne({
        _id: this._id
    }, {
        $set: this._cache
    }).then(() => {
        this._notifyPerformed = false;
        for (var prop in this._cache) {
            this._obj[prop] = this._cache[prop];
        }
        this.flushCache();
    });
};

Task.prototype.remove = function(taskCollection) {
    return taskCollection.remove({_id: this._id});
};

Task.prototype.restore = function() {
    if (this._restored) {
        return Promise.resolve(this);
    }
    return this.collectNames().then((names) => {
        this.names = names;
        if (this.lastName) {
            return this.collectPlayerIdsByName(this.lastName);
        }
    }).then((ids) => {
        this.ids = ids;
    }).then(() => {
        this._restored = true;
        return this;
    });
};

Task.prototype.notifyStep = function() {
    if (this._notifyPerformed) {
        return Promise.resolve(this);
    } else {
        return this.restore().then(() => {
            return this.fill();
        }).then(() => {
            return this.notify();
        });
    }
};

Task.prototype.flushLogs = function() {
    var logEvents = this.logEvents;
    this.logEvents = [];
    return Promise.resolve(logEvents);
};

Task.prototype.notify = function() {
    var notifyIds = this.ids.slice(0, NotificationApi.MAX_IDS_COUNT);
    var notifyCount = notifyIds.length;
    var notifyMessage = this.formatMessage();
    return sendNotificationAsync(notifyIds.join(','), notifyMessage).then((res) => {
        // We always drop ids we tried to notify even if API returned
        // not all of then. We don't know why concrete id stucked. Maybe
        // we hit notification limit for user? Then just omit it and resume
        this.ids = this.ids.slice(notifyCount);
        //
        this.lastVkId = notifyIds[notifyCount - 1];
        this._notifyPerformed = true;

        var acceptedIds = res.split(/,\s?/).map((i) => {
            return parseInt(i, 10);
        });
        this.logEvents.push({
            accepter_ids: acceptedIds,
            rejected_ids: _.difference(notifyIds, acceptedIds),
            message: notifyMessage
        });
        return this;
    });
};

Task.prototype.fill = function() {
    var iterator = (nameIndex) => {
        if (this.isFilled() || this.hasEmptyNameList()) {
            if (nameIndex > 0) {
                this.lastName = this.names[nameIndex - 1];
                this.names = this.names.slice(nameIndex);
            }
            return Promise.resolve(this);
        } else {
            this.lastVkId = null;
        }
        return this.collectPlayerIdsByName(this.names[nameIndex]).then((newIds) => {
            this.ids = (this.ids || []).concat(newIds);
            return iterator(++nameIndex);
        });
    };
    return iterator(0);
};

Task.prototype.collectNames = function() {
    var query = this.lastName ? {first_name: {$gt: this.lastName}} : {};
    return this.players.distinct('first_name', query);
};

Task.prototype.collectPlayerIdsByName = function(name) {
    var query = {first_name: name};
    if (this.lastVkId != null) {
        query.vk_id = {$gte: this.lastVkId};
    }
    return this.players.distinct('vk_id', query).then((ids) => {
        return _.sortBy(ids);
    });
};

Task.prototype.hasEmptyNameList = function() {
    return this.names && !this.names.length;
};

Task.prototype.hasEmptyIdList = function() {
    return this.ids && !this.ids.length;
};

Task.prototype.isDirtyState = function() {
    return this._cache && Object.keys(this._cache).length > 0;
};

Task.prototype.isComplete = function() {
    return this.hasEmptyNameList() && this.hasEmptyIdList()
        && !this.isDirtyState();
};

Task.prototype.isFilled = function() {
    throw new Error('Not implemented, subclass Task');
};

Task.prototype.formatMessage = function() {
    throw new Error('Not implemented, subclass Task');
};

