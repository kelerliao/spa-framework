/**
 * @fileOverview 正则表达式的集合
 * @author: kelerliao
 */

export default {
    /**
     * Email 的验证正则
     *
     * @for exports.regexps
     * @property email
     * @return RegExp
     */
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};
