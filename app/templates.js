"use strict";

window.templates || (window.templates = {});

templates.main = function()
{
  return (
  [
    ["div", {"class": "sidepanel"}],
    ["div", {"class": "test-description"}],
    ["div", {"class": "test-controls"},
      ["div", {"class": "main-controls"}, 
        ["input", {"type": "button",
                   "value": "Passed",
                   "data-handler": "test-passed"}],
        ["input", {"type": "button",
                   "value": "Failed",
                   "data-handler": "test-failed"}],
        ["input", {"type": "button",
                   "value": "Skip",
                   "data-handler": "test-skipped"}]],
        templates.summary(0, 0, 0, 0),
        ["div", {"class": "input-fields"},
          ["p", ["label", "BTS: ", ["input", {"id": "bts"}]]],
          ["p", ["label", "Comment:", 
                  ["textarea", {"id": "comment",
                                "rows": "5"}]]]]]]);
};

templates.summary = function(passed, failed, skipped, untested)
{
  var total = passed + failed + skipped + untested;
  return (
  ["table", {"class": "summary"},
    ["tr", ["td", "Passed"], ["td", String(passed)]],
    ["tr", ["td", "Failed"], ["td", String(failed)]],
    ["tr", ["td", "Skipped"], ["td", String(skipped)]],
    ["tr", ["td", "Untested"], ["td", String(untested)]],
    ["tr", ["td", "Total"], ["td", String(total)]]]);
}

templates.folder_expanded = function(data, path_list)
{
  return (
  ["ul",
    data.dirs.map(this.folder.bind(this, path_list)),
    data.files.map(this.test)]);
};

templates.folder = function(path_list, folder)
{
  for (var i = 0, ch_path; ch_path = path_list[i]; i++)
  {
    if (folder.path.startswith(ch_path + "."))
      break;
  }
  return (
  ["li", 
    {"class": "folder"},
    ["h3", {"data-handler": "expand-collapse",
            "data-path": folder.path,
            "class": "folder-title"},
      ["input", {"type": "checkbox",
                 "data-handler": "add-remove-tests",
                 "checked": ch_path && "checked"}],
      ["input", {"type": "button",
                 "class": "folder-button"}],
      folder.label]]);
};

templates.test = function(test)
{
  return (
  ["li", {"class": "test",
          "data-handler": "show-test",
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
  [["p", "Perhaps XMLHttpRequest is disabled for local host?"],
   ["p", ['a', {"href": "opera:config#UserPrefs|AllowFileXMLHttpRequest"},
                "opera:config#UserPrefs|AllowFileXMLHttpRequest"]]]);
}
