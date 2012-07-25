StyleSheetList.prototype.get_declaration = function(selector)
{
  for (var i = 0, sheet; sheet = this[i]; i++)
  {
    // does not take into account import rules
    for (var j = 0, rules = sheet.cssRules, rule; rule = rules[j]; j++)
    {
      if (rule.type == 1 && rule.selectorText == selector)
        return rule.style;
    }
  }
  return null;
};
