var BEM = {};
BEM.DOM = {};

// ------------------------------

/**
 * Separator for modifiers and their values
 * @const
 * @type String
 */
var MOD_DELIM = '_',

/**
 * Separator between names of a block and a nested element
 * @const
 * @type String
 */
    ELEM_DELIM = '__',

/**
 * Pattern for acceptable element and modifier names
 * @const
 * @type String
 */
    NAME_PATTERN = '[a-zA-Z0-9-]+';

function buildModPostfix(modName, modVal, buffer) {
    buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);
}

function buildBlockClass(name, modName, modVal, buffer) {
    buffer.push(name);
    modVal && buildModPostfix(modName, modVal, buffer);
}

function buildElemClass(block, name, modName, modVal, buffer) {
    buildBlockClass(block, undefined, undefined, buffer);
    buffer.push(ELEM_DELIM, name);
    modVal && buildModPostfix(modName, modVal, buffer);
}

var INTERNAL = BEM.INTERNAL = {

    NAME_PATTERN: NAME_PATTERN,

    MOD_DELIM: MOD_DELIM,
    ELEM_DELIM: ELEM_DELIM,

    buildModPostfix: function(modName, modVal, buffer) {
        var res = buffer || [];
        buildModPostfix(modName, modVal, res);
        return buffer ? res : res.join('');
    },

    /**
     * Builds the class of a block or element with a modifier
     * @private
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @param {Array} [buffer] Buffer
     * @returns {String|Array} Class or buffer string (depending on whether the buffer parameter is present)
     */
    buildClass: function(block, elem, modName, modVal, buffer) {
        var typeOf = typeof modName;
        if(typeOf == 'string') {
            if(typeof modVal != 'string' && typeof modVal != 'number') {
                buffer = modVal;
                modVal = modName;
                modName = elem;
                elem = undefined;
            }
        } else if(typeOf != 'undefined') {
            buffer = modName;
            modName = undefined;
        } else if(elem && typeof elem != 'string') {
            buffer = elem;
            elem = undefined;
        }

        if(!(elem || modName || buffer)) { // Оптимизация для самого простого случая
            return block;
        }

        var res = buffer || [];

        elem ?
            buildElemClass(block, elem, modName, modVal, res) :
            buildBlockClass(block, modName, modVal, res);

        return buffer ? res : res.join('');
    },

    /**
     * Builds full classes for a buffer or element with modifiers
     * @private
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {Object} [mods] Modifiers
     * @param {Array} [buffer] Buffer
     * @returns {String|Array} Class or buffer string (depending on whether the buffer parameter is present)
     */
    buildClasses: function(block, elem, mods, buffer) {
        if(elem && typeof elem != 'string') {
            buffer = mods;
            mods = elem;
            elem = undefined;
        }

        var res = buffer || [];

        elem ?
            buildElemClass(block, elem, undefined, undefined, res) :
            buildBlockClass(block, undefined, undefined, res);

        mods && $.each(mods, function(modName, modVal) {
            if(modVal) {
                res.push(' ');
                elem ?
                    buildElemClass(block, elem, modName, modVal, res) :
                    buildBlockClass(block, modName, modVal, res);
            }
        });

        return buffer ? res : res.join('');
    }
};

// ------------------------------


var win = $(window),
    doc = $(document),

/**
 * Storage for DOM elements by unique key
 * @private
 * @type {Object}
 */
    uniqIdToDomElems = {},

/**
 * Storage for blocks by unique key
 * @static
 * @private
 * @type {Object}
 */
    uniqIdToBlock = {},

/**
 * Storage for block parameters
 * @private
 * @type {Object}
 */
    domElemToParams = {},

/**
 * Storage for liveCtx event handlers
 * @private
 * @type {Object}
 */
    liveEventCtxStorage = {},

/**
 * Storage for liveClass event handlers
 * @private
 * @type {Object}
 */
    liveClassEventStorage = {},

    blocks = BEM.blocks,

    INTERNAL = BEM.INTERNAL,

    NAME_PATTERN = INTERNAL.NAME_PATTERN,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    buildModPostfix = INTERNAL.buildModPostfix,
    buildClass = INTERNAL.buildClass,

    slice = Array.prototype.slice,
    reverse = Array.prototype.reverse;

/**
 * Initializes blocks on a DOM element
 * @private
 * @param {jQuery} domElem DOM element
 * @param {String} uniqInitId ID of the "initialization wave"
 */
function init(domElem, uniqInitId) {
    var domNode = domElem[0];
    $.each(getParams(domNode), function(blockName, params) {
        processParams(params, domNode, blockName, uniqInitId);
        var block = uniqIdToBlock[params.uniqId];
        if(block) {
            if(block.domElem.index(domNode) < 0) {
                block.domElem = block.domElem.add(domElem);
                $.extend(block._params, params);
            }
        } else {
            initBlock(blockName, domElem, params);
        }
    });
}

