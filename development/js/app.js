(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = require('./zepto');

;(function($){
  var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  function ajaxDataFilter(data, type, settings) {
    if (settings.dataFilter == empty) return data
    var context = settings.context
    return settings.dataFilter.call(context, data, type)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
    //Used to handle the raw response data of XMLHttpRequest.
    //This is a pre-filtering function to sanitize the response.
    //The sanitized response should be returned
    dataFilter: empty
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }

    if (!settings.url) settings.url = window.location.toString()
    if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

          if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
            result = xhr.response
          else {
            result = xhr.responseText

            try {
              // http://perfectionkills.com/global-eval-what-are-the-options/
              // sanitize response accordingly if data filter callback provided
              result = ajaxDataFilter(result, dataType, settings)
              if (dataType == 'script')    (1,eval)(result)
              else if (dataType == 'xml')  result = xhr.responseXML
              else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
            } catch (e) { error = e }

            if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
          }

          ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

},{"./zepto":3}],2:[function(require,module,exports){
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = require('./zepto');

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      try {
        event.timeStamp || (event.timeStamp = Date.now())
      } catch (ignored) { }

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (callback === undefined || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

},{"./zepto":3}],3:[function(require,module,exports){
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj)

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.isNumeric = function(val) {
    var num = Number(val), type = typeof val
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }
  $.noop = function() {}

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function(){
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var nodes = [], collection = typeof selector == 'object' && $(selector)
      this.each(function(_, node){
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        if (node && nodes.indexOf(node) < 0) nodes.push(node)
      })
      return $(nodes)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    removeProp: function(name){
      name = propMap[name] || name
      return this.each(function(){ delete this[name] })
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      if (0 in arguments) {
        if (value == null) value = ""
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            var arr = []
            argType = type(arg)
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el))
              })
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src){
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window
              target['eval'].call(target, el.innerHTML)
            }
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

module.exports = Zepto;

},{}],4:[function(require,module,exports){
'use strict';

/**
 * web app 的启动入口
 */

var _zeptoModules = require('./js-libs-es6/zepto-modules');

var _zeptoModules2 = _interopRequireDefault(_zeptoModules);

var _cookie = require('./js-libs-es6/cookie/cookie');

var _cookie2 = _interopRequireDefault(_cookie);

var _page = require('./model/page');

var _page2 = _interopRequireDefault(_page);

var _pages = require('./pages/pages');

var _pages2 = _interopRequireDefault(_pages);

var _config = require('./model/config');

var _config2 = _interopRequireDefault(_config);

var _loading = require('./model/loading');

var _loading2 = _interopRequireDefault(_loading);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _zeptoModules2.default)(document).ready(function () {
    _loading2.default.hide('loading_global');
    _cookie2.default.init(_config2.default.cookiePrefix);
    _page2.default.init();
});

},{"./js-libs-es6/cookie/cookie":5,"./js-libs-es6/zepto-modules":14,"./model/config":15,"./model/loading":16,"./model/page":17,"./pages/pages":20}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @fileOverview cookie 相关处理方法，无依赖
 * @author: kelerliao
 */

exports.default = {
    prefix: '',

    init: function init(prefix) {
        this.prefix = prefix;
    },
    /**
     * 获取 cookie 值
     *
     * @method getKey
     * @param  {String} name cookie 名称
     * @return {*} 返回 name 对应的 cookie 值，如果没有，则返回空字符串
     */
    getKey: function getKey(name) {
        var r = new RegExp('(?:^|;+|\\s+)' + this.prefix + name + '=([^;]*)'),
            m = document.cookie.match(r);

        return !m ? '' : m[1];
    },

    /**
     * 设置 cookie 值
     *
     * @method setKey
     * @param {String} name cookie 名称
     * @param {*} value cookie 值
     * @param {Number} hour 有效时间
     * @param {String} domain 所属的域名
     * @param {String} path 对应的路径
     * @return {Boolean} 设置成功返回 true
     */
    setKey: function setKey(name, value, hour, domain, path) {
        var expire = new Date();

        hour > 0 && expire.setTime(expire.getTime() + 3600000 * hour);

        document.cookie = this.prefix + name + '=' + value + '; ' + (hour ? 'expires=' + expire.toUTCString() + '; ' : '') + (path ? 'path=' + path + '; ' : 'path=/; ') + (domain ? 'domain=' + domain + ';' : 'domain=' + document.domain + ';');

        return true;
    },

    /**
     * 删除 cookie
     *
     * @method removeKey
     * @param  {String} name cookie 名称
     * @param  {String} domain 所在域名
     * @param  {String} path 所在路径
     * @return {Boolean} 删除成功返回 true
     */
    removeKey: function removeKey(name, domain, path) {
        document.cookie = this.prefix + name + '=; expires=Mon, 26 Jul 2000 01:00:00 GMT; ' + (path ? 'path=' + path + '; ' : 'path=/; ') + (domain ? 'domain=' + domain + ';' : 'domain=' + document.domain + ';');

        return true;
    }
};

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @fileOverview core 相关方法，直接挂在 h5 下
 * @author: kelerliao
 */

