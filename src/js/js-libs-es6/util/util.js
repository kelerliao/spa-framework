/**
 * @fileOverview util 相关处理方法
 * @author: kelerliao
 */
import core             from '../core';

export default {
    /**
     * 将 URL 参数格式转化成对象。依赖 Array.prototype.forEach() 函数
     *
     * @for exports.util
     * @method toObject
     * @param {String} params 要转换的 key-value 字符串，默认分隔符为 &
     * @return {Object}
     */
    toObject: function (params) {
        let result = {}, pairs, pair, key, value;

        if (core.type(params) === 'object') {
            return params;
        } else if (params === '') {
            return {};
        }

        pairs = String(params).replace('?', '').replace('#', '').split('&');

        pairs.forEach(function(keyVal) {
            pair = keyVal.split('=');
            key = pair[0];
            value = pair.slice(1).join('=');
            result[decodeURIComponent(key)] = decodeURIComponent(value);

        });

        return result;
    },

    /**
     * 将对象转化成 URL 参数格式
     *
     * @for exports.util
     * @method toParams
     * @param {Object} object 要转换的对象，默认分隔符为 &
     * @return {String} 返回字符串，如：a=1&b=2
     */
    toParams: function (object) {
        let arr = [],
            type,
            value;

        if (typeof object === 'string') {
            return object;
        }

        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                value = object[key];
                type = core.type(value);

                if (type === 'object' || type === 'array') {
                    value = JSON.stringify(value);
                }

                arr.push(key + '=' + encodeURIComponent(value));
            }
        }

        return arr.join('&');
    },

    /**
     * 比较两个版本号的大小。version1 > version2 返回大于零的值；version1 = version2 返回零；version1 < version2 返回小于零的值
     *
     * @for exports.util
     * @method compareVersion
     * @param {String} version1 版本号1
     * @param {String} version2 版本号2
     * @param {String} [separator=.] 可选，默认值是点（.），版本号数字之间的分隔符
     * @example
     * ```
     * h5.util.compareVersion('1.0.4', '1.2.1'); // version1 < version2 返回小于零的值
     * ```
     * @return {Number} version1 > version2 返回大于零的值；version1 = version2 返回零；version1 < version2 返回小于零的值
     * @support iOSVersion 4.2, androidVersion 4.2
     * @iOSAutoTest '1.0.4', '1.2.1'
     * @androidAutoTest '1.0.4', '1.2.1'
     */
    compareVersion: function compareVersion(version1, version2, separator/*undefined*/) {
        let s = separator || '.';

        version1 = version1.toString();
        version2 = version2.toString();

        return version1.split(s)[0] - version2.split(s)[0] == 0 && version1 != version2
            ? this.compareVersion(version1.split(s).splice(1).join(s), version2.split(s).splice(1).join(s))
            : version1.split(s)[0] - version2.split(s)[0];
    },
    /**
     * 获取元素相对 body 左上角坐标的相对位置值
     *
     * @param {Element} element 要获取的元素
     * @return {{x: number, y: number}}
     */
    getPosition: function(element) {
        let xPosition = 0;
        let yPosition = 0;

        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }
        return { x: xPosition, y: yPosition };
    }
};
