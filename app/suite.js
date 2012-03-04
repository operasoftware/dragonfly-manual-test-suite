"use strict";

(function()
{

  var FOLDER_PATH = "./FOLDERS/%s.json";
  var TEST_PATH = "./TESTS/%s.json";
  var FOR_EACH = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  var test_list = [];

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
      expand_folder(li, FOLDER_PATH.replace("%s", target.dataset.path));
  };

  var get_checkbox_children_of_parent = function(checkbox)
  {
    var ret = [];
    var ul = checkbox.get_ancestor("ul");  
    var boxes = ul && ul.querySelectorAll("input[type=checkbox]");
    if (boxes)
    {
      FOR_EACH(boxes, function(box)
      {
        if (box != checkbox && box.parentNode.parentNode.parentNode == ul)
          ret.push(box);
      });
    }
    return ret;
  };

  var get_parent_checkbox = function(checkbox)
  {
    var count = 2;
    while (checkbox && count)
    {
      checkbox = checkbox.parentElement.get_ancestor("li");
      count--;
    }
    return checkbox && checkbox.querySelector("input[type=checkbox]");
  };

  var normalize_paths = function(paths)
  {
    paths = paths.sort();
    var ret = [];
    for (var i = 0, path; path = paths[i]; i++)
    {
      if (ret.every(function(npath) { return !path.startswith(npath + '.'); }))
        ret.push(path);
    }
    return ret;
  };

  var add_remove_tests = function(event, target)
  {
    event.stopPropagation();
    var li = target.get_ancestor("li");
    if (!li)
      return;

    var new_tests = [];
    var removed_tests = [];
    var boxes = li.querySelectorAll("input[type=checkbox]");
    var parent_children_boxes = get_checkbox_children_of_parent(target);
    if (target.checked)
    {
      new_tests.push(target.parentNode.dataset.path);
      if (boxes)
        FOR_EACH(boxes, function(box) { box.checked = true; });
      
      if (parent_children_boxes.every(function(box) { return box.checked; }))
      {
        var box = get_parent_checkbox(target);
        if (box)
        {
          box.checked = true;
          new_tests.push(box.parentNode.dataset.path);
        }
      }
    }
    else
    {
      removed_tests.push(target.parentNode.dataset.path);
      if (boxes)
        FOR_EACH(boxes, function(box) { box.checked = false; });
      
      var box = get_parent_checkbox(target);
      if (box && box.checked)
      {
        box.checked = false;
        removed_tests.push(box.parentNode.dataset.path);
        parent_children_boxes.forEach(function(box)
        {
          if (box.checked)
            new_tests.push(box.parentNode.dataset.path);
        })
      }
    }

    new_tests = normalize_paths(new_tests);
    console.log(new_tests, removed_tests)
  };

  var show_test = function(event, target)
  {
    var path = TEST_PATH.replace("%s", target.dataset.id);
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
    EventHandler.register("click", "add-remove-tests", add_remove_tests);
    document.body.append_tmpl(templates.main());
    var root = document.querySelector(".sidepanel");
    try { expand_folder(root, "./folders/root.json"); }
    catch(e) { document.body.append_tmpl(templates.no_xhr()); };
  };

  window.onload = setup;

})();
