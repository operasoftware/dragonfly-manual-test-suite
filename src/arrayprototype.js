Array.prototype.contains = function(str)
{
  return this.indexOf(str) != -1;
};

Array.prototype.__defineGetter__("last", function()
{
   return this[this.length - 1];
});

Array.prototype.__defineSetter__("last", function() {});

Array.prototype.extend = function(list)
{
  this.push.apply(this, list);
  return this;
};

