import os
import sys
import json
import shutil
from urllib import quote, unquote

BLACKLIST = [".hg"]
README = "README"

class ReadmeContextError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return self.value

class CTX(object):
    def __init__(self, src, target):
        self.src = src
        self.target = target
        self.abs_src = os.path.abspath(src)
        self.abs_target = os.path.abspath(target)
        self.src_path_parts = src.split(os.path.sep)
        self.target_path_parts = target.split(os.path.sep)
        self.dir_list = []
        self.dir_map = {}
        self.components = None

class Folder(object):
    def __init__(self, path):
        self.path = path
        self.dirs = []
        self.labels = []
        self.files = []

    def __repr__(self):
        return str(self.labels) + ", " + str(self.dirs)

"""
class C(object):
    def __init__(self):
        self._x = None

    @property
    def x(self):
        "I'm the 'x' property."
        return self._x

    @x.setter
    def x(self, value):
        self._x = value

    @x.deleter
    def x(self):
        del self._x
"""

class Entry(object):
    def __init__(self):
        self.raw_title = []
        self.raw_url = []
        self.raw_desc = []
        self.raw_label = []
        self.buffer = []
        self.index = 0
        self.mode = ''
        self.tabs = ''
        self.urls = ''
        self.repo = ''
        self.index_count = 0
        self.file_name = ''
        self.deprecated = False
        self._label = None
        self._url = None
        self._desc = None

    def __repr__(self):
        return self.label + ", " + str(self.desc)

    @property
    def label(self):
        if self._label == None:
            self._label = len(self.raw_label) and self.raw_label[0].strip() or ""
        return self._label

    @property
    def url(self):
        if self._url == None:
            self._url = len(self.raw_url) and self.raw_url[0].strip() or ""
        return self._url

    @property
    def desc(self):
        if self._desc == None:
            raw_items = self.raw_desc
            string = ""
            items = []
            for item in self.raw_desc:
                if not item.strip():
                    continue
                if item.startswith('-') or item.startswith('*'):
                    if string:
                        items.append(string)
                    string = item.lstrip('-* ')
                else:
                    string += ' ' + item
            if string:
                items.append(string)
            self._desc = items
        return self._desc

def URI_to_system_path(path):
    return path_join(*[unquote(part) for part in path.split("/")])

def parse_readme(path):
    """Parse the TESTS file.

    Parse the TESTS file and return a list of Entry objects
    """
    entries = []
    entry = Entry()
    cur = entry.buffer
    counter = 1
    is_pre = False
    pre_sapces = 0
    with open(path, "rb") as in_file:
        for line in in_file.readlines():
            if "@pre" in line:
                pre_sapces = line.find("@pre")
                is_pre = True
                cur.append("@pre")
                continue
            if "@/pre" in line:
                pre_sapces = 0
                is_pre = False
                cur.append("@/pre")
                continue
            if is_pre:
                cur.append(line[pre_sapces:])
                continue
            else:
                line = line.strip()
            if line.startswith('#'):
                continue
            elif not line:
                if entry.raw_label and entry.raw_desc:
                    entries.append(entry)
                entry = Entry()
                cur = entry.buffer
            elif line.startswith('label:'):
                cur = entry.raw_label
                cur.append(line[6:])
            elif line.startswith('desc:'):
                cur = entry.raw_desc
                cur.append(line[5:])
            elif line.startswith('url:'):
                cur = entry.raw_url
                cur.append(line[4:])
            elif line.startswith('***'):
                entry.raw_title = entry.buffer
            elif line.startswith('deprecated:'):
                entry.deprecated = "true" in line.lower() and True or False
            else:
                cur.append(line)

        if entry.label:
            entries.append(entry)
    return entries

