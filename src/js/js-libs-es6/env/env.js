/**
 * @fileOverview env模块，无依赖，判断当前所在的 app，os 系统及版本
 * @author: dovezhang
 */

let env = {
    appName: 'unknown',//app的名称，如qq，qb
    appVersion: '',//app的版本，如6.1
    osVersion: ''//操作系统版本，如8.1
};

let app = {
    isQQ: /mobile.*qq\/(\S+)\s+.*nettype/i,
    isWX: /micromessenger\/(\S+)\s+.*nettype/i,
    isQB: /mqqbrowser\/(\S+)\s+mobile/i,
    isWblog: /mobile.*txmicroblog(\d+)$/i, // 腾讯微博 User-Agent: Mozilla/5.0 (Linux; Android 4.4.2; PE-TL10 Build/HuaweiPE-TL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36 TXMicroBlog603
    isWeibo: /mobile.*weibo[_\s]*([\d\.]+)/i, // 新浪微博 User-Agent: Mozilla/5.0 (Linux; Android 4.4.2; PE-TL10 Build/HuaweiPE-TL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36 Weibo (HUAWEI-PE-TL10__weibo__5.3.0__android__android4.4.2)
    isQzone: /qzone.*_qz_([^_]+)_/i
};

let os = {
    isIOS: /(?:ipad|iphone|ipod).*os\s+(\S+)\s+like\s+mac\s+os/i,
    isAndroid: /android\s+(\S+);/i
};

let regExpRet,
    key,
    ua = window.navigator.userAgent;

for (key in app) {
    if (app.hasOwnProperty(key)) {
        regExpRet = app[key].exec(ua);
        env[key] = !!regExpRet;

        if (regExpRet) {
            env.appVersion = regExpRet[1];
            env.appName = key.substr(2).toLowerCase();
        }
    }
}

for (key in os) {
    if (os.hasOwnProperty(key)) {
        regExpRet = os[key].exec(ua);
        env[key] = !!regExpRet;
        regExpRet && (env.osVersion = regExpRet[1]);
    }
}

try {
    env.isSupportWebp = document.createElement('canvas').toDataURL('image/webp').indexOf('image/webp') > -1;
} catch (err) {
    env.isSupportWebp = false;
}

/**
 * @example
 *```
 *h5.env.appName //app名称，全小写，如qzone，wx，qq
 *h5.env.appVersion //app版本，如6.1
 *
 *h5.env.isIOS //是否IOS
 *h5.env.isAndroid //是否安卓
 *h5.env.osVersion //操作系统版本
 *
 *h5.env.isQQ //是否是QQ
 *h5.env.isWX //是否是微信
 *h5.env.isQB //是否是QQ浏览器
 *h5.env.isWblog //是否是腾讯微博
 *h5.env.isWeibo //是否是新浪微博
 *h5.env.isQzone //是否是QQ空间
 *
 * h5.env.isSupportWebp // 是否支持 webp 的图片格式
 *```
 */

export default env;