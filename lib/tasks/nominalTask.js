var Task = require('./task');

var NominalTask = module.exports = function(taskObj, db) {
    return Task.call(this, taskObj, db);
};
NominalTask.prototype = Object.create(Task.prototype);

NominalTask.match = function(taskObj) {
    return taskObj.message.indexOf('%name%') >= 0;
};

Task.prototype.formatMessage = function() {
    return this.message.replace(/%name%/g, this.lastName);
};

NominalTask.prototype.isFilled = function() {
    return this.ids && this.ids.length;
};
