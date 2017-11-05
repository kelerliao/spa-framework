'use strict';

/**
 * app data cache
 */

let dataMap = {};

const cache = {
    get: (key) => {
        return dataMap[key];
    },
    set: (key, value) => {
        dataMap[key] = value;
    }
};

export default cache;