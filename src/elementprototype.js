"use strict";

Element.prototype.append_tmpl = function(tmpl)
{
  var ELE_NAME = 0;
  var ATTRS = 1;
  var ele = null;
  var i = 0;
  if (typeof tmpl[ELE_NAME] == "string")
  {
    i++;
    ele = tmpl[ELE_NAME] in CustomElements
        ? CustomElements[tmpl[ELE_NAME]].create()
        : document.createElement(tmpl[ELE_NAME]);
    if (Object.prototype.toString.call(tmpl[ATTRS]) == "[object Object]")
    {
      i++;
      var attrs = tmpl[ATTRS];
      if (attrs)
      {
        for (var prop in attrs)
        {
          if (typeof attrs[prop] == "string")
            ele.setAttribute(prop, attrs[prop]);
        }
      }
    }
  }
  for (; i < tmpl.length; i++)
  {
    if (typeof tmpl[i] == "string")
      ele.appendChild(document.createTextNode(tmpl[i]))
    else
      (ele || this).append_tmpl(tmpl[i]);
  }
  if (ele)
    this.appendChild(ele);
};

Element.prototype.replace_with_tmpl = function(tmpl)
{
  var parent = this.parentNode, ret = [];
  if (parent)
  {
    var div = document.createElement('div');
    var doc_frag = document.createDocumentFragment();
    div.append_tmpl(tmpl);
    while (div.firstChild)
    {
      ret.push(doc_frag.appendChild(div.firstChild));
    }
    parent.replaceChild(doc_frag, this);
    return ret;
  }
  return null;
}

Element.prototype.get_ancestor = function(selector)
{
  var ele = this;
  while (ele)
  {
    if (ele.matchesSelector(selector))
      return ele;

    ele = ele.parentElement;
  }
  return null;
};

Element.prototype.dispatchMouseEvent = function(type, ctrl_key, alt_key, shift_key)
{
  var event = document.createEvent('MouseEvents');
  var box = this.getBoundingClientRect();
  var client_x = box.left + box.width * .5;
  var client_y = box.top + box.height * .5;
  event.initMouseEvent(type, true, true, window, 1,
                       window.screenLeft + client_x,
                       window.screenTop + client_y,
                       client_x, client_y,
                       Boolean(ctrl_key), Boolean(alt_key), Boolean(shift_key), false,
                       0, null);
  this.dispatchEvent(event);
};

if (!document.createElement("div").dataset)
{
  Element.prototype.__defineGetter__("dataset", function()
  {
    return Array.prototype.reduce.call(this.attributes, function(dict, attr)
    {
      if (attr.name.indexOf("data-") == 0)
        dict[attr.name.slice(5)] = attr.value;

      return dict;
    }, {});
  });
}

if (!Element.prototype.matchesSelector)
{
  Element.prototype.matchesSelector =
    Element.prototype.oMatchesSelector ?
    Element.prototype.oMatchesSelector :
    function(selector)
    {
      var sel = this.parentNode.querySelectorAll(selector);
      for (var i = 0; sel[i] && sel[i] != this; i++);
      return Boolean(sel[i]);
    }
}


window.CustomElements = new function()
{
  this._init_queue = [];

  this._init_listener = function(event)
  {
    var queue = CustomElements._init_queue;
    var wait_list = [];
    var target = event.target;

    for (var i = 0, item; item = queue[i]; i++)
    {
      if (target.contains(item.ele))
        CustomElements[item.type].init(item.ele);
      else
        wait_list.push(item);
    }
    CustomElements._init_queue = wait_list;
    if (!wait_list.length)
      document.removeEventListener('DOMNodeInserted', CustomElements._init_listener, false);
  };

  this.add = function(CustomElementClass)
  {
    CustomElementClass.prototype = this.Base;
    var custom_element = new CustomElementClass();
    if (custom_element.type)
    {
      for (var i = 1, feature; feature = arguments[i]; i++)
      {
        if (feature in this)
          this[feature].apply(custom_element);
      }
      this[custom_element.type] = custom_element;
    }
  }
};

window.CustomElements.Base = new function()
{
  this.create = function()
  {
    var ele = document.createElement(this.html_name);
    if (!CustomElements._init_queue.length)
      document.addEventListener('DOMNodeInserted', CustomElements._init_listener, false);
    CustomElements._init_queue.push({ele: ele, type: this.type});
    return ele;
  }

  this.init = function(ele)
  {
    if (this._inits)
    {
      this._inits.forEach(function(init)
      {
        init.call(this, ele);
      }, this);
    }
  }
};

window.CustomElements.AutoScrollHeightFeature = function()
{
  this._adjust_height = function(delta, event)
  {
    if (!this.value)
    {
      this.style.height = "auto";
    }
    else
    {
      this.style.height = "0";
      this.style.height = this.scrollHeight + delta + "px";
    }
  };

  this._get_delta = function(ele)
  {
    var style = window.getComputedStyle(ele, null);
    var is_border_box = style.getPropertyValue("box-sizing") == "border-box";
    var prop = is_border_box ? "border" : "padding";
    var sign = is_border_box ? 1 : -1;

    return (sign * parseInt(style.getPropertyValue(prop + "-bottom")) || 0) +
           (sign * parseInt(style.getPropertyValue(prop + "-top")) || 0);
  };

  (this._inits || (this._inits = [])).push(function(ele)
  {
    var delta = this._get_delta(ele);
    var adjust_height = this._adjust_height.bind(ele, delta);
    adjust_height();
    ele.addEventListener("input", adjust_height, false);
    // Custom event to force adjust of height
    ele.addEventListener("heightadjust", adjust_height, false);
  });

};

CustomElements.add(function()
                   {
                     this.type = "auto-height-textarea";
                     this.html_name = "textarea";
                   },
                   "AutoScrollHeightFeature");