var core = {};

var toString = Object.prototype.toString,
    slice = Array.prototype.slice,
    type = function type(param) {
    return toString.call(param).slice(8, -1).toLowerCase();
},
    extend = function extend(target, source, deep) {
    var key = void 0;

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
            } else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }
},
    merge = function merge(target, source) {
    var key = void 0;
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
core.extend = function (deep, target, source /*[, sourceMore ...]*/) {
    var args = slice.call(arguments, 1);

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

    var methods = snAndModuleAndMethods.split(','),
        splits = void 0,
        obj = void 0,
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
core.merge = function (target, source /*[, source2 ...]*/) {
    var args = slice.call(arguments, 1);

    if (type(target) === 'object') {
        args.forEach(function (v) {
            merge(target, v);
        });
    }

    return target;
};

exports.default = core;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stats = require('../stats/stats');

var _stats2 = _interopRequireDefault(_stats);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventHandlerMap = {}; // {'click': [{el: null, fn: null}]}

/**
 * @fileOverview event 相关处理方法，依赖 stats 模块
 * @author: kelerliao
 */

// 由于 stats 模块要跟随业务代码放一起。所以此处 import stats 只有模板和接口本身，具体实现会在页面代码中还有一个 stats.js 做具体的接口实现
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

    if (el.addEventListener) {
        // W3C
        el.addEventListener(event, fn, true);
    } else if (el.attachEvent) {
        // IE
        el.attachEvent('on' + event, fn);
    } else {
        el[event] = fn;
    }
}

function removeEvent(el, event, fn) {
    if (el.removeEventListener) {
        // W3C
        el.removeEventListener(event, fn, true);
    } else if (el.detachEvent) {
        // IE
        el.detachEvent('on' + event, fn);
    } else {
        el[event] = null;
    }
}

function mapEvent(el, event, fn) {
    var events = eventHandlerMap[event] || [],
        obj = void 0,
        isAdded = false,
        i = void 0,
        len = events.length;

    if (len === 0) {
        eventHandlerMap[event] = [{ el: el, fn: fn }];
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
        events.push({ el: el, fn: fn });
    }
}

/**
 * 在事件触发时，取得想要的元素
 * @param {Event} evt 事件对象
 * @param {Element} topElem 查找的最终祖先节点，从事件起始元素向上查找到此元素为止
 * @param {Function} judgeFn 判断是否目标元素的函数
 */
function getWantTarget(evt, topElem, judgeFn) {
    var targetEl = evt.srcElement || evt.target;

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

    var isTap = true,
        targetHover = void 0,
        keyHover = void 0,
        intervalId = void 0;

    var eventHandler = function eventHandler(evt) {
        var eventEl = topEl.getAttribute ? topEl : document.body,
            // 如果 topEl = window | document 就降级到 body 中寻找 data-* 的属性
        target = getWantTarget(evt, eventEl, getEventKeyFn),
            targetHot = getWantTarget(evt, eventEl, getHotKeyFn),
            event = void 0,
            returnValue = void 0,
            hot = void 0;

        if (target) {
            event = getEventKeyFn(target);

            // 支持直接绑定方法
            if (Object.prototype.toString.call(dealFnMap) === '[object Function]') {
                returnValue = dealFnMap.call(target, evt);
            } else {
                if (dealFnMap[event]) {
                    returnValue = dealFnMap[event].call(target, evt);
                }
            }

            if (!returnValue) {
                if (evt.preventDefault) evt.preventDefault();else evt.returnValue = false;
            }
        }

        // 点击流
        if (targetHot && _stats2.default && /click|tap/.test(eventType)) {
            hot = getHotKeyFn(targetHot);
            hot && _stats2.default.click(hot);
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
    } else {
        addEvent(topEl, eventType, eventHandler);
    }
}

/**
 * 通用的解除绑定事件处理
 * @param {Element} topEl 要解除绑定事件的元素
 * @param {String} eventType 解除绑定的事件类型
 */
function unbind(topEl, eventType) {
    var events = eventHandlerMap[eventType] || [],
        obj = void 0,
        i = void 0,
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

exports.default = {
    on: bind,
    off: unbind
};

},{"../stats/stats":12}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _core = require('../core');

var _core2 = _interopRequireDefault(_core);

var _util = require('../util/util');

var _util2 = _interopRequireDefault(_util);

var _security = require('../security/security');

var _security2 = _interopRequireDefault(_security);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    getKey: function getKey(key) {
        var result = void 0,
            hashStr = window.location.hash,
            regExp = new RegExp('(#|&)+' + key + '=([^&#]*)');

        result = hashStr.match(regExp);

        return !result ? '' : _security2.default.htmlEncode(decodeURIComponent(result[2]));
    },

    setKey: function setKey(key, value, string) {
        var hasStr = _core2.default.type(string) === 'string',
            hashStr = hasStr ? string : window.location.hash,
            hashObj = _util2.default.toObject(hashStr) || {};

        hashObj[key] = value;
        hashStr = _util2.default.toParams(hashObj);

        if (!hasStr) {
            window.location.hash = hashStr;
        }
        return hashStr;
    },

    removeKey: function removeKey(key, string) {
        var hasStr = _core2.default.type(string) === 'string',
            hashStr = hasStr ? string : window.location.hash,
            hashObj = _util2.default.toObject(hashStr) || {};

        delete hashObj[key];
        hashStr = _util2.default.toParams(hashObj);

        if (!hasStr) {
            window.location.hash = hashStr;
        }
        return hashStr;
    }
}; /**
    * @fileOverview hash 相关处理方法，依赖 core util security 模块
    * @author: kelerliao
    */

},{"../core":6,"../security/security":11,"../util/util":13}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _core = require('../core');

