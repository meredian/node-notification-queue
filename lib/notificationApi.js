// Let's emulate slow net request
function delayCallback(self, callback) {
    return function() {
        var args = arguments;
        setTimeout(function() {
            callback.apply(self, args);
        }, Math.round(Math.random() * 200 + 50));
    }
}

const MAX_IDS_COUNT = 100;
const MAX_RPS_RATE = 3;
var rpsRate = 0;
var rpsTimestamp = 0;

const SOME_ERROR_CODE = 15;

exports.sendNotification = function(idsString, text, callback) {
    var delayed = delayCallback(this, callback);

    var ids = idsString.split(',');
    if (ids.length > MAX_IDS_COUNT) {
        return delayed({error_code: SOME_ERROR_CODE, error_message: 'Too many ids'});
    }

    var timestamp = Math.floor(Date.now() / 1000);
    if (timestamp === rpsTimestamp) {
        if (rpsRate >= MAX_RPS_RATE) {
            return delayed({error_code: SOME_ERROR_CODE, error_message: 'Too frequent requests'});
        }
        ++rpsRate;
    } else {
        rpsTimestamp = timestamp;
        rpsRate = 1;
    }

    delayed(null, idsString);
};
