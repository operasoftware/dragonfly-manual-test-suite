window.templates || (window.templates = {});

templates.main = function()
{
  return (
  [
    ["div", {"class": "sidepanel"}],
    ["div", {"class": "test-description"}]
  ]);
};

templates.components = function(data)
{
  return ["ul", data.map(templates.folders)];
};

templates.folders = function(folder)
{
  return ["li", {"class": "folder", "data-folder": folder.path}, folder.label]
}