'use strict';

/**
 * 游戏活动结束页
 */

import render from '../../js-libs-es6/render/render';
import event from '../../js-libs-es6/event/event';
import page from '../../model/page';

page.cover = {
    _$wrap: null,
    pageClassName: 'cover-page',
    _template: '<% cover/template.htm %>',

    show: function ($wrap) {
        this._$wrap = $wrap;
        this._reader();
    },

    _reader: function () {
        this._$wrap.html(render.html(this._template, {}));
        this._bindEvent();
    },

    _bindEvent: function () {
        event.on(this._$wrap[0], 'tap', {
            gotoShow3dPage: function () {
                page.goto('arscan');
            }
        });
    }
};

