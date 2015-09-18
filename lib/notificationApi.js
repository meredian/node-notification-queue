var RateLimiter = require('limiter').RateLimiter;

// Let's emulate slow net request
function delay(fn, thisArg) {
    return function() {
        setTimeout(() => {
            fn.apply(thisArg, arguments);
        }, Math.round(Math.random() * 100 + 50));
    };
}

// Export declaration not yet done in V8 without transpilers
const MAX_IDS_COUNT = exports.MAX_IDS_COUNT = 100;

const MAX_RPS_RATE = exports.MAX_RPS_RATE = 3;
var limiter = new RateLimiter(MAX_RPS_RATE, 1000, true);

const SOME_ERROR_CODE = exports.SOME_ERROR_CODE = 15;

exports.sendNotification = delay(function(idsString, text, callback) {
    var ids = idsString.split(',');
    if (ids.length > MAX_IDS_COUNT) {
        console.log('Ooops! Too many ids');
        return callback({error_code: SOME_ERROR_CODE, error_message: 'Too many ids'});
    }

    limiter.removeTokens(1, function(err, remaining) {
        if (err || remaining == -1) {
            console.log('Too frequent requests');
            return callback({error_code: SOME_ERROR_CODE, error_message: 'Too frequent requests'});
        } else {
            console.log('Message: %s Sendind ids: ', text, idsString);
            return callback(null, idsString);
        }
    });
});
