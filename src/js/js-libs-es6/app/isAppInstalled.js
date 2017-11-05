/**
 * @fileOverview 判断是否安装了某 app，如：用户手机是否已经安装微信
 * @author dovezhang
 */

import core             from '../core';
import env              from '../env/env';
import loader           from '../loader/load';

let conf = {
    qq: '//pub.idqqimg.com/qqmobile/qqapi.js?_bid=152',
    qb: '//jsapi.qq.com/get?api=app.isInstallApk,app.getAppVersion,app.getQua'
};

let loadJs = function (url, apiname, cb) {
    if (core.has(apiname)) {
        cb();
    } else {
        loader.load({
            url: {
                js: url
            },
            success: function () {
                setTimeout(cb, 200);
            }
        });
    }
};

/**
 * 根据 packageName 或 scheme 跨平台（wx、qq、qb）判断某 APP 是否已安装
 *
 * @param platformObj
 * @param cb
 * @example
 * ```
 * h5.app.isAppInstalled({
 *     ios: 'mqq',
 *     android: 'com.tencent.mobileqq'
 * }, function (ret) {
 *     console.log(ret); // true | false
 * });
 * ```
 */
let isAppInstalled = function (platformObj, cb) {
    /*platformObj = {
     android: 'com.tencent.mobileqq',
     ios: 'mqq'
     }*/

    // 过滤 undefined
    platformObj.android = platformObj.android || '';
    platformObj.ios = platformObj.ios || '';

    let isInstallForWX = function () {
        try {
            window.WeixinJSBridge.invoke('getInstallState', {
                'packageUrl': platformObj.ios,
                'packageName': platformObj.android
            }, function (res) {
                cb(/yes/.test(res['err_msg']));
            });
        } catch (err) {
            console.error(err);
            cb(false);
        }
    };

    if (env.isQB) {
        loadJs(conf.qb, 'browser.app.isInstallApk', function () {
            let obj = env.isAndroid ? {packagename: platformObj.android} : env.isIOS ? {apkKey: platformObj.ios} : {};

            try {
                window.browser.app.isInstallApk(function (ret) {
                    cb(ret);
                }, obj);
            } catch (e) {
                if (window.browser && window.browser.define) {
                    if (env.isIOS) {
                        window.browser.define('browser.app.isInstallApk', function (callback, options) {
                            if (core.has('x5.exec')) {
                                window.x5.exec(function (data) {
                                    if (data.resCode) {
                                        callback && callback(true);
                                    } else {
                                        callback && callback(false);
                                    }
                                }, function () {}, 'app', 'isInstallApk', [options]);
                            }
                            // 若执行 x5.exec 函数异常，则当做用户没有安装要检查的 app
                            else {
                                callback(false);
                            }
                        });
                    } else if (env.isAndroid) {
                        window.browser.define('browser.app.isInstallApk', function (callback, options) {
                            let code;

                            try {
                                code = window.x5mtt.packages().isApkInstalled(JSON.stringify(options));
                            } catch (err) {
                                // 若执行 x5mtt.packages().isApkInstalled 函数异常，则当做用户没有安装要检查的 app
                                code = false;
                                console.error(err);
                            }

                            if (code == 1) {
                                callback && callback(true);
                            } else {
                                callback && callback(false);
                            }
                        });
                    }

                    window.browser.app.isInstallApk(function (ret) {
                        cb(ret);
                    }, obj);
                }
            }
        });
    }
    else if (env.isWX) {
        if (core.has('WeixinJSBridge.invoke')) {
            isInstallForWX();
        } else {
            let intervalId = setInterval(function () {
                if (core.has('WeixinJSBridge.invoke')) {
                    clearInterval(intervalId);
                    isInstallForWX();
                }
            }, 50);

            //有些手机的微信中没有WeixinJSBridgeReady事件
            //document.addEventListener('WeixinJSBridgeReady', isInstallForWX, false);
        }
    }
    else if (env.isQQ) {
        loadJs(conf.qq, 'mqq.app.isAppInstalled', function () {
            let value = env.isAndroid ? platformObj.android : env.isIOS ? platformObj.ios : '';

            // 延时写在了 loadJs 的 callback 中
            try {
                window.mqq.app.isAppInstalled(value, function (res) {
                    cb(res);
                });
            } catch (err) {
                console.error(err);
                cb(false);
            }
        });
    } else {
        cb(false);
    }
};

/**
 *@for h5.app
 *
 *判断用户是否安装QQ浏览器
 *
 *@param {Function} callback (result) 回调函数
 *    @param {Boolean} callback.result 是否已安装QQ浏览器的布尔值
 *
 *@example
 *```
 *h5.app.hasQB(function(result){
 *    if(result){
 *        console.log('has qb')
 *    }else{
 *        console.log('no qb');
 *    }
 *})
 *```
 */
let hasQB = function (callback) {
    isAppInstalled({
        android: 'com.tencent.mtt',
        ios: 'mttbrowser://'
    }, callback);
};


export default {
    isAppInstalled,
    hasQB
};
