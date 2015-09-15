var gulp = require('gulp');
var db = require('./lib/db');

var utils = require('./lib/utils');

gulp.task("db:reset", function() {
    return db.connect().then(function(db) {
        return db.dropDatabase().then(function() {
            db.close();
        });
    })
});

gulp.task("db:seed", function() {
    var seedSize = 500000;
    var seedStep = 100000;
    var names = new utils.NameSet(10000);
    return db.connect().then(function(db) {
        console.log('Seedind collection "players"; seed size: %d', seedSize);
        var chain;
        var seedRange = function(min, max) {
            console.log("Seeding range (%d, %d)", min, max);
            var data = utils.shuffledIntRange(min, max).map(function(id) {
                return {
                    vk_id: id,
                    first_name: names.sample()
                }
            });
            return db.collection('players').insertMany(data);
        };

        for (var i = 0; i < seedSize; i += seedStep ) {
            var step = seedRange(i, Math.min(seedSize, i + seedStep - 1));
            chain = chain ? chain.then(step) : step;
        }

        return chain.then(function() {
            return db.collection('players').count()
        }).then(function(result) {
            console.log('Done seeding collection "players"; Total collection size: %d', result);
            db.close();
        });
    })
});

gulp.task("db:recreate", ["db:reset", "db:seed"]);

