'use strict';

/**
 * web app 的启动入口
 */
import $                from './js-libs-es6/zepto-modules';
import cookie           from './js-libs-es6/cookie/cookie';
import page             from './model/page';
import pages            from './pages/pages';
import config           from './model/config';
import loading          from './model/loading';

$(document).ready(function () {
    loading.hide('loading_global');
    cookie.init(config.cookiePrefix);
    page.init();
});