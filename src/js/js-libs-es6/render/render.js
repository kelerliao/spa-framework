/**
 * @fileOverview render 相关处理方法
 * @author: kelerliao
 */

export default {
    /**
     * 将模板文件渲染为 html
     *
     * @for exports.render
     * @method html
     * @param {String} template 要渲染的模板
     * @param {Object} data 要渲染到模板的数据
     * @param {Object} [opt] 可选选项
     * @return {String} 返回用 data 渲染 template 后的 html
     */
    html: function () {
        let cache = {},
            openTag,
            closeTag;

        return function tpl(str, data, opt) {
            opt = opt || {};
            let key = opt.key,
                regExp;

            // 默认值(<% %>)会和其他系统（如：pms系统）的模版符号一致，导致冲突报错，故这里用转义字符
            openTag = opt.openTag || decodeURIComponent('%3C%25'); // 默认值是： <%
            closeTag = opt.closeTag || decodeURIComponent('%25%3E'); // 默认值是： %>
            regExp = new RegExp('\t=(.*?)' + closeTag, 'g');

            let fn = key ? cache[key] = cache[key] || tpl(str) :
                new Function('obj', 'var _p_=[];with(obj){_p_.push(\'' +
                    str.replace(/[\r\t\n]/g, ' ')
                        .split('\'').join('\\')
                        .split(openTag).join('\t')
                        .replace(regExp, '\',$1,\'')
                        .split('\t').join('\');')
                        .split(closeTag).join('_p_.push(\'')
                    + '\');}return _p_.join("");');

            return data ? fn(data) : fn;
        };
    }()
};