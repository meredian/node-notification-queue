require('harmonize')();

var restify = require('restify');

var db = require('./db');
var config = require('../config');
var logger = require('./logger');

var TaskQueue = require('./taskQueue');

var server = module.exports = restify.createServer({
    log: logger,
    name: config.name
});

server.use(restify.requestLogger());
server.use(restify.bodyParser());

server.post('/send', function(req, res, next) {
    if (req.body && req.body.template) {
        this.queue.createTask(req.body.template).then((task) => {
            res.json(task);
            next();
        }).catch((err) => {
            res.send(500, {error: err});
        });
    } else {
        res.send(400, {error: 'template missing'});
    }
});

server.run = function() {
    return db.connect().then((db) => {
        this.db = db;
        this.queue = new TaskQueue(db);
        return this.queue.init().then(() => {
            return new Promise(function(fullfil) {
                server.listen(config.port, fullfil);
            });
        }).then(() => {
            logger.info('%s listening at %s', server.name, server.url);
        });
    });
};

if (require.main === module) {
    server.run().catch((e) => {
        console.log(e.stack);
        process.exit(1);
    });
}
