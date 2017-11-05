'use strict';

/**
 * page 管理
 */
import $                from '../js-libs-es6/zepto-modules';
import event            from '../js-libs-es6/event/event';
import hash             from '../js-libs-es6/hash/hash';

const page = {
    _$wrap: null,
    _curId: null,
    _page: 'cover', // 配置默认页面，hash 的 page 值为空时，就使用该默认值

    init: function () {
        var hashPage = hash.getKey('page');

        this._$wrap = $('#pageWrap');
        this._bindEvent();

        if (hashPage) {
            this._page = hashPage;
            this.goto(this._page, true);
        } else {
            hash.setKey('page', this._page);
        }
    },

    goto: function (id, isFromHashChange) {
        var _self = this;
        if (id === this._curId || page[id] == null) {
            return;
        }

        if (isFromHashChange) {
            console.log('goto()::id =', id, isFromHashChange);

            event.off(this._$wrap[0], 'tap');
            this._setClassName(page[id].pageClassName);
            page[id].show(_self._$wrap);
            this._curId = id;
        }
        else {
            hash.setKey('page', id);
        }
    },

    _bindEvent: function () {
        var _self = this;

        window.addEventListener('hashchange', function () {
            _self.goto(hash.getKey('page'), true);
        });
    },

    _setClassName: function (id) {
        this._$wrap.attr('class', id);
    },
};

export default page;

