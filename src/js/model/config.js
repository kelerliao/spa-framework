'use strict';

import param from '../js-libs-es6/param/param';

const config = {
    stats: {
        statsUrl: 'http://act.html5.qq.com/qb_ams?cmd=report&',
        actId: 'ar-activity',
        openid: '',
        channelId: param.getKey('channel') || 'normal'
    },

    cookiePrefix: 'ar',//本活动所有cookie名（key）的前缀
    apiUrl: 'http://act.html5.qq.com/zhongchou',//后台接口的url
    mainUrl: 'http://pms.mb.qq.com/index?aid=act13&cid=0613daomu&channel='
};

export default config;
