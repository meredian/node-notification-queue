var util = require('util');
var EventEmitter = require('events').EventEmitter;
var RateLimiter = require('limiter').RateLimiter;

var utils = require('./utils');
var Tasks = require('./tasks');

const ERROR_DELAY = 3000;

var TaskWatcher = function(task) {
    this.complete = false;
    this.task = task;
    this.limiter = new RateLimiter(1, 350);
};
util.inherits(TaskWatcher, EventEmitter);

TaskWatcher.prototype.loop = function() {
    if (this.task && this.task.isComplete()) {
        this.complete = true;
        return this.emit('complete', this.task);
    }
    this.emit('ready', this.task, () => {
        this.loop();
    });
};

var TaskProcessor = module.exports = function(db) {
    this.db = db;
    this.tasks = this.db.collection('notification_tasks');
    this.players = this.db.collection('players');
    this.watcher = null;
};

TaskProcessor.prototype.createTask = function(message) {
    return this.tasks.insertOne({
        message: message
    }).then((res) => {
        var task = Tasks.create(res.ops[0], this.db);
        console.log('Task scheduled!', task);
        this.watchTask(task);
        return task;
    });
};

TaskProcessor.prototype.watchTask = function(task) {
    if (!this.watcher) {
        this.watcher = new TaskWatcher(task);

        this.watcher.on('ready', (task, done) => {
            task.iterate().then((task) => {
                return task.update();
            }).catch((err) => {
                console.log('Error on iterate. Will retry;', err, err.stack);
                return utils.sleep(ERROR_DELAY);
            }).then(() => { done(); });
        });

        this.watcher.on('complete', (task) => {
            task.remove().then(() => {
                console.log('Task is complete!', task);
                this.watcher = null;
            }).catch((err) => {
                console.log('Error on remove', err);
            });
        });

        this.watcher.loop();
    }
};
