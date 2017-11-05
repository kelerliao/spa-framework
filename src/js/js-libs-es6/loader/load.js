/**
 * @fileOverview loader 相关处理方法
 * @author: kelerliao
 */

import core             from '../core';

/**
 * 单个/批量地加载/懒加载 JS 资源。是动态创建 script 标签添加到 head 中
 *
 * @for h5.loader
 * @method load
 * @param {Object} params 参数对象
 *  @param {Object} params.url 要加载的 JS 列表。对每个 url 去除参数后发现已经加载过，将不再重复加载。即版本控制只能放在文件名上，不能通过参数来控制版本号
 *  @param {Number} [params.delay] 可选。默认值为零。值大于零时，将启用懒加载，单位为秒。如：time=3，即从调用接口算起，3秒后加载 urls
 *
 *  @param {Function} [params.success] 可选。JS 列表全部加载成功后的回调函数
 *      @param {Object} [params.success.result] 可选。success 函数的参数对象
 *          @param {Array} [params.success.result.scripts] 可选。返回根据 urls 参数动态创建的 script 标签数组，id="loader_js_[Number]"
 *
 *  @param {Function} [params.fail] 可选。JS 列表中只要有一个加载失败就执行的回调函数
 *      @param {Object} [params.fail.url] 可选。fail 函数的参数，当前加载失败的 url
 *
 *  @param {Function} [params.process] 可选。JS 列表中每个 url 加载成功后的回调函数
 *      @param {Object} [params.process.result] 可选。process 函数的参数对象
 *          @param {Element} [params.process.result.script] 可选。当前加载成功的 script 标签
 *          @param {Element} [params.process.result.total] 可选。要加载的 url 总数，等于 params.urls.length
 *          @param {Element} [params.process.result.loaded] 可选。已完成加载的 url 数
 *
 *  @param {Function} [params.complete] 可选。加载完成的回调函数
 *      - 1、只要有一个 url 加载失败，将先触发 fail，接着触发 complete，整个加载任务结束
 *      - 2、所有 url 全部加载完成后,先触发 success， 接着触发 complete，整个加载任务结束
 *      @param {Object} [params.complete.result] 可选。complete 函数的参数对象
 *          @param {Array} [params.complete.result.sucScripts] 可选。加载成功的 script 标签数组
 *          @param {Element} [params.complete.result.failScript] 可选。加载失败的 script 标签
 *
 * @example
 * ```
 * h5.loader.load({
 *  url: {
 *      js: ['a.js', 'b.js', 'c.js']
 *  },
 *  delay: 3.5, // 3.5s
 *  process: function (result) {
 *      console.log(result.sucUrl); // 已加载成功的 url 数组
 *      console.log(result.errUrl); // 已加载失败的 url 数组
 *      console.log(result.loaded); // 已完成加载的 url 数
 *      console.log(result.total); // 要加载的 url 总数，等于 params.urls.length
 *  },
 *  success: function (urls) {
 *      console.log(urls); // 加载成功的 url 数组
 *  },
 *  fail: function (urls) {
 *      console.log(urls); // 加载失败的 url 数组
 *  },
 *  complete: function (result) {
 *      console.log(result.total); // 加载的 url 总数，等于 params.urls.length
 *      console.log(result.sucUrl); // 加载成功的 url 数组
 *      console.log(result.errUrl); // 加载失败的 url 数组
 *  }
 * });
 * ```
 */

let headEl = document.querySelector('head');

let load = function (params) {
    let obj = {
        url: {
            img: [],
            js: [],
            css: []
        },
        delay: 0, // 3.5s
        process: null,
        success: null,
        fail: null,
        complete: null
    };

    //如果第一个参数为string或array（url或url数组）
    //则第二个参数为加载成功后的回调（如果有且是function的话）
    //则第三个参数为加载失败后的回调（如果有且是function的话）
    if (core.type(params) == 'object') {
        core.merge(obj, params);
        loadAll(obj);
    }
};

