require('harmony-reflect');

// Just one-level deep property cache. Not enought strict for
// production, but still fun
module.exports = function(target, props) {
    if (!target._obj) {
        throw new Error('Object for PropertyCacheProxy must have _obj property as source object');
    }

    return Proxy(target, {
        get: function(target, name) {
            if (props.indexOf(name) >= 0) {
                if (target._cache && target._cache.hasOwnProperty(name)) {
                    return target._cache[name];
                }
                return target._obj[name];
            }
            return target[name];
        },
        set: function(target, name, val) {
            if (props.indexOf(name) >= 0) {
                if (!target._cache) {
                    target._cache = {};
                }
                target._cache[name] = val;
            } else {
                target[name] = val;
            }
            return true;
        }
    });
};
