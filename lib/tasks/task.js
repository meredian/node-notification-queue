var utils = require('../utils');
var PropertyCacheProxy = require('../propertyCacheProxy');
var NotificationApi = require('../notificationApi');

var RateLimiter = require('limiter').RateLimiter;

var sendNotificationAsync = utils.promisify(
    NotificationApi.sendNotification,
    NotificationApi
);

var Task = module.exports = function(mongoTaskObject, db) {
    this._obj = mongoTaskObject;
    this._notifyPerformed = false;
    this.db = db;
    this.tasks = this.db.collection('notification_tasks');
    this.players = this.db.collection('players');

    this.limiter = new RateLimiter(1, 400);
    this.removeTokensAsync = utils.promisify(
        this.limiter.removeTokens,
        this.limiter
    );
    return PropertyCacheProxy(this, [
        '_id', 'message', 'names', 'ids', 'lastName'
    ]);
};

Task.prototype.flushCache = function() {
    this._cache = {};
};

Task.prototype.update = function() {
    if (!this._cache) {
        return Promise.resolve();
    }

    return this.tasks.updateOne({
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

Task.prototype.remove = function() {
    return this.tasks.remove({_id: this._id});
};

Task.prototype.iterate = function() {
    if (this.names) {
        return this.performNofityStep();
    } else {
        return this.collectNames().then((names) => {
            this.names = names;
            return this;
        });
    }
};

Task.prototype.performNofityStep = function() {
    if (this._notifyPerformed) {
        return Promise.resolve(this);
    } else {
        return this.fill().then(() => {
            return this.notify();
        });
    }
};

Task.prototype.notify = function() {
    var notifyIds = this.ids.slice(0, NotificationApi.MAX_IDS_COUNT);
    return this.removeTokensAsync(1).then(() => {
        return sendNotificationAsync(notifyIds.join(','), this.formatMessage());
    }).then(() => {
        // We always drop ids we tried to notify even if API returned
        // not all of then. We don't know why concrete id stucked. Maybe
        // we hit notification limit for user? Then just omit it and resume
        this.ids = this.ids.slice(notifyIds.length);
        this._notifyPerformed = true;
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
        }
        return this.collectPlayerIdsByName(this.names[nameIndex]).then((newIds) => {
            this.ids = (this.ids || []).concat(newIds);
            return iterator(++nameIndex);
        });
    };
    return iterator(0);
};

Task.prototype.collectNames = function() {
    return this.players.distinct('first_name');
};

Task.prototype.collectPlayerIdsByName = function(name) {
    return this.players.distinct('vk_id', {first_name: name});
};

Task.prototype.hasEmptyNameList = function() {
    return this.names && !this.names.length;
};

Task.prototype.isDirtyState = function() {
    return !!this._cache;
};

Task.prototype.isComplete = function() {
    return this.hasEmptyNameList() && !this.isDirtyState()
        && this.ids && !this.ids.length;
};

Task.prototype.isFilled = function() {
    throw new Error('Not implemented, subclass Task');
};

Task.prototype.formatMessage = function() {
    throw new Error('Not implemented, subclass Task');
};