var _core2 = _interopRequireDefault(_core);

var _util = require('../util/util');

var _util2 = _interopRequireDefault(_util);

var _security = require('../security/security');

var _security2 = _interopRequireDefault(_security);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var aEl = null,
    getLocation = function getLocation(string) {
    aEl == null && (aEl = document.createElement('a'));
    aEl.href = string;
    return aEl;
}; /**
    * @fileOverview param 相关处理方法，依赖 core util security 模块
    * @author: kelerliao
    */

exports.default = {
    /**
     * 获取 URL 或指定字符串中的参数值
     * @example
     * ```
     * // 获取当前页面的 URL 中的参数值
     * h5.param.getKey('name');
     *
     * // 获取指定字符串中的参数值
     * h5.param.getKey('name', 'http://mb.qq.com/index.html?name=keler');
     * ```
     * @param {String} key 要获取的参数 Key
     * @param {String} [string=undefined] 可选，默认为 undefined。指定的字符串
     * @return {String} 返回对应 Key 的参数值。若有值，该值是已经过 XSS 转码的字符串；若无值返回空字符
     */
    getKey: function getKey(key, string) {
        var result = void 0,
            paramStr = _core2.default.type(string) === 'string' ? string : window.location.search,
            regExp = new RegExp('(\\?|&)+' + key + '=([^&\\?]*)');

        result = paramStr.match(regExp);

        return !result ? '' : _security2.default.htmlEncode(decodeURIComponent(result[2]));
    },

    /**
     * 新增、修改 URL 或指定字符串中的参数
     * @example
     * ```
     * // 单个设置当前页面的 URL 参数
     * h5.param.setKey('name');
     *
     * // 批量设置当前页面的 URL 参数
     * h5.param.setKey({'name': 'keler', age: 20});
     *
     * // 单个设置指定字符串的参数
     * h5.param.setKey('name', 'keler', 'http://mb.qq.com/index.html');
     * // 返回值：http://mb.qq.com/index.html?name=keler
     *
     * // 批量设置指定字符串的参数
     * h5.param.setKey({'name': 'keler', age: 20}, 'http://mb.qq.com/index.html');
     * // 返回值：http://mb.qq.com/index.html?name=keler&age=20
     * ```
     * @param {String|Object} key 要新增或修改的参数 Key。可为单个设置的字符串，也可为批量设置的Key-Value对象
     * @param {String} value 若key为字符串则是要设置的key值；若key为Key-Value对象，则为指定的字符串或为undefined
     * @param {String} [string=undefined] 可选，默认为 undefined。指定要设置的字符串
     * @return {String} 返回设置好的字符串
     */
    setKey: function setKey(key, value, string) {
        var hasStr = void 0,
            strLocation = void 0,
            paramStr = void 0,
            hashObj = void 0,
            isBatch = false;

        if (_core2.default.type(key) === 'object') {
            string = value;
            isBatch = true;
        }

        hasStr = _core2.default.type(string) === 'string';

        if (hasStr) {
            strLocation = getLocation(string);
            paramStr = strLocation.search;
        } else {
            paramStr = window.location.search;
        }

        hashObj = _util2.default.toObject(paramStr) || {};

        if (!isBatch) {
            hashObj[key] = value;
        } else {
            for (var p in key) {
                if (key.hasOwnProperty(p)) {
                    hashObj[p] = key[p];
                }
            }
        }
        paramStr = _util2.default.toParams(hashObj);

        if (hasStr) {
            paramStr = strLocation.origin + strLocation.pathname + '?' + paramStr + strLocation.hash;
        } else {
            window.location.search = paramStr;
        }
        return paramStr;
    },

    /**
     * 删除 URL 或指定字符串中的参数
     * @example
     * ```
     * // 单个删除当前页面的 URL 参数
     * h5.param.removeKey('name');
     *
     * // 批量删除当前页面的 URL 参数
     * h5.param.removeKey(['name', 'age']);
     *
     * // 单个删除指定字符串的参数
     * h5.param.removeKey('name', 'http://mb.qq.com/index.html?name=keler&age=20');
     * // 返回值：http://mb.qq.com/index.html?age=20
     *
     * // 批量删除指定字符串的参数
     * h5.param.removeKey(['name', 'age'], 'http://mb.qq.com/index.html?name=keler&age=20');
     * // 返回值：http://mb.qq.com/index.html
     * ```
     * @param {String|Array} key 要删除的参数 Key。可为单个删除的字符串，也可为批量删除的Key-Value对象
     * @param {String} [string=undefined] 可选，默认为 undefined。指定要设置的字符串
     * @return {String} 返回设置好的字符串
     */
    removeKey: function removeKey(key, string) {
        var hasStr = _core2.default.type(string) === 'string',
            strLocation = void 0,
            paramStr = void 0,
            hashObj = void 0,
            keyType = _core2.default.type(key);

        if (hasStr) {
            strLocation = getLocation(string);
            paramStr = strLocation.search;
        } else {
            paramStr = window.location.search;
        }

        hashObj = _util2.default.toObject(paramStr) || {};

        if (keyType === 'string') {
            delete hashObj[key];
        } else if (keyType === 'array') {
            key.forEach(function (p) {
                delete hashObj[p];
            });
        }

        paramStr = _util2.default.toParams(hashObj);

        if (hasStr) {
            paramStr = strLocation.origin + strLocation.pathname + '?' + paramStr + strLocation.hash;
        } else {
            window.location.search = paramStr;
        }
        return paramStr;
    }
};

},{"../core":6,"../security/security":11,"../util/util":13}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @fileOverview render 相关处理方法
 * @author: kelerliao
 */

