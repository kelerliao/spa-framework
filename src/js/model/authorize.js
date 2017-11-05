;!function(exports){
    var _cookie  = exports.cookie;
    var app = {
        qb: /mqqbrowser/i,
        wx: /micromessenger/i
    }

    //公众号信息
    var gzh_conf = {
        appid: 'wxe96fbdefcd9adbff'
        //secret: 'cd110cf4019e18cf991e271474f77ded'
    }

    //
    var url_conf = {
        qb_authorize_src : 'http://jsapi.qq.com/get?api=login.authorize',
        login_url: window.config.api_url,
        wx_getcode_url: 'https://open.weixin.qq.com/connect/oauth2/authorize?' +
                'appid=' + gzh_conf.appid +
                '&redirect_uri={url}' +
                '&response_type=code'+
                '&scope=snsapi_userinfo'+
                '&state=STATE#wechat_redirect'
    }

    var ua = window.navigator.userAgent;

    var ck = {
        getItem: function(key){
            return _cookie.getKey(key);
        },
        setItem: function(key, value){
            _cookie.setKey(key, value, 6*30*24);
        },
        rmItem: function(key){
            _cookie.removeKey(key);
        }
    }


    function _getAuthorizeInfo(){

        var greenkey = ck.getItem('greenkey'),
            uid = ck.getItem('uid'),
            wname = ck.getItem('wname'),

            //此处有深坑！！！有些用户头像可能为空！！！
            whead = ck.getItem('whead');

        var flag = greenkey && uid && wname /*&& whead*/;//这里一定不能有whead！！！

        return flag ? {greenkey: greenkey, uid: uid, wname: wname, whead: whead} : null;
    }

    function _loadJs(url, cb){

        var head = document.getElementsByTagName("head")[0],
            js = document.createElement("script");

        js.src = url;
        head.appendChild(js);

        js.onload = function(){
            cb && cb();
        }
    }

    function _ajax(obj){

        /*obj = {
            type: 'post',
            url: 'http://www.qq.com',
            data: 'a=3&b=2',
            done: function(data){}
        }*/
        var xhr = new XMLHttpRequest();

        xhr.open(obj.type || "get", obj.url);

        xhr.onload = function(){

            var o = JSON.parse(xhr.response);
            obj.done(o);
        }

        obj.type == 'post' && xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.send(obj.type == 'post' ? obj.data : null);

    }

    function _getParam(key){

        var search = "&" + window.location.search.substring(1) + "&",
            re = new RegExp('&' + key + '=([^&]+)&');

        var rst = re.exec(search);

        return rst ? rst[1] : window.undefined;

    }

    //_getParam('code') && _getParam('state') && _authorize();

    function _authorize(callback){
        var url = url_conf.wx_getcode_url.replace('{url}', encodeURIComponent(h5.param.removeKey('code', location.href)));

        var info = _getAuthorizeInfo();

        //cookie中如果有登录认证信息
        if(info){
            callback(info);
        //没有登录认证信息
        }else{
            for(var p in app){
                if(app[p].exec(ua)){
                    switch(p){
                        case 'qb':
                            //加载qb的api
                            _loadJs(url_conf.qb_authorize_src, function(){
                                //调用qb的认证接口
                                (function qbl(){
                                    //alert('QQ浏览器' + browser.login.authorize);
                                    browser.login.authorize(function(data){
                                        //alert('QQ浏览器'+JSON.stringify(data));
                                        //将获取到的认证信息传递给后台登录本应用
                                        _ajax({
                                            url: url_conf.login_url + '?p=QBlogin' +
                                                '&oo=' + data.uin +
                                                '&aa=' + (data.token || data.sid),
                                            done: function(data){
                                                if(data.state == 0){
                                                    ck.setItem('greenkey', data.greenkey);
                                                    ck.setItem('uid', data.uid);
                                                    ck.setItem('wname', data.wname);
                                                    ck.setItem('whead', data.whead);

                                                    callback(_getAuthorizeInfo());
                                                }else{
                                                    qbl();
                                                }
                                            }
                                        });

                                    }, function(){
                                        qbl();
                                    }, {
                                        authorizeAppID: '103',
                                        authorizeType: 4,
                                        authorizeAppName : '',
                                        authorizeAppIconURL: ''
                                    });
                                })();
                            })
                            break;
                        case 'wx':
                            var code = _getParam('code');
                            //alert('code = ' + code);
                            if(code && _getParam('state')){
                                //alert("成功 ：code = " + code);
                                _ajax({
                                    url: url_conf.login_url + '?p=WXlogin' +
                                        '&code=' + code,
                                    done: function(data){

                                        if(data.state == 0){
                                            ck.setItem("greenkey", data.greenkey);
                                            ck.setItem("uid", data.uid);
                                            ck.setItem("wname", data.wname);
                                            ck.setItem("whead", data.whead);

                                            callback(_getAuthorizeInfo());
                                        }else{
                                            ck.rmItem("greenkey");
                                            ck.rmItem("uid");
                                            ck.rmItem("wname");
                                            ck.rmItem("whead");
                                            window.location = url;
                                        }
                                    }
                                });
                            }else{
                                window.location.href = url;
                                //alert(url);
                            }
                            break;
                    }
                }
            }
        }
    }

    exports.authorize = _authorize;

}(window.h5 || (window.h5 = {}));