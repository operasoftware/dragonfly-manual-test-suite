"use strict";

XMLHttpRequest.get_json = function(url, cb)
{
  var xhr = new this();
  xhr.onload = function()
  {
    cb(JSON.parse(this.responseText));
  }
  xhr.open("GET", url);
  xhr.send();
};
