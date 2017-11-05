/**
 * @fileOverview share模块，包含设置分享信息和调起qb分享面板
 * @author: dovezhang
 */
import core             from '../core';
import env              from '../env/env';
import loader           from '../loader/load';


let jsApi = {
    qq: {
        url: '//pub.idqqimg.com/qqmobile/qqapi.js?_bid=152',
        apiName: 'mqq.ui.setOnShareHandler,mqq.ui.shareMessage,mqq.ui.showShareMenu'
    },
    wx: {
        url: '//res.wx.qq.com/open/js/jweixin-1.0.0.js',
        apiName: 'onMenuShareTimeline,onMenuShareAppMessage,onMenuShareQQ,onMenuShareQZone'
    },
    qb: {
        url: '//jsapi.qq.com/get?api=app.setShareInfo,app.share',
        apiName: 'browser.app.setShareInfo,browser.app.share'
    }
};

//微信jsSDK配置
let getWeixinConfig = function (tokenurl, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', tokenurl);

    xhr.onload = function () {
        let o = JSON.parse(xhr['response']);

        let config = {
            debug: false,
            appId: o.appid || 'wxe96fbdefcd9adbff',
            timestamp: o.timestamp - 0,
            nonceStr: o['noncestr'],
            signature: o.signature,
            jsApiList: jsApi.wx.apiName.split(',')
        };

        this.onload = null;
        callback(config);
    };

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('url=' + encodeURIComponent(location.href.split('#')[0]));
};

let loadJs = function (url, apiName, cb) {
    if (core.has(apiName)) {
        cb();
    } else {
        loader.load({
            url: {
                js: url
            },
            success: cb
        });
    }
};

let callbackFn = null,
    qbShareInfo = null;

let setInfo = function (options) {

    core.type(options.callback) == 'function' && (callbackFn = options.callback);

    jsApi.hasOwnProperty(env.appName) && loadJs(jsApi[env.appName].url, jsApi[env.appName].apiName, function () {

        options = options || {};

        let qqShareInfoObj;
        let callback = function (state, type) {
            return function () {
                core.type(callbackFn) == 'function' && callbackFn({state: state, type: type});
            };
        };

        switch (env.appName) {
            case 'qq':
                qqShareInfoObj = {
                    title: options.title,
                    share_url: options.url,
                    desc: options.desc,
                    image_url: options.img
                };

                //分享事件监听器，在点击分享的某个logo(qq,qzone,wx,pyq)后触发
                //系统不再执行默认的分享行为,需要调用mqq.ui.shareMessage进行分享
                if (core.has('mqq.ui.setOnShareHandler')) {
                    window.mqq.ui.setOnShareHandler(function (type) {
                        qqShareInfoObj.share_type = type;
                        /*0：QQ好友
                         1：QQ空间
                         2：微信好友
                         3：微信朋友圈
                         */

                        //分享到QQ好友后返回页面
                        qqShareInfoObj.back = true;

                        //发送分享，result为分享后返回的{'retCode': xx}对象，xx=0表示分享成功，否则不成功
                        if (core.has('mqq.ui.shareMessage')) {
                            window.mqq.ui.shareMessage(qqShareInfoObj, function (result) {
                                callback(result.retCode === 0 ? 0 : -1, type)();
                            });
                        }
                    });
                }
                break;
            case 'wx':
                options.wxconfurl && getWeixinConfig(options.wxconfurl, function (config) {
                    let wxhy = core.type(options['wxhy']) === 'object' ? options['wxhy'] : {},
                        wxpyq = core.type(options['wxpyq']) === 'object' ? options['wxpyq'] : {};

                    window.wx.config(config);

                    window.wx.ready(function () {

                        window.wx.onMenuShareQQ({
                            title: options.title,
                            link: options.url,
                            desc: options.desc,
                            imgUrl: options.img,
                            success: callback(0, 0),
                            cancel: callback(-1, 0)
                        });

                        window.wx.onMenuShareQZone({
                            title: options.title,
                            link: options.url,
                            desc: options.desc,
                            imgUrl: options.img,
                            success: callback(0, 1),
                            cancel: callback(-1, 1)
                        });

                        window.wx.onMenuShareAppMessage({
                            title: wxhy.title || options.title,
                            link: wxhy.url || options.url,
                            desc: wxhy.desc || options.desc,
                            imgUrl: wxhy.img || options.img,
                            success: callback(0, 2),
                            cancel: callback(-1, 2)
                        });

                        window.wx.onMenuShareTimeline({
                            title: wxpyq.title || options.title,
                            link: wxpyq.url || options.url,
                            desc: wxpyq.desc || options.desc,
                            imgUrl: wxpyq.img || options.img,
                            success: callback(0, 3),
                            cancel: callback(-1, 3)
                        });
                    });
                });
                break;
            case 'qb':
                qbShareInfo = {
                    title: options.title,
                    url: options.url || location.href,
                    description: options.desc,
                    img_url: options.img
                };

                window.browser.app.setShareInfo(qbShareInfo, function (data) {});
                break;
        }
    });
};

let showPanel = function (callback, wxcallback) {
    core.type(callback) == 'function' && (callbackFn = callback);

    if (env.appName == 'wx') {
        core.type(wxcallback) == 'function' && wxcallback();
        return;
    }

    jsApi.hasOwnProperty(env.appName) && loadJs(jsApi[env.appName].url, jsApi[env.appName].apiName, function () {
        switch (env.appName) {
            case 'qq':
                window.mqq.ui.showShareMenu();
                break;
            case 'qb':
                window.browser.app.share(qbShareInfo, function (data) {
                    if (core.type(callbackFn) == 'function') {
                        if (env.isIOS) {
                            callbackFn({state: +data.code === 1 ? 0 : -1});
                        } else if (env.isAndroid) {
                            // 4:qq好友, 3:qq空间, 1:微信, 8:朋友圈
                            let type = data.app === 4 ? 0 : data.app === 3 ? 1 : data.app === 1 ? 2 : data.app === 8 ? 3 : undefined;
                            callbackFn({state: data.result === 0 ? 0 : -1, type: type});
                        }
                    }
                });
        }
    });
};


export default {
    showPanel,
    setInfo
};