'use strict';

/**
 * loading 模块
 */

export default {
    show: (id) => {
        document.getElementById(id).style.display = '';
    },
    hide: (id) => {
        document.getElementById(id).style.display = 'none';
    }
};