'use strict';

/**
 * 判断登陆态
 */

import cache from './cache';


const login = {
    init: (cb) => {
        // 1. 调用 QB JSAPI 获取登陆态新，并写入 cache 模块
        // 2. 如果获取失败，则调用 QB JSAPI 调起终端的登陆页面进行登录
        // 3. cb 回调函数只返回 true=登陆成功并写入 cache； false=获取登陆态失败；
        cache.set('uid', '25487878');
        cache.set('nickname', 'kelerliao');
        cb(true);
    }
};

export default login;