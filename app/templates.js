"use strict";

window.templates || (window.templates = {});

templates.main = function()
{
  return (
  [
    ["div", {"class": "sidepanel"}],
    ["div", {"class": "test-description"}]
  ]);
};

templates.folder_expanded = function(data)
{
  return (
  ["ul",
    data.dirs.map(this.folder),
    data.files.map(this.test)]);
};

templates.folder = function(folder)
{
  return (
  ["li", 
    {"class": "folder"},
    ["h3", {"data-handler": "expand-collapse",
            "data-path": folder.path},
      ["input", {"type": "checkbox",
                 "class": ""}],
      ["input", {"type": "button",
                 "class": "folder-button"}],
      folder.label]]);
};

templates.test = function(test)
{
  return (
  ["li", {"class": "test",
          "data-handler": "show-test",
          "data-path": test.path,
          "data-id": test.id},
    ["h3", test.label]]);
};

templates.test_description = function(data, path)
{
  return (
  ["div",
    ["h2", data.label],
    ["ol", data.desc.map(this.test_step)],
    ["p", ["a", {"href": data.url}, data.url]]]);
};

templates.test_step = function(step)
{
  return ["li", step]
};

templates.no_xhr = function()
{
  return (
  [["p", "Perhaps XMLHttpRequest  is disabled for local host?"],
   ["p", ['a', {"href": "opera:config#UserPrefs|AllowFileXMLHttpRequest"},
                "opera:config#UserPrefs|AllowFileXMLHttpRequest"]]]);
}
