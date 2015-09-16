var rand = exports.rand = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

var sample = exports.sample = function(str) {
    return str[rand(0, str.length)];
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

var shuffledIntRange = exports.shuffledIntRange = function(min, max) {
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
