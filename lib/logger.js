var _ = require('lodash');
var bunyan = require('bunyan');

var config = require('../config');

var streams = _.reduce(config.logger, function(memo, name, value) {
    var stream = {
        level: value.level
    };
    if (name === 'console') {
        stream.stream = process.stdout;
    } else if (name === 'file') {
        stream.path = value.path;
    }
    memo.push(stream);
}, []);

module.exports = bunyan.createLogger({
    name: config.name,
    streams: streams
});
