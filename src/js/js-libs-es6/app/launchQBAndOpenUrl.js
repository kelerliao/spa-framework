/**
 * 启动QB，并且在QB中打开指定的URL
 */

var MTTBrowser = {};
//ios wx
/*
MTTBrowser.ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12B466 MicroMessenger/6.2 NetType/WIFI Language/zh_CN";
*/
//android qq
/*
 MTTBrowser.ua = "Mozilla/5.0 (Linux; U; Android 4.4.2; zh-cn; SM-N9006 Build/KOT49H) AppleWebKit/533.1 (KHTML, like Gecko)Version/4.0 MQQBrowser/5.4 TBS/025438 Mobile Safari/533.1 V1_AND_SQ_5.7.2_260_YYB_D QQ/5.7.2.2490 NetType/WIFI WebP/0.3.0";
 */
//android wx
/*
 MTTBrowser.ua = "Mozilla/5.0 (Linux; U; Android 4.4.2; zh-cn; SM-N9006 Build/KOT49H) AppleWebKit/533.1 (KHTML, like Gecko)Version/4.0 MQQBrowser/5.4 TBS/025438 Mobile Safari/533.1 MicroMessenger/6.2.0.52_r1162382.561 NetType/WIFI Language/zh_CN";
 */
MTTBrowser.ua = navigator.userAgent;
MTTBrowser.isAndroid = false;
MTTBrowser.isIos = false;
MTTBrowser.isQb = false;
MTTBrowser.isQQ = false;
MTTBrowser.isQZ = false;
MTTBrowser.isWX = false;
MTTBrowser.isAP = false;
if(/android/ig.test(MTTBrowser.ua)){
    MTTBrowser.isAndroid = true;
}
if(/iphone|ipod|iPad/ig.test(MTTBrowser.ua)){
    MTTBrowser.isIos = true;
}
if(/mqqbrowser\/(\S+)\s+mobile/i.test(MTTBrowser.ua)){
    MTTBrowser.isQb = true;
}
if(/mobile.*qq\/(\S+)\s+.*nettype/i.test(MTTBrowser.ua)){
    MTTBrowser.isQQ = true;
}
if(/qzone/gi.test(MTTBrowser.ua)){
    MTTBrowser.isQZ = true;
    MTTBrowser.isQQ = false;
}
if(/micromessenger/gi.test(MTTBrowser.ua)){
    MTTBrowser.isWX = true;
}
if (MTTBrowser.isQQ || MTTBrowser.isWX) {
    MTTBrowser.isQb = false;
}
MTTBrowser.config = {
    openUrl : location.href,
    packageName : 'com.tencent.mtt',
    iosWxBackparm : ",backparm=wechat://,iconid=6",
    iosQqBackparm : ",backparm=mqq://whatever,iconid=3",
    androidWxBackparm : ",packagename=com.tencent.mm",
    androidQqBackparm : ",packagename=com.tencent.mobileqq",
    qqApiUrl : "http://pub.idqqimg.com/qqmobile/qqapi.js?_bid=154",
    qbApiUrl : 'http://jsapi.qq.com/get?api=app.getAppVersion,app.getQua'
};
MTTBrowser.loadJs = function(url, callback) {
    var tmpScript = document.createElement("script");
    tmpScript.id = tmpScript.id || "qb_loadjs_" + new Date().getTime();
    tmpScript.type = "text/javascript";
    tmpScript.charset = "utf-8";
    if (tmpScript.readyState) {
        tmpScript.onreadystatechange = function() {
            if (tmpScript.readyState == "loaded" || tmpScript.readyState == "complete") {
                tmpScript.onreadystatechange = null;
                callback && callback();
            }
        };
    } else {
        tmpScript.onload = function() {
            callback && callback();
        };
    }
    tmpScript.src = url;
    var pageScript = document.getElementsByTagName("script")[0];
    pageScript.parentNode.insertBefore(tmpScript, pageScript);
};
/**
 * 获取下载状态
 * MTTBrowser.checkQbInstall(callback);
 */
