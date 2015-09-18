var rand = exports.rand = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

var sample = exports.sample = function(arrayLike) {
    return arrayLike[rand(0, arrayLike.length)];
};

var randomName = exports.randomName = function(minLength, maxLength) {
    var length = rand(minLength, maxLength);
    var s = sample('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    for (var i = 0; i < length - 1; ++i) {
        s += sample('abcdefghijklmnopqrstuvwxyz');
    }
    return s;
};

var NameSet = exports.NameSet = function(size) {
    var names = new Set();
    for (var i = 0; i < size; ++i) {
        names.add(randomName(5, 10));
    }
    this.names = Array.from(names);
};

NameSet.prototype.sample = function() {
    return this.names[rand(0, this.names.length - 1)];
};

exports.shuffledIntRange = function(min, max) {
    var a = [];
    for (var i = 0; i < (max - min); ++i) {
        a[i] = min + i;
    }

    function shuffle(arr) {
        var tmp, cur, top = arr.length;
        while (--top) {
            cur = rand(0, top + 1);
            tmp = arr[top];
            arr[top] = arr[cur];
            arr[cur] = tmp;
        }
        return arr;
    }

    return shuffle(a);
};

exports.promisify = function(fn, thisArg) {
    return function(...inArgs) {
        return new Promise(function(fulfill, reject) {
            inArgs.push(function(err, ...outArgs) {
                if (err) {
                    reject(err);
                } else {
                    fulfill(outArgs.length > 1 ? outArgs : outArgs[0]);
                }
            });
            fn.apply(thisArg || fn, inArgs);
        });
    };
};

exports.sleep = function(timeout) {
    return new Promise(function(fulfill) {
        setTimeout(function() {
            fulfill();
        }, timeout);
    });
};
