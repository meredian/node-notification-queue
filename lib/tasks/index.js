var Task = require('./task');
var PlainTask = require('./plainTask');
var NominalTask = require('./nominalTask');

exports.Task = Task;
exports.PlainTask = PlainTask;
exports.NominalTask = NominalTask;

exports.create = function(mongoTaskObject, db) {
    if (NominalTask.match(mongoTaskObject)) {
        return new NominalTask(mongoTaskObject, db);
    } else {
        return new PlainTask(mongoTaskObject, db);
    }
};
