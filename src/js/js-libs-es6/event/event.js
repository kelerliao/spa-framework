/**
 * @fileOverview event 相关处理方法，依赖 stats 模块
 * @author: kelerliao
 */

// 由于 stats 模块要跟随业务代码放一起。所以此处 import stats 只有模板和接口本身，具体实现会在页面代码中还有一个 stats.js 做具体的接口实现
import stats            from '../stats/stats';


let eventHandlerMap = {}; // {'click': [{el: null, fn: null}]}

function defaultGetHoverKeyFn(el) {
    return el.getAttribute && el.getAttribute('data-hover');
}

function defaultGetEventKeyFn(el) {
    return el.getAttribute && el.getAttribute('data-event');
}

function defaultGetHotKeyFn(el) {
    return el.getAttribute && el.getAttribute('data-stats');
}

function addEvent(el, event, fn) {
    mapEvent(el, event, fn);

    if (el.addEventListener) {  // W3C
        el.addEventListener(event, fn, true);
    }
    else if (el.attachEvent) { // IE
        el.attachEvent('on' + event, fn);
    }
    else {
        el[event] = fn;
    }
}

function removeEvent(el, event, fn) {
    if (el.removeEventListener) {  // W3C
        el.removeEventListener(event, fn, true);
    }
    else if (el.detachEvent) { // IE
        el.detachEvent('on' + event, fn);
    }
    else {
        el[event] = null;
    }
}

function mapEvent(el, event, fn) {
    let events = eventHandlerMap[event] || [],
        obj,
        isAdded = false,
        i,
        len = events.length;

    if (len === 0) {
        eventHandlerMap[event] = [{el: el, fn: fn}];
        return;
    }

    for (i = 0; i < len; ++i) {
        obj = events[i];
        if (el === obj.el) {
            // 对同一个element添加同一个监听事件，则删除之前的监听函数
            removeEvent(el, event, obj.fn);
            isAdded = true;

            // 对同一个element添加同一个监听事件，则替换之前的监听函数
            obj.fn = fn;
        }
    }

    if (!isAdded) {
        // 该 event 还没加入 eventHandlerMap[event] 数组
        events.push({el: el, fn: fn});
    }
}

/**
 * 在事件触发时，取得想要的元素
 * @param {Event} evt 事件对象
 * @param {Element} topElem 查找的最终祖先节点，从事件起始元素向上查找到此元素为止
 * @param {Function} judgeFn 判断是否目标元素的函数
 */
function getWantTarget(evt, topElem, judgeFn) {
    let targetEl = evt.srcElement || evt.target;

    while (targetEl) {
        if (judgeFn(targetEl)) {
            return targetEl;
        }

        if (topElem == targetEl) {
            break;
        }

        targetEl = targetEl.parentNode;
    }
    return null;
}

/**
 * 通用的绑定事件处理
 * @param {Element} topEl 要绑定事件的元素
 * @param {String} eventType 绑定的事件类型
 * @param {Object} dealFnMap 事件处理的函数映射
 * @param {Function} [getEventKeyFn=undefined] 可选。取得事件对应的 key 的函数
 * @param {Function} [getHotKeyFn=undefined] 可选。取得点击流对应的 key 的函数
 * @param {Function} [getHoverKeyFn=undefined] 可选。取得 css hover 对应的 key 的函数
 */
function bind(topEl, eventType, dealFnMap, getEventKeyFn, getHotKeyFn, getHoverKeyFn) {
    getEventKeyFn = getEventKeyFn || defaultGetEventKeyFn;
    getHotKeyFn = getHotKeyFn || defaultGetHotKeyFn;
    getHoverKeyFn = getHoverKeyFn || defaultGetHoverKeyFn;
    dealFnMap = dealFnMap || {};

    let isTap = true,
        targetHover,
        keyHover,
        intervalId;
    
    let eventHandler = function (evt) {
        let eventEl = topEl.getAttribute ? topEl : document.body, // 如果 topEl = window | document 就降级到 body 中寻找 data-* 的属性
            target = getWantTarget(evt, eventEl, getEventKeyFn),
            targetHot = getWantTarget(evt, eventEl, getHotKeyFn),
            event,
            returnValue,
            hot;

        if (target) {
            event = getEventKeyFn(target);

            // 支持直接绑定方法
            if (Object.prototype.toString.call(dealFnMap) === '[object Function]') {
                returnValue = dealFnMap.call(target, evt);
            }
            else {
                if (dealFnMap[event]) {
                    returnValue = dealFnMap[event].call(target, evt);
                }
            }

            if (!returnValue) {
                if (evt.preventDefault)
                    evt.preventDefault();
                else
                    evt.returnValue = false;
            }
        }

        // 点击流
        if (targetHot && stats && /click|tap/.test(eventType)) {
            hot = getHotKeyFn(targetHot);
            hot && stats.click(hot);
        }
    };

    if (eventType === 'tap') {
        addEvent(topEl, 'touchstart', function (evt) {
            targetHover = getWantTarget(evt, topEl, getHoverKeyFn);
            if (targetHover) {
                keyHover = getHoverKeyFn(targetHover);
                keyHover && targetHover.className.indexOf(keyHover) === -1 && (targetHover.className += ' ' + keyHover);

                // 若是长按，就恢复到 touchend 的样式
                // 由于长按后，终端做了其他处理，没有触发 touchend 事件，导致 touchstart 添加的 className 没有删除，这里就做了兼容处理
                intervalId = setTimeout(function () {
                    clearTimeout(intervalId);
                    if (targetHover && targetHover.className.indexOf(keyHover) > 0) {
                        targetHover.className = targetHover.className.replace(' ' + keyHover, '');
                    }
                }, 1500);
            }
            isTap = true;
        });

        addEvent(topEl, 'touchmove', function () {
            if (targetHover && targetHover.className.indexOf(keyHover) > 0) {
                targetHover.className = targetHover.className.replace(' ' + keyHover, '');
            }
            isTap = false;
        });

        addEvent(topEl, 'touchend', function (evt) {
            if (targetHover && targetHover.className.indexOf(keyHover) > 0) {
                targetHover.className = targetHover.className.replace(' ' + keyHover, '');
            }
            isTap && eventHandler(evt);
        });
    }
    else {
        addEvent(topEl, eventType, eventHandler);
    }
}

/**
 * 通用的解除绑定事件处理
 * @param {Element} topEl 要解除绑定事件的元素
 * @param {String} eventType 解除绑定的事件类型
 */
function unbind(topEl, eventType) {
    let events = eventHandlerMap[eventType] || [],
        obj,
        i,
        len = events.length;

    if (len === 0) {
        return;
    }

    for (i = 0; i < len; ++i) {
        obj = events[i];
        if (topEl === obj.el) {
            removeEvent(topEl, eventType, obj.fn);
            obj.fn = null;
            obj.el = null;
            events.splice(i, 1);
            break;
        }
    }
}


export default {
    on: bind,
    off: unbind
};