/**
 * Initializes a specific block on a DOM element, or returns the existing block if it was already created
 * @private
 * @param {String} blockName Block name
 * @param {jQuery} domElem DOM element
 * @param {Object} [params] Initialization parameters
 * @param {Boolean} [forceLive] Force live initialization
 * @param {Function} [callback] Handler to call after complete initialization
 * @returns {BEM.DOM}
 */
function initBlock(blockName, domElem, params, forceLive, callback) {
    if(typeof params == 'boolean') {
        callback = forceLive;
        forceLive = params;
        params = undefined;
    }

    var domNode = domElem[0];
    params = processParams(params || getParams(domNode)[blockName], domNode, blockName);

    var uniqId = params.uniqId;
    if(uniqIdToBlock[uniqId]) {
        return uniqIdToBlock[uniqId]._init();
    }

    uniqIdToDomElems[uniqId] = uniqIdToDomElems[uniqId] ?
        uniqIdToDomElems[uniqId].add(domElem) :
        domElem;

    var parentDomNode = domNode.parentNode;
    if(!parentDomNode || parentDomNode.nodeType === 11) { // JQuery doesn't unique disconnected node
        $.unique(uniqIdToDomElems[uniqId]);
    }

    var BlockClass = blocks[blockName] || DOM.decl(blockName, {}, {live: true});
    if(!(BlockClass._liveInitable = Boolean(BlockClass._processLive())) || forceLive || params.live === false) {
        forceLive && domElem.addClass('i-bem');

        var block = new BlockClass(uniqIdToDomElems[uniqId], params, Boolean(forceLive));

        delete uniqIdToDomElems[uniqId];
        callback && callback.apply(block, slice.call(arguments, 4));
        return block;
    }
}

/**
 * Processes and adds necessary block parameters
 * @private
 * @param {Object} params Initialization parameters
 * @param {HTMLElement} domNode DOM node
 * @param {String} blockName Block name
 * @param {String} [uniqInitId] ID of the "initialization wave"
 * @returns {Object}
 */
function processParams(params, domNode, blockName, uniqInitId) {
    (params || (params = {})).uniqId ||
        (params.uniqId = (params.id ? blockName + '-id-' + params.id : $.identify()) + (uniqInitId || $.identify()));

    var domUniqId = $.identify(domNode),
        domParams = domElemToParams[domUniqId] || (domElemToParams[domUniqId] = {});

    domParams[blockName] || (domParams[blockName] = params);

    return params;
}

/**
 * Helper for searching for a DOM element using a selector inside the context, including the context itself
 * @private
 * @param {jQuery} ctx Context
 * @param {String} selector CSS selector
 * @param {Boolean} [excludeSelf=false] Exclude context from search
 * @returns {jQuery}
 */
function findDomElem(ctx, selector, excludeSelf) {
    var res = ctx.find(selector);
    return excludeSelf ?
       res :
       res.add(ctx.filter(selector));
}

/**
 * Returns parameters of a block's DOM element
 * @private
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function getParams(domNode) {
    var uniqId = $.identify(domNode);
    return domElemToParams[uniqId] ||
           (domElemToParams[uniqId] = extractParams(domNode));
}

/**
 * Retrieves block parameters from a DOM element
 * @private
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function extractParams(domNode) {
    var fn,
        elem,
        attr = domNode.getAttribute('data-bem');

    if(attr) {
        return JSON.parse(attr);
    }

    fn = domNode.onclick || domNode.ondblclick;

    // LEGO-2027 in FF onclick doesn't work on body
    if(!fn && domNode.tagName.toLowerCase() == 'body') {
        elem = $(domNode);
        attr = elem.attr('onclick') || elem.attr('ondblclick');
        /*jshint -W054 */
        attr && (fn = new Function(attr));
        /*jshint +W054 */
    }

    return fn ? fn() : {};
}

/**
 * Cleans up all the BEM storages associated with a DOM node
 * @private
 * @param {HTMLElement} domNode DOM node
 */
function cleanupDomNode(domNode) {
    delete domElemToParams[$.identify(domNode)];
}

/**
 * Uncople DOM node from the block. If this is the last node, then destroys the block.
 * @private
 * @param {BEM.DOM} block block
 * @param {HTMLElement} domNode DOM node
 */
function removeDomNodeFromBlock(block, domNode) {
    block.domElem.length === 1 ?
        block.destruct(true) :
        block.domElem = block.domElem.not(domNode);
}

/**
 * Returns a block on a DOM element and initializes it if necessary
 * @param {String} blockName Block name
 * @param {Object} params Block parameters
 * @returns {BEM.DOM}
 */
$.fn.bem = function(blockName, params) {
    return initBlock(blockName, this, params, true);
};
