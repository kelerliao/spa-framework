'use strict';

/**
 * 游戏活动结束页
 */

import render from '../../js-libs-es6/render/render';
import event from '../../js-libs-es6/event/event';
import page from '../../model/page';

page.arscan = {
    _$wrap: null,
    pageClassName: 'arscan-page',
    _template: '<% arscan/template.htm %>',

    show: function ($wrap) {
        this._$wrap = $wrap;
        this._reader();
    },

    _reader: function () {
        this._$wrap.html(render.html(this._template, {a:123}));
        this._bindEvent();
    },

    _bindEvent: function () {
        event.on(this._$wrap[0], 'tap', {
            gotoCoverPage: function () {
                page.goto('cover');
            }
        });
    }
};

