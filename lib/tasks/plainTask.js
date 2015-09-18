var Task = require('./task');
var NotificationApi = require('../notificationApi');

var PlainTask = module.exports = function(taskObj, db) {
    return Task.call(this, taskObj, db);
};
PlainTask.prototype = Object.create(Task.prototype);

PlainTask.prototype.formatMessage = function() {
    return this.message;
};

PlainTask.prototype.isFilled = function() {
    return this.ids && this.ids.length >= NotificationApi.MAX_IDS_COUNT;
};
