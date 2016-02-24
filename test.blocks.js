_.set(window, 'Ya.Images.ThumbsStore', {});


//
// block page
//
var PageCommon = (()=>{'use strict';
    class PageCommon extends BEM.DOM {
        constructor(name, params){
            super('.b-page', params);
        }

        /**
         * Обновляет тайтл страницы
         *
         * @param {String} title - тайтл для страницы
         */
        updateTitle (title) { document.title = _.unescape(title); }

        _getFilterParams () { return _.noop() }

        bindEvents () {
            this.bindToWin('resize', $.throttle(this._onResize, 200, this));
            this.bindToWin('scroll', $.throttle(this._onDomScroll, 200, this));
            BEM.blocks['i-global'].param('mobile') &&
                this.bindToWin('touchmove', $.throttle(this._onTouchMove, 200, this));

            return this;
        }

        _onResize () {
            this.trigger('resize');
        }

        _onTouchMove () {
            this.trigger('touchmove');
        }

        _onDomScroll () {
            var _this = this;
            // @see: https://developer.mozilla.org/en-US/docs/Web/Events/scroll
            _this.trigger('scroll');
        }

    }
    return PageCommon;
})();

BEM.es6decl('b-page', PageCommon);

new PageCommon();



//
// i-preloader: предзагрузчик картинок (TODO заюзать Cach API, когда браузеры пофиксят баги)
//
var Preloader = (()=>{'use strict';
    class Preloader extends BEM { /* todo implement later */ }
    return Preloader;
})();
BEM.es6decl('i-preloader', Preloader);



//
// block preview - просмотр картинок
//
var PreviewCommon = (()=>{'use strict';
    class PreviewCommon extends BEM.DOM {
        constructor(name, params){
            super('.preview2', params);
            this._preloader = BEM.create({ block: 'i-preloader', mods: { timeout: 'yes', 'preview-speed': 'yes' } });
            this.thumb = this.elem('thumb');
            this._spin = this.findBlockOn(this.elem('spin'), 'spinner');
            this._store = _.get(window, 'Ya.Images.ThumbsStore');
        }
    }
    return PreviewCommon;
})();

BEM.es6decl('preview2', PreviewCommon);

new PreviewCommon();