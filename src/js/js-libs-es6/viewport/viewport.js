/**
 * @fileOverview viewport 相关处理方法
 * @author: kelerliao
 */

let win = typeof window === 'undefined' ? {} : window,
    doc = typeof document === 'undefined' ? {} : document,
    docEl = doc.documentElement || {};


export default {
    /**
     * 获取 viewport 的宽度
     *
     * @for exports.viewport
     * @method getWidth
     * @return {Number} 返回一个数字；取 document.documentElement.clientWidth 与 window.innerWidth 的最大值
     */
    getWidth: function () {
        return Math.max(win['innerWidth'], docEl['clientWidth']);
    },

    /**
     * 获取 viewport 的高度
     *
     * @for exports.viewport
     * @method getHeight
     * @return {Number} 返回一个数字；取 document.documentElement.clientHeight 与 window.innerHeight 的最大值
     */
    getHeight: function () {
        return Math.max(win['innerHeight'], docEl['clientHeight']);
    }
};
