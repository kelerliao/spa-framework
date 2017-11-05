/**
 * @fileOverview param 相关处理方法，依赖 core util security 模块
 * @author: kelerliao
 */

import core             from '../core';
import util             from '../util/util';
import security         from '../security/security';


let aEl = null,
    getLocation = function (string) {
        aEl == null && (aEl = document.createElement('a'));
        aEl.href = string;
        return aEl;
    };

export default {
    /**
     * 获取 URL 或指定字符串中的参数值
     * @example
     * ```
     * // 获取当前页面的 URL 中的参数值
     * h5.param.getKey('name');
     *
     * // 获取指定字符串中的参数值
     * h5.param.getKey('name', 'http://mb.qq.com/index.html?name=keler');
     * ```
     * @param {String} key 要获取的参数 Key
     * @param {String} [string=undefined] 可选，默认为 undefined。指定的字符串
     * @return {String} 返回对应 Key 的参数值。若有值，该值是已经过 XSS 转码的字符串；若无值返回空字符
     */
    getKey: function (key, string) {
        let result,
            paramStr = core.type(string) === 'string' ? string : window.location.search,
            regExp = new RegExp('(\\?|&)+' + key + '=([^&\\?]*)');

        result = paramStr.match(regExp);

        return (!result ? '' : security.htmlEncode(decodeURIComponent(result[2])));
    },

    /**
     * 新增、修改 URL 或指定字符串中的参数
     * @example
     * ```
     * // 单个设置当前页面的 URL 参数
     * h5.param.setKey('name');
     *
     * // 批量设置当前页面的 URL 参数
     * h5.param.setKey({'name': 'keler', age: 20});
     *
     * // 单个设置指定字符串的参数
     * h5.param.setKey('name', 'keler', 'http://mb.qq.com/index.html');
     * // 返回值：http://mb.qq.com/index.html?name=keler
     *
     * // 批量设置指定字符串的参数
     * h5.param.setKey({'name': 'keler', age: 20}, 'http://mb.qq.com/index.html');
     * // 返回值：http://mb.qq.com/index.html?name=keler&age=20
     * ```
     * @param {String|Object} key 要新增或修改的参数 Key。可为单个设置的字符串，也可为批量设置的Key-Value对象
     * @param {String} value 若key为字符串则是要设置的key值；若key为Key-Value对象，则为指定的字符串或为undefined
     * @param {String} [string=undefined] 可选，默认为 undefined。指定要设置的字符串
     * @return {String} 返回设置好的字符串
     */
    setKey: function (key, value, string) {
        let hasStr,
            strLocation,
            paramStr,
            hashObj,
            isBatch = false;

        if (core.type(key) === 'object') {
            string = value;
            isBatch = true;
        }

        hasStr = core.type(string) === 'string';

        if (hasStr) {
            strLocation = getLocation(string);
            paramStr = strLocation.search;
        } else {
            paramStr = window.location.search;
        }

        hashObj = util.toObject(paramStr) || {};

        if (!isBatch) {
            hashObj[key] = value;
        } else {
            for (let p in key) {
                if (key.hasOwnProperty(p)) {
                    hashObj[p] = key[p];
                }
            }
        }
        paramStr = util.toParams(hashObj);

        if (hasStr) {
            paramStr = strLocation.origin + strLocation.pathname + '?' + paramStr + strLocation.hash;
        } else {
            window.location.search = paramStr;
        }
        return paramStr;
    },

    /**
     * 删除 URL 或指定字符串中的参数
     * @example
     * ```
     * // 单个删除当前页面的 URL 参数
     * h5.param.removeKey('name');
     *
     * // 批量删除当前页面的 URL 参数
     * h5.param.removeKey(['name', 'age']);
     *
     * // 单个删除指定字符串的参数
     * h5.param.removeKey('name', 'http://mb.qq.com/index.html?name=keler&age=20');
     * // 返回值：http://mb.qq.com/index.html?age=20
     *
     * // 批量删除指定字符串的参数
     * h5.param.removeKey(['name', 'age'], 'http://mb.qq.com/index.html?name=keler&age=20');
     * // 返回值：http://mb.qq.com/index.html
     * ```
     * @param {String|Array} key 要删除的参数 Key。可为单个删除的字符串，也可为批量删除的Key-Value对象
     * @param {String} [string=undefined] 可选，默认为 undefined。指定要设置的字符串
     * @return {String} 返回设置好的字符串
     */
    removeKey: function (key, string) {
        let hasStr = core.type(string) === 'string',
            strLocation,
            paramStr,
            hashObj,
            keyType = core.type(key);

        if (hasStr) {
            strLocation = getLocation(string);
            paramStr = strLocation.search;
        } else {
            paramStr = window.location.search;
        }

        hashObj = util.toObject(paramStr) || {};

        if (keyType === 'string') {
            delete hashObj[key];
        } else if (keyType === 'array') {
            key.forEach(function (p) {
                delete hashObj[p];
            });
        }

        paramStr = util.toParams(hashObj);

        if (hasStr) {
            paramStr = strLocation.origin + strLocation.pathname + '?' + paramStr + strLocation.hash;
        } else {
            window.location.search = paramStr;
        }
        return paramStr;
    }
};

