var gulp = require('gulp');
var runSequence = require('run-sequence');
var argv = require('yargs').argv;

var db = require('./lib/db');
var utils = require('./lib/utils');


gulp.task('db:reset', function() {
    return db.connect().then((db) => {
        return db.dropDatabase().then(() => {
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

        // Using async iteration because promises age generated too fast and clog memory
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
                    if (err) {
                        callback(err);
                    } else {
                        seedIterator(seed + seedStep, callback);
                    }
                });
            } else {
                callback();
            }
        };


        return new Promise((resolve) => {
            seedIterator(0, resolve);
        }).then(() => {
            return db.collection('players').count();
        }).then((result) => {
            db.close();
            console.log(`Done seeding "players" in "${db.databaseName}"; Total collection size: ${result}`);
        });
    });
});

gulp.task('db:recreate', function(callback) { runSequence('db:reset', 'db:seed', callback); });

