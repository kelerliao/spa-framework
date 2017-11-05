/**
 * @fileOverview security 相关处理方法
 * @author: kelerliao
 */

let _encodeReg = {
        'lt': /</g,
        'gt': />/g,
        'amp': /&/g,
        'quot': /"/g,
        '#39': /'/g,
        '#61': /=/g,
        '#96': /`/g
    },
    _decodeReg = {
        'lt': /&lt;/g,
        'gt': /&gt;/g,
        'amp': /&amp;/g,
        'quot': /&quot;/g,
        '#39': /&#39;/g
    };

export default {
    /**
     * html正文编码：对需要出现在HTML正文里(除了HTML属性外)的不信任输入进行编码
     * @example h5.security.htmlEncode(str);
     * @param {String} str 要编码的html字符串
     * @return {String} 返回编码后的html字符串
     */
    htmlEncode: function(str) {
        if (typeof str !== 'string') { return str; }

        return str.replace(_encodeReg.amp, '&amp;')
            .replace(_encodeReg.gt, '&gt;')
            .replace(_encodeReg.lt, '&lt;')
            .replace(_encodeReg.quot, '&quot;')
            .replace(_encodeReg['#39'], '&#39;');
    },

    /**
     * html正文解码：对 htmlEncode 函数的结果进行解码
     * @example h5.security.htmlDecode(str);
     * @param {String} str 要解码的html字符串
     * @return {String} 返回解码后的html字符串
     */
    htmlDecode: function(str) {
        if (typeof str !== 'string') { return str; }

        return str.replace(_decodeReg.amp, '&')
            .replace(_decodeReg.gt, '>')
            .replace(_decodeReg.lt, '<')

            .replace(_decodeReg.quot, '"')
            .replace(_decodeReg['#39'], '\'');
    }
};

