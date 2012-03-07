"use strict";

(function()
{

  var FOLDER_PATH = "./FOLDERS/%s.json";
  var TEST_PATH = "./TESTS/%s.json";
  var TESTLISTS_PATH = "./TESTLISTS/%s.json";
  var FOR_EACH = Array.prototype.forEach.call.bind(Array.prototype.forEach);
  var PASSED = 1;
  var FAILED = 2;
  var SKIPPED = 3;
  var STATE_CLASSES = [];
  STATE_CLASSES[PASSED] = "test-passed";
  STATE_CLASSES[FAILED] = "test-failed";
  STATE_CLASSES[SKIPPED] = "test-skipped";
  var STATE = 0;
  var BTS_LIST = [];
  var COMMENT = 2;
  var UP = -1;
  var DOWN = 1;

  var _test_lists_map = Object.create(null);
  var _test_list_keys = [];

  var _test_list = [];
  var _tests_map = Object.create(null);

  var _cursor = 0;
  var _current_test = null;

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
    var return_dict = {};
    new_tests.forEach(function (path)
    {
      var cb = handle_new_tests.bind(null, new_tests, removed_tests, return_dict, path);
      XMLHttpRequest.get_json(TESTLISTS_PATH.replace("%s", path), cb);
    });
    if (!new_tests.length)
      handle_new_tests(new_tests, removed_tests, return_dict);
  };

  var handle_new_tests = function(new_tests, removed_tests, return_dict, path, data)
  {
    return_dict[path] = data;
    var ret_keys = Object.keys(return_dict);
    if (!new_tests.length || 
        new_tests.every(function(path) { return ret_keys.contains(path); }))
    {
      new_tests.forEach(function(path)
      {
        _test_lists_map[path] = return_dict[path];
      });
      removed_tests.forEach(function(path) { delete _test_lists_map[path]; });
      _test_list_keys = Object.keys(_test_lists_map).sort();
      _test_list = _test_list_keys.reduce(function(list, path)
      {
        return list.extend(_test_lists_map[path]);
      }, []);
      _cursor = 0;
      if (_test_list.length)
        show_test(null, null, _test_list[_cursor], expand_current_test);
    }
  }

  var show_test = function(event, target, path, cb)
  {
    var path = TEST_PATH.replace("%s", path || target.dataset.id);
    XMLHttpRequest.get_json(path, function(data)
    {
      _current_test = data;
      var container = document.querySelector(".test-description");
      container.innerHTML = "";
      set_selected_test(target);
      container.append_tmpl(templates.test_description(data, path));
      if (cb)
        cb();
    });
  };

  var set_selected_test = function(target)
  {
    var selected = document.querySelector(".sidepanel .selected");
    if (selected)
      selected.classList.remove("selected");

    if (target)
      target.classList.add("selected");
  };

  var expand_current_test = function(close_unrelated)
  {
    if (!_current_test)
      return
    
    var parts = _current_test.folder_path.split(".");
    var sidepanel = document.querySelector(".sidepanel");
    var cur = 0;
    while (cur < parts.length)
    {
      var path = parts.slice(0, ++cur).join(".");
      var h3 = sidepanel.querySelector("[data-path=\"" + path + "\"]");
      var li = h3 && h3.parentNode;
      if (!li)
        return;

      if (li.classList.contains("open"))
        continue;

      var cb = close_unrelated
             ? expand_current_close_others
             : expand_current_test;
      expand_folder(li, FOLDER_PATH.replace("%s", path), cb);
      return;
    }
    var selector = "[data-id=\"" + _current_test.id + "\"]";
    set_selected_test(sidepanel.querySelector(selector));
    if (close_unrelated)
      close_unrelated_folders();

    update_test_states();
        update_sumary();
  };

  var update_test_states = function()
  {
    FOR_EACH(document.querySelectorAll(".sidepanel .test"), function(li)
    {
      var id = li.dataset.id;
      if (id in _tests_map)
      {
        STATE_CLASSES.forEach(function(cl) { li.classList.remove(cl); });
        li.classList.add(STATE_CLASSES[_tests_map[li.dataset.id]]);
      }
    });
  };

  var update_sumary = function()
  {
    var summary = document.querySelector(".summary");
    if (summary)
    {
      var counts = [0, 0, 0, 0];
      _test_list.forEach(function(id)
      {
        if (_tests_map[id])
          counts[_tests_map[id][STATE]]++;
      });
      summary.replace_with_tmpl(templates.summary(_test_list.length,
                                                  counts[PASSED],
                                                  counts[FAILED],
                                                  counts[SKIPPED]));
    }
  };

  var expand_current_close_others = expand_current_test.bind(null, true);

  var expand_folder = function(container, path, cb)
  {
    XMLHttpRequest.get_json(path, function(data)
    {
      container.append_tmpl(templates.folder_expanded(data, _test_list_keys));
      container.classList.add("open");
      if (cb)
        cb();
      update_test_states();
    });
  };

  var close_unrelated_folders = function()
  {
    FOR_EACH(document.querySelectorAll(".sidepanel .folder-title"), function(h3)
    {
      if (!_current_test.folder_path.startswith(h3.dataset.path))
      {
        var li = h3.parentNode;
        var ul = li.querySelector("ul");
        if (ul)
        {
          li.removeChild(ul);
          li.classList.remove("open");
        }
      }
    });
  };

  var onshortcut = function(shortcut, event)
  {
    switch (shortcut)
    {
      case "up":
        select_next_test(UP);
        event.preventDefault();
        break;

      case "down":
        select_next_test(DOWN);
        event.preventDefault();
        break;

    }
  };

  var select_next_test = function(dir)
  {
    _cursor += dir;
    if (dir == UP && _cursor < 0)
      _cursor = _test_list.length ? _test_list.length - 1 : 0;

    if (dir == DOWN && _cursor > _test_list.length - 1)
      _cursor = 0;

    if (_test_list.length)
      show_test(null, null, _test_list[_cursor], expand_current_close_others);
  };

  var test_passed = function() { set_test_state(PASSED); };
  var test_failed = function() { set_test_state(FAILED); };
  var test_skipped = function() { set_test_state(SKIPPED); };
  var set_test_state = function(state)
  {
    var test = _tests_map[_current_test.id] || (_tests_map[_current_test.id] = []);
    test[STATE] = state;
    var bts_list = document.getElementById("bts");
    if (bts && bts.value)
      test[BTS_LIST] = bts_list.value.split(/, */);

    var comment = document.getElementById("comment");
    if (comment && comment.value)
      test[COMMENT] = comment.value;
    // TODO store _test_map
    select_next_test(DOWN);
  };


  var keyidentifier = null;



  var setup = function()
  {
    EventHandler.register("click", "expand-collapse", expand_collapse);
    EventHandler.register("click", "show-test", show_test);
    EventHandler.register("click", "add-remove-tests", add_remove_tests);
    EventHandler.register("click", "test-passed", test_passed);
    EventHandler.register("click", "test-failed", test_failed);
    EventHandler.register("click", "test-skipped", test_skipped);
    var browser = window.chrome ? "chrome" : window.opera ?"opera" : "firefox";
    keyidentifier = new KeyIdentifier(onshortcut, browser);
    keyidentifier.set_shortcuts(["up", "down"]);
    document.body.append_tmpl(templates.main());
    var root = document.querySelector(".sidepanel");
    try { expand_folder(root, "./folders/root.json"); }
    catch(e) 
    {
      document.body.innerHTML = ""; 
      document.body.append_tmpl(templates.no_xhr());
    };
  };

  window.onload = setup;

})();