exports.default = {
    /**
     * 将模板文件渲染为 html
     *
     * @for exports.render
     * @method html
     * @param {String} template 要渲染的模板
     * @param {Object} data 要渲染到模板的数据
     * @param {Object} [opt] 可选选项
     * @return {String} 返回用 data 渲染 template 后的 html
     */
    html: function () {
        var cache = {},
            openTag = void 0,
            closeTag = void 0;

        return function tpl(str, data, opt) {
            opt = opt || {};
            var key = opt.key,
                regExp = void 0;

            // 默认值(<% %>)会和其他系统（如：pms系统）的模版符号一致，导致冲突报错，故这里用转义字符
            openTag = opt.openTag || decodeURIComponent('%3C%25'); // 默认值是： <%
            closeTag = opt.closeTag || decodeURIComponent('%25%3E'); // 默认值是： %>
            regExp = new RegExp('\t=(.*?)' + closeTag, 'g');

            var fn = key ? cache[key] = cache[key] || tpl(str) : new Function('obj', 'var _p_=[];with(obj){_p_.push(\'' + str.replace(/[\r\t\n]/g, ' ').split('\'').join('\\').split(openTag).join('\t').replace(regExp, '\',$1,\'').split('\t').join('\');').split(closeTag).join('_p_.push(\'') + '\');}return _p_.join("");');

            return data ? fn(data) : fn;
        };
    }()
};

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @fileOverview security 相关处理方法
 * @author: kelerliao
 */

