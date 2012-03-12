import string
import os


class UUID(object):
    def __init__(self):
        self._uuids = []
        self._a_z = string.ascii_letters

    def get(self):
        ret = [""]
        pos = 0
        index = 0
        l = len(self._a_z) - 1
        while True:
            ret[pos] = self._a_z[index]
            if not "".join(ret) in self._uuids:
                break
            index += 1
            if index > l:
                index = 0
                pos += 1
                ret.append("")
        id_ = "".join(ret)
        self._uuids.append(id_)
        return id_

uuid = UUID()
HTML = """<doctype html>%s"""
SCRIPT = """<script src="%s.js"></script>
"""
scripts = []
a = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l"]
for d in a:
    if not os.path.exists(d):
        os.mkdir(d)
    for n in a:
        with open("%s.js" % os.path.join(d, n), "w") as f:
            f.write("var %s = 1;" % uuid.get())
        scripts.append(SCRIPT % "/".join([".", d, n]))

with open("lot-of-scrips.html", "w") as f:
    f.write(HTML % "".join(scripts))