let loadAll = function (obj) {
    let total = 0,
        loaded = 0,
        failed = 0,
        index = 0,
        all = obj.url,
        sucUrl = {},
        errUrl = {},
        urls = {};

    for (let p in all) {
        if (all.hasOwnProperty(p)) {
            let t = core.type(all[p]);

            if (t == 'string') {
                all[p] = [all[p]];
            } else if (t != 'array') {
                continue;
            }

            sucUrl[p] = [];
            errUrl[p] = [];
            urls[p] = [];

            total += all[p].length;
        }
    }

    if (core.type(obj.delay) !== 'number' || obj.delay < 0) {
        obj.delay = 0;
    }

    let st = setTimeout(function () {
        clearTimeout(st);
        
        for (let p in all) {
            if (all.hasOwnProperty(p)) {
                core.type(all[p]) == 'array' && all[p].forEach(function (url) {

                    loadOne(url, p, function (data) {
                        index++;
                        urls[data.type].push(data.url);
                        //加载成功
                        if (data.state == 1) {
                            loaded++;
                            sucUrl[data.type].push(data.url);
                            //加载失败
                        } else {
                            failed++;
                            errUrl[data.type].push(data.url);
                        }
                        //进度事件
                        core.type(obj.process) == 'function' && obj.process({
                            total: total,
                            index: index,
                            loaded: loaded,
                            failed: failed,
                            currentType: data.type,
                            currentUrl: data.url,
                            urls: urls,
                            sucUrl: sucUrl,
                            errUrl: errUrl
                        });

                        if (index == total) {
                            //success事件
                            if (loaded == total) {
                                core.type(obj.success) == 'function' && obj.success(sucUrl);
                                //fail事件
                            } else {
                                core.type(obj.fail) == 'function' && obj.fail(errUrl);
                            }
                            //complete事件
                            core.type(obj.complete) == 'function' && obj.complete({
                                total: total,
                                loaded: loaded,
                                failed: failed,
                                sucUrl: sucUrl,
                                errUrl: errUrl
                            });
                        }
                    });
                });
            }
        }
    }, obj.delay);
};

let loadOne = function (url, type, cb) {
    let node, nodes, re;
    
    if (type == 'js') {
        node = document.createElement('script');
        node.crossOrigin = 'anonymous';
        nodes = document.querySelectorAll('script');
        node.src = url;
        url = node.src;
        re = /(?:.+.js(?=[\?#]))|(?:.+.js$)/;
    } else if (type == 'css') {
        node = document.createElement('link');
        node.rel = 'stylesheet';
        nodes = document.querySelectorAll('link');
        node.href = url;
        url = node.href;
        re = /(?:.+.css(?=[\?#]))|(?:.+.css$)/;
    } else if (type == 'img') {
        node = document.createElement('img');
        node.src = url;
        url = node.src;
    }

    //取出当前页面中所有script标签的src或者link标签的href
    if (type == 'js' || type == 'css') {
        let urls = Array.prototype.map.call(nodes, function (a) {
            return type == 'js' ? a.src : a.href;
        });

        //如果已经加载过则 return
        if (urls.indexOf(url) > -1) {
            cb({state: 1, url: url, type: type});
            node = null;
            return;
        }
        //添加到headEl中
        headEl.appendChild(node);
        //删除掉页面中已有的与本次加载的js/css主路径一致的script/link标签
        let main = url.match(re);

        main && Array.prototype.some.call(nodes, function (v) {
            let s = type == 'js' ? v.src.match(re) : v.href.match(re);

            if (s && main[0] == s[0]) {
                v.parentNode.removeChild(v);
                return true;
            }
        });
    }

    let fn = function (e) {
        cb({state: e.type == 'load' ? 1 : -1, url: url, type: type});
        this.removeEventListener('load', fn, false);
        this.removeEventListener('error', fn, false);
    };

    if (core.type(cb) == 'function') {
        node.addEventListener('load', fn, false);
        node.addEventListener('error', fn, false);
    }
};


export default {
    load
};