MTTBrowser.checkQbInstall = function(callback) {
    if (MTTBrowser.isQQ) {
        MTTBrowser.qqCheckQbInstall(function(isInstall, version){
            callback(isInstall, version);
        });
    } else if (MTTBrowser.isWX){
        MTTBrowser.wxCheckQbInstall(function(isInstall, version){
            callback(isInstall, version);
        });
    } else if (MTTBrowser.isQb) {
        if (MTTBrowser.isIos){
            browser.app.getQua(function(strQua){
                if (strQua.indexOf('IQB60_B1/601546')  >= 0 || strQua.indexOf('IQB60_B1/601546') >= 0 ){
                    callback(true, '5.8');
                } else {
                    browser.app.getAppVersion(function(version){
                        var dataReg = version.match(/^\d\.\d/);
                        callback(true, parseFloat(dataReg[0]));
                    });
                }
            });
        } else {
            browser.app.getAppVersion(function(version){
                callback(true, version);
            });
        }
    } else {
        callback(false, 0);
    }
};
/*qq下，检查qb是否已安装*/
MTTBrowser.qqCheckQbInstall = function(callback){
    var schemeName = "";
    if (MTTBrowser.isIos === true) {
        schemeName = "mttbrowser";
    } else if (MTTBrowser.isAndroid) {
        schemeName = "com.tencent.mtt";
    }
    try {
        MTTBrowser.loadJs(MTTBrowser.config.qqApiUrl, function() {
            if(MTTBrowser.isAndroid){
                mqq.app.checkAppInstalled(schemeName, function (ret) {
                    if(!ret || ret != '0'){
                        var dataReg = ret.match(/^\d\.\d/);
                        callback(true, parseFloat(dataReg[0]));
                    } else {
                        callback(false, 0);
                    }
                });
            } else if(MTTBrowser.isIos){
                mqq.app.isAppInstalled(schemeName, function(results) {
                    if (results === true) {
                        callback(true, 0);
                    } else {
                        callback(false, 0);
                    }
                });
            }
        });
    } catch(e) {
        console.log('checkQbInstall', 'qq check error' + e.toString());
        callback(false, 0);
    }
};
MTTBrowser.wxJsApiCheckQbInstall = function(callback){
    MTTBrowser.wxJsApiOpenQBListener(function(){
        try {
            window.WeixinJSBridge.invoke("getInstallState", {
                packageUrl: "mttbrowser://",
                packageName: "com.tencent.mtt"
            }, function(results) {
                if (MTTBrowser.isAndroid) {
                    if (/get_install_state:yes/ig.test(JSON.stringify(results)) === true) {
                        var ret = JSON.stringify(results);
                        var dataReg = ret.match(/\_\d\d/);
                        var version = parseFloat(parseInt(dataReg[0].match(/\d\d/))/10);
                        callback(true, version);
                    } else {
                        callback(false, 0);
                    }
                } else if (MTTBrowser.isIos){
                    if (/get_install_state:yes/ig.test(JSON.stringify(results)) === true) {
                        callback(true, 0);
                    } else {
                        callback(false, 0);
                    }
                }
            });
        } catch(e) {
            console.log('checkQbInstall', 'wx check error' + e.toString());
        }
    });
};
MTTBrowser.wxCheckQbInstall = function(callback){
    //先采用TBS的方式检测
    if (typeof tbsJs != "undefined" && typeof tbsJs.packages != "undefined") {
        var tbsPackage = tbsJs.packages();
        if (typeof tbsPackage.isApkInstalled != "undefined" &&
            typeof tbsPackage.getApkInfo != "undefined") {

            if (tbsPackage.isApkInstalled('{"packagename": "com.tencent.mtt"}') == '1') {
                var qbInfo = JSON.parse(tbsPackage.getApkInfo('{"packagename": "com.tencent.mtt"}'));
                if (qbInfo.versioncode > 600000){
                    var versioncode = String(qbInfo.versioncode);
                    var version = parseFloat(parseInt(versioncode.match(/\d\d/))/10);
                    callback(true, version);
                } else if(qbInfo.versionname.substr(0,3) == 6.0){
                    callback(true, 6.0);
                } else {
                    callback(false, 0);
                }
            } else {
                callback(false, 0);
            }
        }else{
            MTTBrowser.wxJsApiCheckQbInstall(callback);
        }
    }else{
        MTTBrowser.wxJsApiCheckQbInstall(callback);
    }
};
MTTBrowser.wxCheckUCInstall = function(callback){
    MTTBrowser.wxJsApiOpenQBListener(function(){
        try {
            window.WeixinJSBridge.invoke("getInstallState", {
                packageUrl: "",
                packageName: "com.UCMobile"
            }, function(results) {
                if (/get_install_state:yes/ig.test(JSON.stringify(results)) === true) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        } catch(e) {
            //报错时，认为已安装UC，走保守方案
            callback(true);
            console.log('checkQbInstall', 'wx check error' + e.toString());
        }
    });
};
MTTBrowser.addJsApiMTTBackParam = function(url, callback){
    var urlNew = "";
    if(url.substr(0,32).toLowerCase().indexOf("x5gameplayer")<0){
        urlNew = "mttbrowser://url=" + encodeURIComponent("mttbrowser://"+url) + "#nouse=x5gameplayer://";
    }else{
        urlNew = "mttbrowser://url=" +  encodeURIComponent(url.replace(/http:\/\//ig, ""));
    }
    urlNew += MTTBrowser.config.androidWxBackparm + ",encoded=1";
    callback(encodeURIComponent(urlNew));
};
/*MTTBrowser.addMTTBackParam = function(url, callback){
    var urlNew = "";
    if(MTTBrowser.isAndroid){
        if(MTTBrowser.isQQ){
            if(url.substr(0,32).toLowerCase().indexOf("x5gameplayer")<0){
                urlNew = "mttbrowser://url=" + encodeURIComponent("mttbrowser://"+url.replace(/http:\/\//ig, "")) + "#nouse=x5gameplayer://";
            }else{
                urlNew = "mttbrowser://url=" +  encodeURIComponent(url.replace(/http:\/\//ig, ""));
            }
        }else if(MTTBrowser.isWX){
            urlNew = "mttbrowser://url=" +  url.replace(/http:\/\//ig, "");
        }
    }else if(MTTBrowser.isIos && MTTBrowser.isWX) {
        urlNew = "mttbrowser://url=" +  encodeURIComponent(url.replace(/http:\/\//ig, ""));
    } else {
        urlNew = "mttbrowser://url=" +  url.replace(/http:\/\//ig, "");
    }

    if (MTTBrowser.isAndroid) {
        if (MTTBrowser.isWX) {
            urlNew += MTTBrowser.config.androidWxBackparm;
            callback(urlNew);
        } else if (MTTBrowser.isQQ) {
            urlNew += MTTBrowser.config.androidQqBackparm + ",encoded=1";
            callback(encodeURIComponent(urlNew));
        }
    } else if (MTTBrowser.isIos) {
        if (MTTBrowser.isWX) {
            urlNew += MTTBrowser.config.iosWxBackparm;
        } else if (MTTBrowser.isQQ) {
            urlNew += MTTBrowser.config.iosQqBackparm;
        }
        callback(urlNew);
    }
};*/

MTTBrowser.addMTTBackParam = function(url, callback){
    var urlNew = "";
    if(MTTBrowser.isIos && MTTBrowser.isWX) {
        urlNew = "mttbrowser://url=" +  encodeURIComponent(url.replace(/http:\/\//ig, ""));
    } else {
        urlNew = "mttbrowser://url=" +  url.replace(/http:\/\//ig, "");
    }
    if (MTTBrowser.isAndroid) {
        if (MTTBrowser.isWX) {
            urlNew += MTTBrowser.config.androidWxBackparm;
        } else if (MTTBrowser.isQQ) {
            urlNew += MTTBrowser.config.androidQqBackparm;
        }
    } else if (MTTBrowser.isIos) {
        if (MTTBrowser.isWX) {
            urlNew += MTTBrowser.config.iosWxBackparm;
        } else if (MTTBrowser.isQQ) {
            urlNew += MTTBrowser.config.iosQqBackparm;
        }
    }
    callback(urlNew);
};
MTTBrowser.iosOpenUrl = function(url){
    //为兼容ios8，ios8不兼容window.location
    var a = document.createElement("a");
    a.href = url;
    var click = document.createEvent("Event");
    click.initEvent("click", false /*bubbles*/, true /*cancellable*/);
    a.dispatchEvent(click);
};
MTTBrowser.openUrl = function(url){
    if (MTTBrowser.isIos) {
        MTTBrowser.iosOpenUrl(url);
    } else {
        location.href = url;
    }
};
MTTBrowser.wxJsApiOpenQBListener = function (callback){
    if (typeof window.WeixinJSBridge == "object" && typeof window.WeixinJSBridge.invoke == "function") {
        callback();
    } else {
        if (document.addEventListener) {
            document.addEventListener("WeixinJSBridgeReady", callback, false);
        } else if (document.attachEvent) {
            document.attachEvent("WeixinJSBridgeReady", callback);
            document.attachEvent("onWeixinJSBridgeReady", callback);
        }
    }
};
MTTBrowser.wxJsApiOpenQB = function(url){
    MTTBrowser.wxJsApiOpenQBListener(function(){
        MTTBrowser.addJsApiMTTBackParam(url, function(urlNew){
            try {
                window.WeixinJSBridge.invoke("launch3rdApp", {
                    "appid" : "wx64f9cf5b17af074d",
                    "packageName" : "com.tencent.mtt",
                    "signature" : "d8391a394d4a179e6fe7bdb8a301258b",
                    "param" : urlNew,
                    "type" : 1
                }, function(res) {
                    if (/launch_3rdApp:ok/ig.test(JSON.stringify(res)) === true) {
                    } else {
                        MTTBrowser.wxOldOpenQB(url);
                    }
                });
            } catch (e){
                MTTBrowser.wxOldOpenQB(url);
            }
        });
    });
};
MTTBrowser.wxOldOpenQB = function(url){
    MTTBrowser.addMTTBackParam(url, function (urlNew) {
        location.href = urlNew;
    });
};
MTTBrowser.wxOpenQB = function(url){
    MTTBrowser.wxCheckUCInstall(function(isTrue){
        if(isTrue){
            if (typeof tbsJs != "undefined" && typeof tbsJs.packages != "undefined") {
                var tbsPackage = tbsJs.packages();
                if (typeof tbsPackage.runApk != "undefined"){
                    MTTBrowser.addMTTBackParam(url, function (urlNew) {
                        var openInfo = {
                            "packagename": "com.tencent.mtt",
                            "url" : urlNew
                        };
                        tbsPackage.runApk(JSON.stringify(openInfo)); //"mttbrowser://url=' + url + ',packageName=com.tencent.mm"
                    });
                } else {
                    MTTBrowser.wxJsApiOpenQB(url);
                }
            } else {
                MTTBrowser.wxJsApiOpenQB(url);
            }
        } else {
            MTTBrowser.wxOldOpenQB(url);
        }
    });
};
MTTBrowser.qqOpenQB = function(url){
    MTTBrowser.loadJs(MTTBrowser.config.qqApiUrl, function(){
        mqq.app.launchAppWithTokens({
            appID : "100446242",
            packageName : "com.tencent.mtt",
            paramsStr : "?url=" + url,
            flags : "67108864"
        });
    });
};
MTTBrowser.openQbByJsApi = function(info, callback) {
    MTTBrowser.checkQbInstall(function(isInstall, version){
        if(isInstall && version>=6.0){
            MTTBrowser.addJsApiMTTBackParam(info.url, function (urlNew) {
                if (MTTBrowser.isWX) {
                    MTTBrowser.wxOpenQB(info.url);
                } else if(MTTBrowser.isQQ) {
                    MTTBrowser.qqOpenQB(urlNew);
                }
            });
        }else{
            MTTBrowser.addMTTBackParam(info.url, function (urlNew) {
                MTTBrowser.openUrl(urlNew);
            });
        }
    });
};
MTTBrowser.openQb = function(info,callback) {
    /*已确认为安装了所需版本的浏览器的时候使用*/
    if (info.url == null) {
        info.url = MTTBrowser.config.openUrl;
    }
    if(MTTBrowser.isQb){
        location.href = info.url;
        return;
    }
    MTTBrowser.checkQbInstall(function(isInstall, version){
        if(!isInstall){
            callback("error:notInstallQb,version=" + version);
            return;
        }
    });
    if(MTTBrowser.isIos){
        if (MTTBrowser.isWX || MTTBrowser.isQQ) {
            MTTBrowser.addMTTBackParam(info.url, function (urlNew) {
                MTTBrowser.openUrl(urlNew);
            });
        }
    }else {
        if (MTTBrowser.isQQ) {
            MTTBrowser.openQbByJsApi(info, callback);
        } else if (MTTBrowser.isWX){
            MTTBrowser.wxCheckUCInstall(function(isInstall){
                if(isInstall){
                    MTTBrowser.openQbByJsApi(info, callback);
                }else{
                    MTTBrowser.addMTTBackParam(info.url, function (urlNew) {
                        MTTBrowser.openUrl(urlNew);
                    });
                }
            });
        }
    }
};

var launchQBAndOpenUrl = function(url, callback){MTTBrowser.openQb({url: url}, callback||function(){})};

export default {
    launchQBAndOpenUrl
};