String.prototype.contains = function(str)
{
  return this.indexOf(str) != -1;
};

String.prototype.isdigit = function()
{
  return this.length && !(/\D/.test(this));
};

String.prototype.startswith = function(str)
{
  return this.slice(0, str.length) === str;
};

String.prototype.endswith = function(str)
{
  return this.slice(this.length - str.length) === str;
};