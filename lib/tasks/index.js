var Task = require('./task');
var PlainTask = require('./plainTask');
var NominalTask = require('./nominalTask');

exports.Task = Task;
exports.PlainTask = PlainTask;
exports.NominalTask = NominalTask;

exports.create = function(mongoTaskObject, players) {
    if (NominalTask.match(mongoTaskObject)) {
        return new NominalTask(mongoTaskObject, players);
    } else {
        return new PlainTask(mongoTaskObject, players);
    }
};
