/**
 * @fileOverview hash 相关处理方法，依赖 core util security 模块
 * @author: kelerliao
 */

import core             from '../core';
import util             from '../util/util';
import security         from '../security/security';


export default {
    getKey: function (key) {
        let result,
            hashStr = window.location.hash,
            regExp = new RegExp('(#|&)+' + key + '=([^&#]*)');

        result = hashStr.match(regExp);

        return (!result ? '' : security.htmlEncode(decodeURIComponent(result[2])));
    },

    setKey: function (key, value, string) {
        let hasStr = core.type(string) === 'string',
            hashStr = hasStr ? string : window.location.hash,
            hashObj = util.toObject(hashStr) || {};

        hashObj[key] = value;
        hashStr = util.toParams(hashObj);

        if (!hasStr) {
            window.location.hash = hashStr;
        }
        return hashStr;
    },

    removeKey: function (key, string) {
        let hasStr = core.type(string) === 'string',
            hashStr = hasStr ? string : window.location.hash,
            hashObj = util.toObject(hashStr) || {};

        delete hashObj[key];
        hashStr = util.toParams(hashObj);

        if (!hasStr) {
            window.location.hash = hashStr;
        }
        return hashStr;
    }
};

