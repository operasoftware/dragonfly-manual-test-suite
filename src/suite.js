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

  var _test_path_map = Object.create(null);
  var _test_path_list = [];
  var _test_id_list = [];
  var _test_id_map = Object.create(null);
  var _cursor = 0;
  var _current_test = null;
  var _keyidentifier = null;
  var _options = {};
  var _is_frozen = false;
  var _resize_panel_handler = null;
  var _styles =
  {
    sidepanel: null,
    test_description: null,
    test_controls: null,
    sidepanel_resize: null,
    h1: null,
  };

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
      if (_options.test_run && !_options.test_run.contains(path))
        continue;

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
          removed_tests.extend(parent_children_boxes.map(function(box) 
          {
            return box.parentNode.dataset.path;
          }));
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
        _test_path_map[path] = return_dict[path];
      });
      removed_tests.forEach(function(path) { delete _test_path_map[path]; });
      update_test_list();
      _cursor = 0;
      if (_test_id_list.length)
        show_test(null, null, _test_id_list[_cursor], expand_current_test);
    }
  };

  var update_test_list = function()
  {
    _test_path_list = Object.keys(_test_path_map).sort();
    _test_id_list = _test_path_list.reduce(function(list, path)
    {
      return list.extend(_test_path_map[path]);
    }, []);
  };

  var show_test = function(event, target, path, cb)
  {
    if (target && _test_id_list.indexOf(target.dataset.id) > -1)
      _cursor = _test_id_list.indexOf(target.dataset.id);

    var path = TEST_PATH.replace("%s", path || target.dataset.id);
    XMLHttpRequest.get_json(path, function(data)
    {
      _current_test = data;
      var container = document.querySelector(".test-description");
      container.innerHTML = "";
      set_selected_test(target);
      container.append_tmpl(templates.test_description(data, path));
      var cur_state = _test_id_map[_current_test.id];
      var bts_list = document.getElementById("bts");
      if (bts)
        bts_list.value = cur_state && cur_state[BTS_LIST] || "";

      var comment = document.getElementById("comment");
      if (comment)
        comment.value = cur_state && cur_state[COMMENT] || "";

      try { window.open(data.url, "dflmts-window"); } catch(e) {};
      if (cb)
        cb();

      location.hash = data.folder_path + "." + hash_label(data.label);
    });
  };

  var hash_label = function(label)
  {
    return label.toLowerCase().replace(/[\s,.]+/g, "-");
  };

  var set_selected_test = function(target)
  {
    var selected = document.querySelector(".sidepanel .selected");
    if (selected)
      selected.classList.remove("selected");

    if (target)
    {
      target.classList.add("selected");
      var sidepanel = document.querySelector(".sidepanel");
      if (sidepanel)
      {
        var box_s = sidepanel.getBoundingClientRect();
        var box_t = target.getBoundingClientRect();
        if (box_t.bottom < box_s.top || box_t.top > box_s.bottom)
          target.scrollIntoView();
      } 
    }
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
      if (id in _test_id_map)
      {
        STATE_CLASSES.forEach(function(cl) { li.classList.remove(cl); });
        li.classList.add(STATE_CLASSES[_test_id_map[li.dataset.id][STATE]]);
      }
    });
  };

  var update_sumary = function()
  {
    var summary = document.querySelector(".summary");
    if (summary)
    {
      var counts = [_test_id_list.length, 0, 0, 0];
      _test_id_list.forEach(function(id)
      {
        if (_test_id_map[id])
          counts[_test_id_map[id][STATE]]++;
      });
      summary.replace_with_tmpl(templates.summary.apply(null, counts));
    }
  };

  var expand_current_close_others = expand_current_test.bind(null, true);

  var expand_folder = function(container, path, cb)
  {
    XMLHttpRequest.get_json(path, function(data)
    {
      if (!container.classList.contains("open"))
      {
        container.append_tmpl(templates.folder_expanded(data, _test_path_list));
        container.classList.add("open");
        if (_is_frozen)
          hide_components(container.querySelectorAll("h3"));

        if (_options.test_run && _options.test_run.length)
          configure_test_run();

        if (cb)
          cb();

        update_test_states();
      }
    });
  };

  var hide_components = function(h3s)
  {
    FOR_EACH(h3s, function(h3)
    {
      var comp = h3.dataset.path;
      if (comp)
      {
        var overlap = function(path)
        {
          return comp.startswith(path) || path.startswith(comp);
        };

        if (!_test_path_list.some(overlap))
          h3.parentNode.classList.add("hidden");
      }
      else
      {
        var ul = h3.get_ancestor("ul");
        var li = ul && ul.get_ancestor("li");
        var input = li && li.querySelector("input[type=\"checkbox\"]");
        if (input && !input.checked)
          h3.parentNode.classList.add("hidden");
      }
    })    
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
      _cursor = _test_id_list.length ? _test_id_list.length - 1 : 0;

    if (dir == DOWN && _cursor > _test_id_list.length - 1)
      _cursor = 0;

    if (_test_id_list.length)
      show_test(null, null, _test_id_list[_cursor], expand_current_close_others);
  };

  var test_passed = function() { set_test_state(PASSED); };
  var test_failed = function() { set_test_state(FAILED); };
  var test_skipped = function() { set_test_state(SKIPPED); };
  var set_test_state = function(state)
  {
    var test = _test_id_map[_current_test.id] || (_test_id_map[_current_test.id] = []);
    test[STATE] = state;
    var bts_list = document.getElementById("bts");
    if (bts && bts.value)
    {
      test[BTS_LIST] = bts_list.value.split(/, */);
      bts_list.value = "";
    }

    var comment = document.getElementById("comment");
    if (comment && comment.value)
    {
      test[COMMENT] = comment.value;
      comment.value = "";
    }
    
    localStorage.setItem("dflmts.cursor", String(_cursor));
    localStorage.setItem("dflmts.test_path_map", JSON.stringify(_test_path_map));
    localStorage.setItem("dflmts.test_map", JSON.stringify(_test_id_map));
    select_next_test(DOWN);
  };

  var export_state = function()
  {
    window.open("data:text/plain," + encodeURIComponent(JSON.stringify(_test_id_map)));
  };

  var clear_state = function()
  {
    localStorage.removeItem("dflmts.cursor");
    localStorage.removeItem("dflmts.test_path_map");
    localStorage.removeItem("dflmts.test_map");
    _test_path_map = Object.create(null);
    _test_path_list = [];
    _test_id_list = [];
    _test_id_map = Object.create(null);
    _cursor = 0;
    _current_test = null;
    show_initial_view();
  };

  var configure_test_run = function()
  {
    _options.test_run.forEach(function(component)
    {
      var parts = component.split(".");
      var comp = "";
      for (var i = 0, part; part = parts[i]; i++)
      {
        comp += (comp ? "." : "") + part;
        var h3 = document.querySelector("[data-path=\"" + comp + "\"]");
        if (h3)
        {
          if (i == parts.length - 1)
          {
            var checkbox = h3.querySelector("[data-handler=\"add-remove-tests\"]");
            if (!checkbox.checked)
              // add-remove-tests
              checkbox.dispatchMouseEvent("click");
          }
          else
          {
            if (!h3.parentNode.classList.contains("open"))
              // expand-collapse
              h3.dispatchMouseEvent("click");
          }
        }
      };
    });

    _test_path_list.forEach(function(comp)
    {
      var i = _options.test_run.indexOf(comp);
      if (i > -1)
        _options.test_run.splice(i, 1);
    });
    
    if (!_options.test_run.length)
    {
      freeze_configuration();
      setTimeout(close_unrelated_folders, 0);
    }
  };

  var freeze_configuration = function()
  {
    var button = document.querySelector("[data-handler=\"freeze-configuration\"]");
    if (_is_frozen)
    {
      _is_frozen = false;
      button.value = "Freeze configuration";
      document.body.classList.remove("frozen");
    }
    else
    {
      _is_frozen = true;
      button.value = "Unfreeze configuration";
      document.body.classList.add("frozen");
      hide_components(document.querySelectorAll(".sidepanel h3"));
    }
  };

  var show_initial_view = function()
  {
    document.body.innerHTML = "";
    document.body.append_tmpl(templates.main());
    var root = document.querySelector(".sidepanel");
    try
    {
      expand_folder(root, FOLDER_PATH.replace("%s", "root"), function()
      {
        if (_options.test_run && _options.test_run.length)
          configure_test_run();
        else if (_test_id_list.length)
          show_test(null, null, _test_id_list[_cursor], expand_current_test);
      });
    }
    catch(e) 
    {
      document.body.innerHTML = ""; 
      document.body.append_tmpl(templates.no_xhr());
    };
  };

  var expand_test = function(path_parts, hashed_label)
  {
    var sidepanel = document.querySelector(".sidepanel");
    var cur = 0;
    while (cur < path_parts.length)
    {
      var path = path_parts.slice(0, ++cur).join(".");
      var h3 = sidepanel.querySelector("[data-path=\"" + path + "\"]");
      var li = h3 && h3.parentNode;
      if (!li)
        return;

      if (li.classList.contains("open"))
        continue;

      var cb = expand_test.bind(null, path_parts, hashed_label);
      expand_folder(li, FOLDER_PATH.replace("%s", path), cb);
      return;
    }
    FOR_EACH(li.querySelectorAll("h3"), function(h3)
    {
      if (hash_label(h3.textContent) == hashed_label)
        h3.parentNode.dispatchMouseEvent("click");
    });
  };

  var onhashchange = function(event)
  {
    var hash = location.hash.slice(1);
    var cur_path = _current_test
                 ? _current_test.folder_path + "." + hash_label(_current_test.label)
                 : "";
    if (hash != cur_path)
    {
      var path = hash.split(".");
      if (path.length)
      {
        var hashed_label = path.pop();
        expand_test(path, hashed_label);
      }
    }
  };

  var parse_query = function()
  {
    var options = {};
    window.location.search.slice(1).split("&").forEach(function(item)
    {
      var pos = item.indexOf("=");
      if (pos > -1)
        options[item.slice(0, pos).replace(/-/g, "_").trim()] = item.slice(pos + 1).trim();  
    });

    if (options.test_run)
      options.test_run = options.test_run.split(",").map(function(item) { return item.trim(); });

    return options;

  };



  var resize_panel = function(event, target)
  {
    var delta = event.clientX - target.getBoundingClientRect().left;
    _resize_panel_handler = resize_panel_move.bind(null, delta);
    document.addEventListener("mousemove", _resize_panel_handler, false);
    document.addEventListener("mouseup", resize_panel_up, false);
  };

  var set_panel_width = function(width)
  {
    if (!_styles.sidepanle)
    {
      _styles.sidepanle = document.styleSheets.get_declaration(".sidepanel"); 
      _styles.test_description = document.styleSheets.get_declaration(".test-description"); 
      _styles.test_controls = document.styleSheets.get_declaration(".test-controls"); 
      _styles.sidepanel_resize = document.styleSheets.get_declaration(".sidepanel-resize"); 
      _styles.h1 = document.styleSheets.get_declaration("h1"); 
    }
    _styles.sidepanle.width = width + "px";
    _styles.test_description.left = width + "px";
    _styles.test_controls.left = width + "px";
    _styles.sidepanel_resize.left = (width - 2) + "px";
    _styles.h1.marginLeft = width + "px";
    localStorage.setItem("dflmts.panel_width", JSON.stringify(width));
  };

  var resize_panel_move = function(delta, event)
  {
    set_panel_width(parseInt(event.clientX) - delta);
  };

  var resize_panel_up = function(event)
  {
    document.removeEventListener("mousemove", _resize_panel_handler, false);
    document.removeEventListener("mouseup", resize_panel_up, false);
  };

  var setup = function()
  {
    _options = parse_query();
    var cursor = localStorage.getItem("dflmts.cursor");
    if (cursor)
      _cursor = Number(cursor);

    var path_map = JSON.parse(localStorage.getItem("dflmts.test_path_map"));
    if (path_map)
    {
      _test_path_map = path_map;
      update_test_list();
    }

    var test_map = JSON.parse(localStorage.getItem("dflmts.test_map"));
    if (test_map)
      _test_id_map = test_map;

    EventHandler.register("click", "expand-collapse", expand_collapse);
    EventHandler.register("click", "show-test", show_test);
    EventHandler.register("click", "add-remove-tests", add_remove_tests);
    EventHandler.register("click", "test-passed", test_passed);
    EventHandler.register("click", "test-failed", test_failed);
    EventHandler.register("click", "test-skipped", test_skipped);
    EventHandler.register("click", "export-state", export_state);
    EventHandler.register("click", "clear-state", clear_state);
    EventHandler.register("click", "freeze-configuration", freeze_configuration);
    EventHandler.register("mousedown", "resize-panel", resize_panel);
    var browser = window.chrome ? "chrome" : window.opera ?"opera" : "firefox";
    _keyidentifier = new KeyIdentifier(onshortcut, browser);
    _keyidentifier.set_shortcuts(["up", "down"]);
    window.onhashchange = onhashchange;
    show_initial_view();
    var panel_width = localStorage.getItem("dflmts.panel_width");
    if (panel_width)
      set_panel_width(JSON.parse(panel_width));
  };

  window.onload = setup;

})();
