/**
 * @fileOverview string 相关处理方法
 * @author: kelerliao
 */

export default {
    substrByte: function (string, length, extend) {
        let byteCnt = 0,
            subStr = '',
            i,
            strLen;

        string = string.toString();
        length = length > 0 ? length : 0;
        extend = extend === undefined ? '...' : extend;
        strLen = string.length;

        for (i = 0; i < strLen; ++i) {
            byteCnt += string.charCodeAt(i) > 255 ? 2 : 1;

            if (byteCnt > length) {
                return subStr + extend;
            }
            subStr += string.charAt(i);
        }
        return subStr;
    },

    /**
     * 对数字/字符串前置补充 0/指定的字符
     *
     * @for exports.string
     * @method zeroFill
     * @param {Number|String} number 要补充的数字或字符串
     * @param {Number} [length=2] 可选，默认为 2，补充后的字符总长度
     * @param {String} [separator=0] 可选，默认值是 0，要补充的字符
     * @example
     * ```
     * h5.string.zeroFill(1); // "01"
     * h5.string.zeroFill(1, 3); // "001"
     * h5.string.zeroFill(1, 3, '-'); // "--1"
     * h5.string.zeroFill(1, '-'); // "-1"
     * ```
     * @return {String} 返回补充后的字符串
     */
    zeroFill: function (number, length, separator) {
        number = number + '';

        if (typeof length === 'number') {
            if (typeof separator === 'undefined') {
                separator = '0';
            }
        } else {
            separator = typeof length === 'undefined' ? '0' : length;
            length = 2;
        }

        return number.length >= length ? number : new Array(length - number.length + 1).join(separator) + number;
    }
};