var _encodeReg = {
    'lt': /</g,
    'gt': />/g,
    'amp': /&/g,
    'quot': /"/g,
    '#39': /'/g,
    '#61': /=/g,
    '#96': /`/g
},
    _decodeReg = {
    'lt': /&lt;/g,
    'gt': /&gt;/g,
    'amp': /&amp;/g,
    'quot': /&quot;/g,
    '#39': /&#39;/g
};

exports.default = {
    /**
     * html正文编码：对需要出现在HTML正文里(除了HTML属性外)的不信任输入进行编码
     * @example h5.security.htmlEncode(str);
     * @param {String} str 要编码的html字符串
     * @return {String} 返回编码后的html字符串
     */
    htmlEncode: function htmlEncode(str) {
        if (typeof str !== 'string') {
            return str;
        }

        return str.replace(_encodeReg.amp, '&amp;').replace(_encodeReg.gt, '&gt;').replace(_encodeReg.lt, '&lt;').replace(_encodeReg.quot, '&quot;').replace(_encodeReg['#39'], '&#39;');
    },

    /**
     * html正文解码：对 htmlEncode 函数的结果进行解码
     * @example h5.security.htmlDecode(str);
     * @param {String} str 要解码的html字符串
     * @return {String} 返回解码后的html字符串
     */
    htmlDecode: function htmlDecode(str) {
        if (typeof str !== 'string') {
            return str;
        }

        return str.replace(_decodeReg.amp, '&').replace(_decodeReg.gt, '>').replace(_decodeReg.lt, '<').replace(_decodeReg.quot, '"').replace(_decodeReg['#39'], '\'');
    }
};

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _util = require('../util/util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.navigator.sendBeacon = 'sendBeacon' in window.navigator ? window.navigator.sendBeacon : function (url, data) {
    var xhr = 'XMLHttpRequest' in window ? new XMLHttpRequest() : new window.ActiveXObject('Microsoft.XMLHTTP');
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
}; /**
    * 统计上报器，包括返回码上报、测速上报、点击流上报和基础数据上报，基础数据上报如：pv、uv等，依赖 util.js
    *
    * @class h5.stats
    * @author: kelerliao
    */

exports.default = {
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
    init: function init(params) {
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
    click: function click(pageIdAndActionId) {
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
        var url = this._statsUrl + _util2.default.toParams({});
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
    pv: function pv(pageId) {
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

},{"../util/util":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _core = require('../core');

var _core2 = _interopRequireDefault(_core);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    /**
     * 将 URL 参数格式转化成对象。依赖 Array.prototype.forEach() 函数
     *
     * @for exports.util
     * @method toObject
     * @param {String} params 要转换的 key-value 字符串，默认分隔符为 &
     * @return {Object}
     */
    toObject: function toObject(params) {
        var result = {},
            pairs = void 0,
            pair = void 0,
            key = void 0,
            value = void 0;

        if (_core2.default.type(params) === 'object') {
            return params;
        } else if (params === '') {
            return {};
        }

        pairs = String(params).replace('?', '').replace('#', '').split('&');

        pairs.forEach(function (keyVal) {
            pair = keyVal.split('=');
            key = pair[0];
            value = pair.slice(1).join('=');
            result[decodeURIComponent(key)] = decodeURIComponent(value);
        });

        return result;
    },

    /**
     * 将对象转化成 URL 参数格式
     *
     * @for exports.util
     * @method toParams
     * @param {Object} object 要转换的对象，默认分隔符为 &
     * @return {String} 返回字符串，如：a=1&b=2
     */
    toParams: function toParams(object) {
        var arr = [],
            type = void 0,
            value = void 0;

        if (typeof object === 'string') {
            return object;
        }

        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                value = object[key];
                type = _core2.default.type(value);

                if (type === 'object' || type === 'array') {
                    value = JSON.stringify(value);
                }

                arr.push(key + '=' + encodeURIComponent(value));
            }
        }

        return arr.join('&');
    },

    /**
     * 比较两个版本号的大小。version1 > version2 返回大于零的值；version1 = version2 返回零；version1 < version2 返回小于零的值
     *
     * @for exports.util
     * @method compareVersion
     * @param {String} version1 版本号1
     * @param {String} version2 版本号2
     * @param {String} [separator=.] 可选，默认值是点（.），版本号数字之间的分隔符
     * @example
     * ```
     * h5.util.compareVersion('1.0.4', '1.2.1'); // version1 < version2 返回小于零的值
     * ```
     * @return {Number} version1 > version2 返回大于零的值；version1 = version2 返回零；version1 < version2 返回小于零的值
     * @support iOSVersion 4.2, androidVersion 4.2
     * @iOSAutoTest '1.0.4', '1.2.1'
     * @androidAutoTest '1.0.4', '1.2.1'
     */
    compareVersion: function compareVersion(version1, version2, separator /*undefined*/) {
        var s = separator || '.';

        version1 = version1.toString();
        version2 = version2.toString();

        return version1.split(s)[0] - version2.split(s)[0] == 0 && version1 != version2 ? this.compareVersion(version1.split(s).splice(1).join(s), version2.split(s).splice(1).join(s)) : version1.split(s)[0] - version2.split(s)[0];
    },
    /**
     * 获取元素相对 body 左上角坐标的相对位置值
     *
     * @param {Element} element 要获取的元素
     * @return {{x: number, y: number}}
     */
    getPosition: function getPosition(element) {
        var xPosition = 0;
        var yPosition = 0;

        while (element) {
            xPosition += element.offsetLeft - element.scrollLeft + element.clientLeft;
            yPosition += element.offsetTop - element.scrollTop + element.clientTop;
            element = element.offsetParent;
        }
        return { x: xPosition, y: yPosition };
    }
}; /**
    * @fileOverview util 相关处理方法
    * @author: kelerliao
    */

},{"../core":6}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _zepto = require('zepto-modules/zepto');

var _zepto2 = _interopRequireDefault(_zepto);

require('zepto-modules/event');

require('zepto-modules/ajax');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_zepto2.default.keler = 123; /**
                              * custom zepto module
                              */
exports.default = _zepto2.default;

},{"zepto-modules/ajax":1,"zepto-modules/event":2,"zepto-modules/zepto":3}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _param = require('../js-libs-es6/param/param');

var _param2 = _interopRequireDefault(_param);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = {
    stats: {
        statsUrl: 'http://act.html5.qq.com/qb_ams?cmd=report&',
        actId: 'ar-activity',
        openid: '',
        channelId: _param2.default.getKey('channel') || 'normal'
    },

    cookiePrefix: 'ar', //本活动所有cookie名（key）的前缀
    apiUrl: 'http://act.html5.qq.com/zhongchou', //后台接口的url
    mainUrl: 'http://pms.mb.qq.com/index?aid=act13&cid=0613daomu&channel='
};

exports.default = config;

},{"../js-libs-es6/param/param":9}],16:[function(require,module,exports){
'use strict';

/**
 * loading 模块
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    show: function show(id) {
        document.getElementById(id).style.display = '';
    },
    hide: function hide(id) {
        document.getElementById(id).style.display = 'none';
    }
};

},{}],17:[function(require,module,exports){
'use strict';

/**
 * page 管理
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _zeptoModules = require('../js-libs-es6/zepto-modules');

var _zeptoModules2 = _interopRequireDefault(_zeptoModules);

var _event = require('../js-libs-es6/event/event');

var _event2 = _interopRequireDefault(_event);

var _hash = require('../js-libs-es6/hash/hash');

var _hash2 = _interopRequireDefault(_hash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var page = {
    _$wrap: null,
    _curId: null,
    _page: 'cover', // 配置默认页面，hash 的 page 值为空时，就使用该默认值

    init: function init() {
        var hashPage = _hash2.default.getKey('page');

        this._$wrap = (0, _zeptoModules2.default)('#pageWrap');
        this._bindEvent();

        if (hashPage) {
            this._page = hashPage;
            this.goto(this._page, true);
        } else {
            _hash2.default.setKey('page', this._page);
        }
    },

    goto: function goto(id, isFromHashChange) {
        var _self = this;
        if (id === this._curId || page[id] == null) {
            return;
        }

        if (isFromHashChange) {
            console.log('goto()::id =', id, isFromHashChange);

            _event2.default.off(this._$wrap[0], 'tap');
            this._setClassName(page[id].pageClassName);
            page[id].show(_self._$wrap);
            this._curId = id;
        } else {
            _hash2.default.setKey('page', id);
        }
    },

    _bindEvent: function _bindEvent() {
        var _self = this;

        window.addEventListener('hashchange', function () {
            _self.goto(_hash2.default.getKey('page'), true);
        });
    },

    _setClassName: function _setClassName(id) {
        this._$wrap.attr('class', id);
    }
};exports.default = page;

},{"../js-libs-es6/event/event":7,"../js-libs-es6/hash/hash":8,"../js-libs-es6/zepto-modules":14}],18:[function(require,module,exports){
'use strict';

/**
 * 游戏活动结束页
 */

var _render = require('../../js-libs-es6/render/render');

var _render2 = _interopRequireDefault(_render);

var _event = require('../../js-libs-es6/event/event');

var _event2 = _interopRequireDefault(_event);

var _page = require('../../model/page');

var _page2 = _interopRequireDefault(_page);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_page2.default.arscan = {
    _$wrap: null,
    pageClassName: 'arscan-page',
    _template: '<div class="act-over">arscan page</div><p><%=a%></p><p>收藏该页面，关注我们的下期活动吧！</p><footer>最终解释权归QQ浏览器所有</footer><button data-event="gotoCoverPage">go cover</button>',

    show: function show($wrap) {
        this._$wrap = $wrap;
        this._reader();
    },

    _reader: function _reader() {
        this._$wrap.html(_render2.default.html(this._template, { a: 123 }));
        this._bindEvent();
    },

    _bindEvent: function _bindEvent() {
        _event2.default.on(this._$wrap[0], 'tap', {
            gotoCoverPage: function gotoCoverPage() {
                _page2.default.goto('cover');
            }
        });
    }
};

},{"../../js-libs-es6/event/event":7,"../../js-libs-es6/render/render":10,"../../model/page":17}],19:[function(require,module,exports){
'use strict';

/**
 * 游戏活动结束页
 */

var _render = require('../../js-libs-es6/render/render');

var _render2 = _interopRequireDefault(_render);

var _event = require('../../js-libs-es6/event/event');

var _event2 = _interopRequireDefault(_event);

var _page = require('../../model/page');

var _page2 = _interopRequireDefault(_page);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_page2.default.cover = {
    _$wrap: null,
    pageClassName: 'cover-page',
    _template: '<div class="act-over"></div><p class="info">小伙伴们太腻害，QQ浏览器流量宝藏<br>被抢光了，期待下一期更精彩的活动~</p><p>收藏该页面，关注我们的下期活动吧！</p><footer>最终解释权归QQ浏览器所有</footer><button data-event="gotoShow3dPage">go arscan</button>',

    show: function show($wrap) {
        this._$wrap = $wrap;
        this._reader();
    },

    _reader: function _reader() {
        this._$wrap.html(_render2.default.html(this._template, {}));
        this._bindEvent();
    },

    _bindEvent: function _bindEvent() {
        _event2.default.on(this._$wrap[0], 'tap', {
            gotoShow3dPage: function gotoShow3dPage() {
                _page2.default.goto('arscan');
            }
        });
    }
};

},{"../../js-libs-es6/event/event":7,"../../js-libs-es6/render/render":10,"../../model/page":17}],20:[function(require,module,exports){
'use strict';

var _index = require('./cover/index');

var _index2 = _interopRequireDefault(_index);

var _index3 = require('./arscan/index');

var _index4 = _interopRequireDefault(_index3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./arscan/index":18,"./cover/index":19}]},{},[4]);
