'use strict';

/**
 * app data cache
 */

let dataMap = {};

const util = {
    aaa: (key) => {
        console.log(key);
    },
    set: (key, value) => {
        dataMap[key] = value;
    }
};

export default util;