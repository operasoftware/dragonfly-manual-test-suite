

var get_data = function(url, cb)
{
  var xhr = new XMLHttpRequest();
  xhr.onload = function()
  {
    cb(JSON.parse(this.responseText));
  }
  xhr.open("GET", url);
  xhr.send();
};

var setup = function()
{
  document.body.append_tmpl(templates.main());
  var cb = create_panel.bind(null, document.querySelector(".sidepanel"));
  get_data("./components.json", cb);
};

var create_panel = function(container, data)
{
  container.innerHTML = "";
  container.append_tmpl(templates.components(data))
}



window.onload = setup;