require('harmonize')();

var gulp = require('gulp');
var runSequence = require('run-sequence');
var argv = require('yargs').argv;

var db = require('./lib/db');
var utils = require('./lib/utils');
var TaskQueue = require('./lib/taskQueue');

gulp.task('task:plain', function() {
    return db.connect().then((db) => {
        var taskQueue = new TaskQueue(db);
        return taskQueue.createTask('This is message!').then(() => {
            return taskQueue.createTask('This is other message');
        });
    });
});

gulp.task('task:nominal', function() {
    return db.connect().then((db) => {
        var taskProcessor = new TaskQueue(db);
        return taskProcessor.createTask('This is message, %name%!');
    });
});

gulp.task('db:measure', function() {
    return db.connect().then((db) => {
        return db.command({distinct: 'players', key:'first_name', query: {}}).then((res) => {
            console.log('Request: db.players.distict(first_name); Stats:', res.stats);
            var name = utils.sample(res.values);
            return db.command({distinct: 'players', key:'vk_id', query: {first_name: name}});
        }).then((res) => {
            console.log('Request: db.players.distict(vk_id, {first_name: name}); Stats:', res.stats);
            return db.close();
        });
    });
});


gulp.task('db:reset', function() {
    return db.connect().then((db) => {
        return db.dropDatabase().then(() => {
            return db.close();
        });
    });
});

gulp.task('db:indices', function() {
    return db.connect().then((db) => {
        return db.createIndex('players', {first_name: 1, vk_id: 1}).then(() => {
            return db.close();
        });
    });
});

gulp.task('db:seed', function() {
    console.log('You can use --seed-size x, --seed-step x and --name-count x parameters to configure task');
    var seedSize = argv.seedSize || 10000000;
    var seedStep = argv.seedStep || 1000000;
    var nameCount = argv.nameCount || 10000;
    var names = new utils.NameSet(nameCount);
    return db.connect().then((db) => {
        console.log(`Seedind "players" in "${db.databaseName}"`);
        console.log(`Seed size: ${seedSize}; Step size: ${seedStep}; Name dictionary size: ${nameCount}`);

        // Using callback iteration because promises are generated too fast and clog memory
        var seedRange = function(min, max, callback) {
            console.log('Seeding range [%d, %d)', min, max);
            var data = utils.shuffledIntRange(min, max).map((id) => {
                return {
                    vk_id: id,
                    first_name: names.sample()
                };
            });
            return db.collection('players').insertMany(data, callback);
        };

        var seedIterator = function(seed, callback) {
            if (seed < seedSize) {
                seedRange(seed, Math.min(seedSize, seed + seedStep), (err) => {
                    return err ? callback(err) : seedIterator(seed + seedStep, callback);
                });
            } else {
                callback();
            }
        };

        return utils.promisify(seedIterator)(0).then(() => {
            return db.collection('players').count();
        }).then((result) => {
            console.log(`Done seeding "players" in "${db.databaseName}"; Total collection size: ${result}`);
            return db.close();
        });
    });
});

gulp.task('db:recreate', function(callback) { runSequence('db:reset', 'db:seed', 'db:indices', callback); });