def get_tests(ctx, blacklist=[]):
    readme_dirs = set()
    for dirpath, dirs, files in os.walk(ctx.src):
        bl = [d for d in dirs if d in blacklist]
        while bl:
            dirs.pop(dirs.index(bl.pop()))
        abs_path = os.path.abspath(dirpath)
        rel_path = abs_path[len(ctx.abs_src):].lstrip(os.path.sep)
        parts = rel_path.split(os.path.sep)
        path = []
        cur_dir = None
        web_path = ""
        while len(parts):
            part = parts.pop(0)
            # if cur_dir and not part in cur_dir.dirs:
            #     cur_dir.dirs.append(part)
            path.append(part)
            web_path = "/".join(path)
            if not web_path in  ctx.dir_list:
                ctx.dir_list.append(web_path)
                ctx.dir_map[web_path] = Folder(path)
            cur_dir = ctx.dir_map[web_path]
        if ctx.abs_src == os.path.abspath(dirpath):
            ctx.components = dirs
        if not cur_dir:
            raise ReadmeContextError(dirpath)
        if README in files:
            readme_dirs | set(dirs)
            files.pop(files.index(README))
            entries = parse_readme(os.path.join(dirpath, README))
            if entries:
                readme_dirs |= set(["/".join(path[0:i + 1]) for i in range(len(path))])
            for e in entries:
                cur_dir.labels.append(e)
                if not e.label.strip():
                    print "empty entry"
        cur_dir.dirs = dirs
        cur_dir.files = files
    ctx.readme_dirs = list(readme_dirs)


ENTRY_JSON = """{
    "label": "%s",
    "url": "%s",
    "desc": %s
}"""

if __name__ == "__main__":
    argv = sys.argv
    src = "tests"
    target = "suite"
    if len(argv) > 1:
        src = argv[1]
    if len(argv) > 2:
        target = argv[2]
    ctx = CTX(src, target)
    if os.path.exists(target):
        shutil.rmtree(target)
    shutil.copytree(os.path.join("app", "."), os.path.join(target))
    get_tests(ctx, BLACKLIST)
    for d in ctx.dir_map:
        dir_ = ctx.dir_map[d]
        target_path = os.path.join(target, *dir_.path)
        src_path = os.path.join(src, *dir_.path)
        if not os.path.exists(target_path):
            os.makedirs(target_path)
        for e in dir_.labels:
            name = "%s.json" % e.label.lower().replace(" ", "_")
            with open(os.path.join(target_path, name), "wb") as f:
                try:
                    web_path = ["."] + dir_.path[:]
                    local_path = e.url.split("/")
                    for p in local_path:
                        if p == ".":
                            continue
                        if p == "..":
                            if web_path:
                                web_path.pop()
                        else:
                            web_path.append(p)
                    e_dict = {"label": e.label,
                              "url": "/".join(web_path), 
                              "desc": e.desc}
                    f.write(json.dumps(e_dict, indent=4))
                except:
                    print repr(e.desc)
        for d in dir_.dirs:
            d_path = os.path.join(target_path, d)
            if not os.path.exists(d_path):
                os.mkdir(d_path)
        for f in dir_.files:
            shutil.copyfile(os.path.join(src_path, f), os.path.join(target_path, f))

    target_path = os.path.join(target, "folders")
    if not os.path.exists(target_path):
        os.makedirs(target_path)
    with open(os.path.join(target_path, "root.json"), "wb") as f:
        try:
            dirs = []
            for d in ctx.components:
                path = "./folders/%s.json" % d
                dirs.append({"label": d, "path": path})
            f.write(json.dumps({"files": [], "dirs": dirs, "path": ""}, indent=4))
        except:
            print repr(ctx.components)
    for p in ctx.readme_dirs:
        name = "%s.json" % p.replace("/", ".")
        folder = ctx.dir_map[p]
        with open(os.path.join(target_path, name), "wb") as f:
            try:
                folder_path = "./%s/%%s.json"% "/".join(folder.path)
                labels = []
                for e in folder.labels:
                    path = folder_path % e.label.lower().replace(" ", "_")
                    labels.append({"label":e.label, "path": path})
                dirs = []
                folder_path = "./folders/%s.%%s.json" % ".".join(folder.path)
                for d in folder.dirs:
                    if "%s/%s" %(p, d) in ctx.readme_dirs:
                        path = folder_path % d
                        dirs.append({"label": d, "path": path})
                f_dict = {"files": labels, "path": p, "dirs": dirs}
                f.write(json.dumps(f_dict, indent=4))
            except Exception, msg:
                print msg
                # print repr(folder)
