import os

dirs = ["breakpoints",
        "built-in-debug-mode",
        "color-inspector",
        "cookie-inspector",
        "dom-inspector",
        "dom-layout",
        "dom-search",
        "error-console",
        "general-issues",
        "js-debugger",
        "js-object-inspector",
        "js-search",
        "keyboard-input",
        "make-request",
        "network-inspector",
        "network-options",
        "profiler",
        "remote-debug-panel",
        "repl",
        "resource-inspector",
        "settings-manager",
        "storage-inspector",
        "style-inspector",
        "ui-framework",
        "utilities",
        "watches"]

for d in dirs:
  os.mkdir(d)
  f = open(os.path.join(d, "README"), "w")
  f.close()
