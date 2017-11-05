/**
 * @fileOverview core 相关方法，直接挂在 h5 下
 * @author: kelerliao
 */

const core = {};

let toString = Object.prototype.toString,
    slice = Array.prototype.slice,

    type = function (param) {
        return toString.call(param).slice(8, -1).toLowerCase();
    },
    extend = function (target, source, deep) {
        let key;
        
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                if (deep && (type(source[key]) === 'object' || type(source[key]) === 'array')) {
                    if (type(source[key]) === 'object' && type(target[key]) !== 'object') {
                        target[key] = {};
                    }
                    if (type(source[key]) === 'array' && type(target[key]) !== 'array') {
                        target[key] = [];
                    }
                    extend(target[key], source[key], deep);
                }
                else if (source[key] !== undefined) {
                    target[key] = source[key];
                }
            }
        }
    },
    merge = function (target, source) {
        let key;
        for (key in target) {
            if (target.hasOwnProperty(key)) {
                if (type(target[key]) === 'object') {
                    type(source[key]) === 'object' && merge(target[key], source[key]);
                } else if (key in source) {
                    target[key] = source[key];
                }
            }
        }
    };

/**
 * 查询数据类型。
 *
 * @for h5
 * @method type
 * @param {*} obj JS 支持的任何数据类型
 * @example
 * ```
 * h5.type(123); // 返回值是：number 字符串
 * ```
 * @return {String} 返回参数中的数据类型，如果参数全等于null、undefined，就返回"null"、"undefined"；其他类型返回如："function"、"string" 等字符串
 */
core.type = type;

/**
 * 将一个或多个对象的属性扩展到目标对象上
 *
 * @for h5
 * @method extend
 * @param {Boolean} [deep] 可选，默认为false，是否深度拷贝
 * @param {Object} target 目标对象
 * @param {Object} source 要被拷贝的对象
 * @return {Object} 返回经过扩展的目标对象
 * @example
 * ```
 * // 浅拷贝
 * h5.extend(target, source[, source2, ...]);
 *
 * h5.extend({a:1}, {b:2}, {c:3}); // 返回 {a:1, b:2, c:3}
 *
 * // 深度拷贝
 * h5.extend(true, target, source[, source2, ...]);
 *
 * var aObj = {a:1}, bObj = {b: [{c: 3}]};
 * h5.extend(true, aObj, bObj); // 返回 {a:1, b: [{c: 3}]}
 * bObj.b[0].c = 30;
 * console.log(aObj.b[0].c); // 3
 * ```
 */
core.extend = function (deep, target, source/*[, sourceMore ...]*/) {
    let args = slice.call(arguments, 1);

    if (type(deep) === 'boolean') {
        target = args.shift();
    } else {
        target = deep;
        deep = false;
    }
    args.forEach(function (arg) {
        extend(target, arg, deep);
    });

    return target;
};

/**
 * 检测指定的 API 是否存在
 *
 * @for h5
 * @method has
 * @param {String} snAndModuleAndMethods 命名空间名称+模块名称+方法名称字符串，以点分隔。如：h5.app.isAppInstalled。模块名称支持多级，如：h5.theme.font.setSize
 * @return {Boolean} 同步返回布尔值
 * @example
 * ```
 * // 同步返回
 * h5.has('h5.app.isAppInstalled'); // true|false
 * ```
 */
core.has = function (snAndModuleAndMethods) {
    if (type(snAndModuleAndMethods) !== 'string') {
        throw new TypeError('参数类型错误：snAndModuleAndMethods 参数必须为字符串类型！');
    }

    let methods = snAndModuleAndMethods.split(','),
        splits,
        obj,
        has = false;

    methods.some(function (snAndModuleAndMethod) {
        splits = snAndModuleAndMethod.split('.');
        obj = window[splits.shift()];
        has = !!obj;

        // window[splits.shift()] 就为 false，直接跳出 methods.some
        if (!has) {
            return true;
        }

        splits.some(function (v) {
            // splits.some 内部判断 has=false，直接跳出 splits.some
            if (!has) {
                return true;
            } else {
                obj = obj[v];
                has = !!obj;
            }
        });

        // splits.some 内部判断 has=false，直接跳出 methods.some
        if (!has) {
            return true;
        }
    });

    // 至此，必须所有接口检查都为 true，才会返回 true
    return has;
};
/**
 * 根据目标对象的属性将一个或多个对象的属性合并到目标对象上，目标对象被修改
 *
 * @for h5
 * @method merge
 * @param {Object} target 目标对象
 * @param {Object} source 要合并的对象（可以多个，以逗号分隔）
 * @return {Object} 返回经过合并后的目标对象（target）
 * @example
 * ```
 * // 合并一个soure到target上
 * h5.merge(target, source);
 *
 * h5.merge({a:1, b:2}, {a:2, b:3, c:3}); // 返回 {a:2, b:3}
 *
 * // 合并多个source到target上r
 * h5.merge(target, source[, source2, ...]);
 *
 * h5.merge({a:1, b:2}, {a:2, b:3, c:3}, {a: 3, d:4}); // 返回 {a:3, b: 3}
 */
core.merge = function (target, source/*[, source2 ...]*/) {
    var args = slice.call(arguments, 1);

    if (type(target) === 'object') {
        args.forEach(function (v) {
            merge(target, v);
        });
    }

    return target;
};


export default core;

