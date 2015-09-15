var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var env = process.env.NODE_ENV || 'development';
var configPath = path.join(__dirname, env + '.yml');

module.exports = yaml.safeLoad(fs.readFileSync(configPath));
