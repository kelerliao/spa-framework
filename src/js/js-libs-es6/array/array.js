/**
 * @fileOverview array 相关处理方法，依赖 core
 * @author: kelerliao
 */
import core             from '../core';

export default {
    /**
     * 数组去重算法，返回新的数组，数据长度大于等于 0
     *
     * @for exports.array
     * @method unique
     * @param {Array} array 要去重的数组
     * @param {String} [key] 若数组中的数据是 Object 类型，可以指定 object.key 来去重
     * @example
     * ```
     * array.unique([1,2,3,3,2,1]); // [1,2,3]
     * array.unique([{a: 'abc', b: 'b1'},{a: 'abc', b: 'b2'},{a: 'abcd', b: 'b3'}], 'a');
     * // return [{a: 'abc', b: 'b1'},{a: 'abc', b: 'b2'}]
     * ```
     * @return {Array} 返回去重后的新数组
     */
    unique: function (array, key) {
        let obj = {},
            newArray = [],
            value = '';

        if (core.type(array) === 'array') {
            array.forEach(function (val) {
                value = val;

                if (core.type(val) === 'object') { value = val[key]; }
                value = core.type(value) + value;

                if (!obj[value]) {
                    obj[value] = true;
                    newArray.push(val);
                }
            });
        }

        return newArray;
    },
    /**
     * 根据参数查找数组中合适的对象
     *
     * @for exports.array
     * @method find
     * @param {Array} array 要查找的数组
     * @param {String} key 数组中的数据是 Object 类型对应的 Key
     * @param {String} value 数组中的数据是 Object 类型某个 Key 对应的值
     * @param {Boolean} [greedy] 可选，默认为 false，找到第一个符合条件的即返回。是否贪婪模式，若为 true 将返回所有符合添加的数组
     * @example
     * ```
     * // 查找数组对象中 a=abc 的对象
     * array.find([{a: 'abc', b: 'b1'},{a: 'abc', b: 'b2'},{a: 'abcd', b: 'b3'}], 'a', 'abc');
     * // return {a: 'abc', b: 'b1'}
     * ```
     * @return {Object|Array} 若找到将返回一个对象（greedy=false）或数组（greedy=true），若没找到将返回 null
     */
    find: function (array, key, value, greedy) {
        let newObj = null,
            newArray = null,
            isGreedy = !!greedy;

        if (core.type(array) === 'array') {
            if (isGreedy) {
                array.forEach(function (obj) {
                    if (obj[key] === value) {
                        newArray.push(obj);
                    }
                });
            } else {
                array.some(function (obj) {
                    if (obj[key] === value) {
                        newObj = obj;
                        return true;
                    }
                });
            }
        }

        return isGreedy ? newArray : newObj;
    },
    /**
     * 随机返回数组中的指定数量的新数组
     *
     * @for exports.array
     * @method random
     * @param {Array} array 要随机的数组
     * @param {Number} count 要返回的新数组的长度。若大于传入数据的长度，将返回整个传入的新数组
     * @example
     * ```
     * array.random([1,2,3,4,5,6], 3); // 从 [1,2,3,4,5,6] 中随机取 3 个元素
     * ```
     * @return {Array} 返回一个新的数组
     */
    random: function (array, count) {
        let cloneArray,
            len,
            random,
            newArray = [];

        if (core.type(array) !== 'array') {
            throw new TypeError('"array" argument must be an array type!');
        } else if (core.type(count) !== 'number' || Number(count) < 0) {
            throw new TypeError('"count" argument must be greater than zero number type!');
        }

        len = array.length;
        cloneArray = array.slice(0);
        if (Number(count) >= len) { return cloneArray; }

        array.some(function () {
            if (newArray.length < count) {
                len = cloneArray.length;
                random = Math.random() * len >> 0;
                newArray.push(cloneArray.splice(random, 1)[0]);
            } else {
                return true;
            }
        });

        return newArray;
    }
};