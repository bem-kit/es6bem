module.exports.Observable = (()=>{
'use strict';

var storageExpando = '__' + Number(new Date()) + 'storage',
    getFnId = function(fn, ctx) {
        return $.identify(fn) + (ctx ? $.identify(ctx) : '');
    };

class Observable {

    /**
     * Builds full event name
     * @protected
     * @param {String} e Event type
     * @returns {String}
     */
    buildEventName (e) {
        return e;
    }

    /**
     * Adding event handler
     * @param {String} e Event type
     * @param {Object} [data] Additional data that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [ctx] Handler context
     * @returns {$.observable}
     */
    on (e, data, fn, ctx, _special) {
        if(typeof e == 'string') {
            if($.isFunction(data)) {
                ctx = fn;
                fn = data;
                data = undefined;
            }

            var id = getFnId(fn, ctx),
                storage = this[storageExpando] || (this[storageExpando] = {}),
                eList = e.split(' '),
                i = 0,
                eStorage;

            while((e = eList[i++])) {
                e = this.buildEventName(e);
                eStorage = storage[e] || (storage[e] = {ids: {}, list: {}});

                if(!(id in eStorage.ids)) {
                    var list = eStorage.list,
                        item = {fn: fn, data: data, ctx: ctx, special: _special};
                    if(list.last) {
                        list.last.next = item;
                        item.prev = list.last;
                    } else {
                        list.first = item;
                    }

                    eStorage.ids[id] = list.last = item;
                }
            }
        } else {
            var self = this;
            $.each(e, function(e, fn) {
                self.on(e, fn, data, _special);
            });
        }
        return this;
    }

    onFirst (e, data, fn, ctx) {
        return this.on(e, data, fn, ctx, {one: true});
    }

    /**
     * Removing event handler(s)
     * @param {String} [e] Event type
     * @param {Function} [fn] Handler
     * @param {Object} [ctx] Handler context
     * @returns {$.observable}
     */
    un (e, fn, ctx) {
        if(typeof e == 'string' || typeof e == 'undefined') {
            var storage = this[storageExpando];
            if(storage) {
                if(e) { // If event type was passed
                    var eList = e.split(' '),
                        i = 0,
                        eStorage;
                    while((e = eList[i++])) {
                        e = this.buildEventName(e);
                        if((eStorage = storage[e])) {
                            if(fn) { // If specific handler was passed
                                var id = getFnId(fn, ctx),
                                    ids = eStorage.ids;
                                if(id in ids) {
                                    var list = eStorage.list,
                                        item = ids[id],
                                        prev = item.prev,
                                        next = item.next;

                                    if(prev) {
                                        prev.next = next;
                                    } else if(item === list.first) {
                                        list.first = next;
                                    }

                                    if(next) {
                                        next.prev = prev;
                                    } else if(item === list.last) {
                                        list.last = prev;
                                    }

                                    delete ids[id];
                                }
                            } else {
                                delete this[storageExpando][e];
                            }
                        }
                    }
                } else {
                    delete this[storageExpando];
                }
            }
        } else {
            var self = this;
            $.each(e, function(e, fn) {
                self.un(e, fn, ctx);
            });
        }
        return this;
    }

    /**
     * Fires event handlers
     * @param {String|$.Event} e Event
     * @param {Object} [data] Additional data
     * @returns {$.observable}
     */
    trigger (e, data) {
        var self = this,
            storage = self[storageExpando],
            rawType;

        typeof e === 'string' ?
            e = $.Event(self.buildEventName(rawType = e)) :
            e.type = self.buildEventName(rawType = e.type);

        e.target || (e.target = self);

        if(storage && (storage = storage[e.type])) {
            var item = storage.list.first,
                ret;
            while(item) {
                e.data = item.data;
                ret = item.fn.call(item.ctx || self, e, data);
                if(typeof ret !== 'undefined') {
                    e.result = ret;
                    if(ret === false) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }

                item.special && item.special.one &&
                    self.un(rawType, item.fn, item.ctx);
                item = item.next;
            }
        }
        return this;
    }
}

return Observable;
})();