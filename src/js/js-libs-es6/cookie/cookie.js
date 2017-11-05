/**
 * @fileOverview cookie 相关处理方法，无依赖
 * @author: kelerliao
 */

export default {
    prefix: '',
    
    init: function (prefix) {
        this.prefix = prefix;
    },
    /**
     * 获取 cookie 值
     *
     * @method getKey
     * @param  {String} name cookie 名称
     * @return {*} 返回 name 对应的 cookie 值，如果没有，则返回空字符串
     */
    getKey: function (name) {
        let r = new RegExp('(?:^|;+|\\s+)' + this.prefix + name + '=([^;]*)'),
            m = document.cookie.match(r);

        return !m ? '' : m[1];
    },

    /**
     * 设置 cookie 值
     *
     * @method setKey
     * @param {String} name cookie 名称
     * @param {*} value cookie 值
     * @param {Number} hour 有效时间
     * @param {String} domain 所属的域名
     * @param {String} path 对应的路径
     * @return {Boolean} 设置成功返回 true
     */
    setKey: function (name, value, hour, domain, path) {
        let expire = new Date();

        hour > 0 && expire.setTime(expire.getTime() + 3600000 * hour);

        document.cookie = this.prefix + name + '=' + value + '; ' + (hour ? 'expires=' + expire.toUTCString() + '; ' : '') +
            (path ? 'path=' + path + '; ' : 'path=/; ') +
            (domain ? 'domain=' + domain + ';' : 'domain=' + document.domain + ';');

        return true;
    },

    /**
     * 删除 cookie
     *
     * @method removeKey
     * @param  {String} name cookie 名称
     * @param  {String} domain 所在域名
     * @param  {String} path 所在路径
     * @return {Boolean} 删除成功返回 true
     */
    removeKey: function (name, domain, path) {
        document.cookie = this.prefix + name + '=; expires=Mon, 26 Jul 2000 01:00:00 GMT; ' +
            (path ? 'path=' + path + '; ' : 'path=/; ') +
            (domain ? 'domain=' + domain + ';' : 'domain=' + document.domain + ';');

        return true;
    }
};
