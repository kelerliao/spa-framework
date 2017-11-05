/**
 * @fileOverview date 相关处理方法，无依赖
 * @author: kelerliao
 */

export default {
    /**
     * 将传递进来的Date对象，格式化为指定的字符串格式
     * @example exports.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss wd");
     * @param {Date|Number} date 要格式化的Date对象或毫秒数值
     * @param {String} format 指定的字符串格式
     * @return {String} 返回指定的字符串格式
     */
    dateFormat: function (date, format) {
        if (date instanceof Date === false) {
            date = Number(date);
            date > 0 && (date = new Date(date));
        }

        let obj = {
            'M+': date.getMonth() + 1,                     // month
            'd+': date.getDate(),                          // day
            'h+': date.getHours(),                         // hour
            'm+': date.getMinutes(),                       // minute
            's+': date.getSeconds(),                       // second
            'q+': Math.floor((date.getMonth() + 3) / 3),   // quarter
            'S': date.getMilliseconds()                    // millisecond
        };

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }

        if (/(wd+)/.test(format)) {
            format = format.replace(RegExp.$1, ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]);
        }

        for (let k in obj) {
            if (obj.hasOwnProperty(k) && new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1
                    ? obj[k]
                    : ('00' + obj[k]).substr(('' + obj[k]).length));
            }
        }

        return format;
    },

    /**
     * 将传递进来的毫秒数，格式化为指定的字符串格式
     *
     * @param {Number} millisecond 要格式化的毫秒数
     * @param {String} [format=hh:mm:ss] 可选，默认值为 hh:mm:ss。指定的字符串格式
     * @example
     * ```
     * date.timeFormat(3666000, "hh时mm分ss秒");
     * ```
     * @return {String} 返回指定的字符串格式
     */
    timeFormat: function (millisecond, format) {
        let obj,
            result = format || 'hh:mm:ss',
            seconds = millisecond / 1000 >> 0,
            hours = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds - (hours * 3600)) / 60),
            sec = seconds - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = '0' + hours;
        }
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (sec < 10) {
            sec = '0' + sec;
        }

        obj = {
            'h+': hours,         // hour
            'm+': minutes,       // minute
            's+': sec            // second
        };

        for (let key in obj) {
            if (obj.hasOwnProperty(key) && new RegExp('(' + key + ')').test(result)) {
                result = result.replace(RegExp.$1, RegExp.$1.length === 1
                    ? obj[key]
                    : ('00' + obj[key]).substr(('' + obj[key]).length));
            }
        }

        return result;
    },

    /**
     * 将传递进来的毫秒数，格式化为友好的时间格式
     *
     * @param {Number} millisecond 要格式化的毫秒数。格式化时是和当前时间比较的
     * @example
     * ```
     * date.humanTime(3666000);
     * ```
     * @return {String} 返回友好的时间格式。若 millisecond 参数有误或其参数的时间比当前时间还大将返回空字符串
     */
    humanTime: function (millisecond) {
        let diff = (Date.now() - millisecond) / 1000,
            dayDiff = Math.floor(diff / 86400);

        if (isNaN(dayDiff) || dayDiff < 0) return '';

        return dayDiff == 0 && (diff < 60 && '刚刚' || diff < 3600 && Math.floor(diff / 60) + '分钟前'
            || diff < 86400 && Math.floor(diff / 3600) + '小时前')
            || dayDiff == 1 && '昨天' || dayDiff < 7 && dayDiff + '天前'
            || dayDiff < 30 && Math.ceil(dayDiff / 7) + '周前'
            || dayDiff < 365 && Math.ceil(dayDiff / 30) + '个月前'
            || Math.ceil(dayDiff / 365) + '年前';
    }
};

