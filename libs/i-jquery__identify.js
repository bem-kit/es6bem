/**
 * Identify plugin
 *
 * @version 1.0.0
 */

(function($) {
var counter = 0,
    expando = '__' + Number(new Date()),
    get = function() {
        return 'uniq' + (++counter);
    };

/**
 * Makes unique ID
 * @param {Object} [obj] Object that needs to be identified
 * @param {Boolean} [onlyGet=false] Return a unique value only if it had already been assigned before
 * @returns {String} ID
 */
$.identify = function(obj, onlyGet) {
    if(!obj) { return get(); }

    var key = 'uniqueID' in obj ? 'uniqueID' : expando; // Use when possible. native uniqueID for elements in IE

    return onlyGet || key in obj ?
        obj[key] :
        obj[key] = get();
};
})(jQuery);
