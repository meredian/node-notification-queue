var MongoClient = require('mongodb').MongoClient;
var mongoConfig = require('../config').mongo_db;

function buildUrl(config) {
    return [
        'mongodb://',
        config.user ? (config.user + ':' + config.password + '@') : '',
        config.host, ':', config.port,
        '/', config.database
    ].join('');
}

exports.connect = function(callback) {
    return MongoClient.connect(buildUrl(mongoConfig), callback);
};
