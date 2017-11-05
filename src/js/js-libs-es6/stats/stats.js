/**
 * 统计上报器，包括返回码上报、测速上报、点击流上报和基础数据上报，基础数据上报如：pv、uv等，依赖 util.js
 *
 * @class h5.stats
 * @author: kelerliao
 */

import util             from '../util/util';

window.navigator.sendBeacon = 'sendBeacon' in window.navigator ? window.navigator.sendBeacon : function (url, data) {
    var xhr = ('XMLHttpRequest' in window) ? new XMLHttpRequest() : new window.ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('POST', url, false);
    xhr.setRequestHeader('Accept', '*/*');
    if (typeof data === 'string') {
        xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
        xhr.responseType = 'text/plain';
    } else if (Object.prototype.toString.call(data) === '[object Blob]') {
        if (data.type) {
            xhr.setRequestHeader('Content-Type', data.type);
        }
    }
    xhr.send(data);
    return true;
};

export default {
    _statsUrl: '', // 上报的后台接口 URL
    _channelId: '', // 渠道ID
    _actId: '', // 活动ID
    _openId: '', // 用户身份ID

    /**
     * 初始化上报的一些数据
     *
     * @for h5.stats
     * @method init
     */
    init: function (params) {
        this._channelId = params.channelId;
        this._actId = params.actId;
        this._openId = params.openid;
        this._statsUrl = params.statsUrl;
    },

    /**
     * 上报点击流
     *
     * @for h5.stats
     * @method click
     * @param {String} pageIdAndActionId 页面ID及动作ID，中间用 - 链接，如： '01-02'
     * @example
     * ```
     * h5.stats.click('01-01');
     * ```
     */
    click: function (pageIdAndActionId) {
        /*
         token
         openid
         channel_v1     渠道号
         channel_v2     页面编号
         act_id         活动ID
         content_type   页面名称 -- 前端不传了，有统计同学做对照表
         content_id     页面ID，建议改为 page_id
         optype         动作ID，建议改为 action_id
         */
        /*let _nums = pageIdAndActionId.split('-'),
            _param = {
                "channel_v1": this._channelId, // 渠道ID
                "act_id": this._actId, // 活动ID
                "openid": this._openId, // 用户身份ID
                "content_id": _nums[0], // 页面ID
                "optype": _nums[1], // 动作ID
                "t": Date.now() // 随机数
            };
         */
        let url = this._statsUrl + util.toParams({});
        httpImgSender()(url);
    },

    /**
     * 上报PV UV
     *
     * @for h5.stats
     * @method pv
     * @param {String} pageId 页面ID，如： '01'
     * @example
     * ```
     * h5.stats.pv('01');
     * ```
     */
    pv: function (pageId) {
        /*
         token
         openid
         channel_v1     渠道号
         channel_v2     页面编号
         act_id         活动ID
         -- content_type   页面名称 -- 前端不传了，有统计同学做对照表
         content_id     页面ID，建议改为 page_id
         optype         动作ID，建议改为 action_id
         */
        /*let _param = {
            "channel_v1": this._channelId, // 渠道ID
            "act_id": this._actId, // 活动ID
            "openid": this._openId, // 用户身份ID
            "content_id": pageId, // 页面ID
            "optype": 0, // 动作ID
            "pv": 1,
            "t": Date.now() // 随机数
        };

        let _url = this._statsUrl + util.toParams(_param);
        httpImgSender()(_url);*/
    }
};
