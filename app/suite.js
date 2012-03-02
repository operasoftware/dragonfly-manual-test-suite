"use strict";

(function()
{

  var expand_collapse = function(event, target)
  {
    var li = target.parentNode.parentNode;
    var ul = li.querySelector("ul");
    if (ul)
      li.removeChild(ul);
    else
      expand_folder(li, target.dataset.path)
  };

  var show_test = function(event, target)
  {
    var path = target.dataset.path;
    XMLHttpRequest.get_json(path, function(data)
    {
      var container = document.querySelector(".test-description");
      container.innerHTML = "";
      container.append_tmpl(templates.test_description(data, path));
    });
  };

  var expand_folder = function(container, path)
  {
    XMLHttpRequest.get_json(path, function(data)
    {
      container.append_tmpl(templates.folder_expanded(data))
    });
  };

  var setup = function()
  {
    EventHandler.register("click", "expand-collapse", expand_collapse);
    EventHandler.register("click", "show-test", show_test);
    document.body.append_tmpl(templates.main());
    var root = document.querySelector(".sidepanel");
    expand_folder(root, "./folders/root.json");
  };

  window.onload = setup;

})();
