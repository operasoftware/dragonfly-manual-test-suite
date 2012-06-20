# Opera Dragonfly Manual Test Suite

Tests are in `tests` organized per component. The component directory can have
subdirectories. Additional HTML, CSS and JS to use the suite are in `src`.
To build the test suite run:

  `$ python update.py`

This builds the testsuite in `build` in the same repo.

The test descriptions are in the README files. A README file can contain several
tests. Tests are separated by a blank lines. A line starting with '#' is a
comment and will be disregarded. A test must have a label and a description,
it can have an optional url. The label starts with 'label:' followed by the label,
on the same or on a new line. The description must describe the condition to
define if a given test fails or passes. It starts with 'desc:' followed by a
list of steps to iterate through the test. Each step can start with a '-' or a '\*'.
An example test entry:

    label: Reset color value
    url: ./index.html
    desc:
     \- Open the testcase and inspect "test".
     \- Click the color swatch of the color declaration to open the color picker.
     \- Change the current color.
     \- Verify that the color can be reset to the initial value by clicking the
        left part of the color example in the top right corner.

'url:' can be relative to the README file or absolute.
