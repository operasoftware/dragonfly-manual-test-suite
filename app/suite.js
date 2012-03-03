"use strict";

(function()
{

  var expand_collapse = function(event, target)
  {
    if (event.target.type == "checkbox")
      return;

    var li = target.parentNode;
    var ul = li.querySelector("ul");
    if (ul)
    {
      li.removeChild(ul);
      li.classList.remove("open");
    }
    else
      expand_folder(li, "./FOLDERS/" + target.dataset.path)
  };

  var show_test = function(event, target)
  {
    var path = target.dataset.path;
    XMLHttpRequest.get_json(path, function(data)
    {
      var container = document.querySelector(".test-description");
      container.innerHTML = "";
      var selected = document.querySelector(".sidepanel .selected");
      if (selected)
        selected.classList.remove("selected");

      target.classList.add("selected");
      container.append_tmpl(templates.test_description(data, path));
    });
  };

  var expand_folder = function(container, path)
  {
    XMLHttpRequest.get_json(path, function(data)
    {
      container.append_tmpl(templates.folder_expanded(data));
      container.classList.add("open");
    });
  };

  var setup = function()
  {
    EventHandler.register("click", "expand-collapse", expand_collapse);
    EventHandler.register("click", "show-test", show_test);
    document.body.append_tmpl(templates.main());
    var root = document.querySelector(".sidepanel");
    try { expand_folder(root, "./folders/root.json"); }
    catch(e) { document.body.append_tmpl(templates.no_xhr()); };
  };

  window.onload = setup;

})();
