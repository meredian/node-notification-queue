var util = require('util');
var EventEmitter = require('events').EventEmitter;
var RateLimiter = require('limiter').RateLimiter;

var logger = require('./logger').child({component: 'task_queue'});
var utils = require('./utils');
var Tasks = require('./tasks');

const ERROR_DELAY = 1000;

var TaskQueue = module.exports = function(db) {
    this.db = db;
    this.tasks = this.db.collection('notification_tasks');
    this.players = this.db.collection('players');

    this.queue = [];
    this.limiter = new RateLimiter(1, 400);

    this.on('ready', function(task, done) {
        task.iterate().then(() => {
            return task.flushLogs();
        }).then((logs) => {
            logs.forEach(function(log) {
                logger.info(log, 'Notification performed');
            });
            return task.sync(this.tasks);
        }).catch((err) => {
            logger.warn(err, 'Error iterating task');
            return utils.sleep(ERROR_DELAY);
        }).then(() => {
            done();
        });
    });

    this.on('complete', function(task, done) {
        task.remove(this.tasks).then(() => {
            this.dequeue();
        }).catch((err) => {
            logger.warn(err, 'Error deleting task');
            return utils.sleep(ERROR_DELAY);
        }).then(() => {
            done();
        });

    });
};
util.inherits(TaskQueue, EventEmitter);

TaskQueue.prototype.init = function() {
    return this.collectTasks().then((tasks) => {
        this.queue = tasks;
        this.loop();
    }).then(() => {
        logger.info('TaskQueue initialized');
        logger.info({tasks: this.queue.map((task) => {
            return task.toJSON();
        })}, 'TaskQueue loaded tasks');
        return this;
    });
};

TaskQueue.prototype.loop = function() {
    if (this.queue.length && !this.isLooping) {
        this.isLooping = true;
        var task = this.queue[0];
        var eventName = task.isComplete() ? 'complete' : 'ready';
        this.limiter.removeTokens(1, () => {
            this.emit(eventName, task, () => {
                this.isLooping = false;
                this.loop();
            });
        });
    }
};

TaskQueue.prototype.createTask = function(message) {
    return this.tasks.insertOne({
        message: message
    }).then((res) => {
        var task = Tasks.create(res.ops[0], this.players);
        this.enqueue(task);
        return {
            task_id: task._id,
            queue_size: this.queue.length
        };
    });
};

TaskQueue.prototype.collectTasks = function() {
    return this.tasks.find().toArray().then((res) => {
        return res.map((mongoTaskObject) => {
            return Tasks.create(mongoTaskObject, this.players);
        });
    });
};

TaskQueue.prototype.enqueue = function(task) {
    logger.info({task: task.toJSON()}, 'Task added');
    this.queue.push(task);
    this.loop();
};

TaskQueue.prototype.dequeue = function() {
    logger.info({task: this.queue[0].toJSON()}, 'Task removed');
    this.queue.shift();
};
