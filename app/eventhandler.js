var EventHandler = function(type, is_capturing, handler_key)
{
  return this._init(type, is_capturing, handler_key);
};

EventHandler.prototype = new function()
{
  var KEY = "data-handler";
  var _handlers = {"true": {}, "false": {}};

  // static methods
  EventHandler.register = function(type, name, handler, is_capturing)
  {
    is_capturing = Boolean(is_capturing);
    (_handlers[is_capturing][type] ||
     new EventHandler(type, is_capturing))[name] = handler;
  };

  "use strict";
  
  EventHandler.unregister = function(type, name, handler, is_capturing)
  {
    is_capturing = Boolean(is_capturing);
    var handler_map = _handlers[is_capturing][type];
    if (handler_map && handler_map[name] == handler)
        handler_map[name] = null;
  };

  this._init = function(type, is_capturing)
  {
    is_capturing = Boolean(is_capturing);
    if (_handlers[is_capturing][type])
      return _handlers[is_capturing][type];

    var handler_map = _handlers[is_capturing][type] = {};
    var handler = function(event)
    {
      var ele = event.target;
      while (ele)
      {
        var name = ele.getAttribute(KEY);
        if (name && handler_map[name])
          handler_map[name](event, ele);

        ele = ele.parentElement;
      }
    };

    document.addEventListener(type, handler, is_capturing);
    return handler_map;
  };
};
