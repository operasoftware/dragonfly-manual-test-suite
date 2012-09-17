#!/usr/bin/env python

import os
import sys
import json
import shutil
import string
import time
import subprocess
import argparse
import re
import httplib
import tempfile
import zipfile
import shutil
from urllib import quote, unquote
from httplib import HTTPSConnection, HTTPConnection

BLACKLIST = [".hg"]
README = "README"
PATHKEYS = "PATHKEYS"
FOLDERS = "FOLDERS"
TESTS = "TESTS"
TESTLISTS = "TESTLISTS"
CHARS = string.ascii_letters + string.digits
TARGET = "build"
BUILT_INDEX = "/index.html"
SRC = "src"
TESTS_SRC = "tests"
DFL_REPO = "DFL"
DFL_BB_REPO = "https://bitbucket.org/scope/dragonfly-stp-1"
DFL_GITHUB_REPO = "https://github.com/operasoftware/dragonfly/zipball/%s"
PROTOCOl = 1
DOMAIN = 2
_re_protcol_domain = re.compile(r"^([^:]*)://([^/]*)")
_re_hash_label = re.compile(r"[\s,.'\"/\-]+")

def cmd_call(*args):
    return subprocess.Popen(args,
                            stdout=subprocess.PIPE,
                            stdin=subprocess.PIPE,
                            stderr=subprocess.PIPE).communicate()

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

    # setter and deleter
    # @label.setter

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

def hash_label(label):
    return _re_hash_label.sub(lambda m: "" if len(m.string) == m.end() else "-",
                              label.lower())

def parse_readme(path):
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

def get_tests(ctx, pathkeys, blacklist=[]):
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
                paths = ["/".join(path[0:i + 1]) for i in range(len(path))]
                readme_dirs |= set(paths)
            folder_path = ".".join(cur_dir.path)
            for e in entries:
                test_path = cur_dir.path + [e.label.lower().replace(" ", "_")]
                e.short_id = get_short_key(pathkeys, test_path)
                e.file_name = "%s.json" % e.short_id
                e.file_path = "./%s/%s" % (TESTS, e.file_name)
                e.folder_path = folder_path
                e.file_path = "%s.%s" % (folder_path, hash_label(e.label))
                cur_dir.labels.append(e)
                if not e.label.strip():
                    print "empty entry"
        cur_dir.dirs = dirs
        cur_dir.files = files
    ctx.readme_dirs = list(readme_dirs)
    ctx.readme_dirs.sort()

def get_id(ids):
    cursor = 0
    id = [CHARS[cursor]]
    pos = len(id) - 1
    while "".join(id) in ids:
        cursor += 1
        if cursor >= len(CHARS):
            cursor = 0
            id.append("")
            pos += 1
        id[pos] = CHARS[cursor]
    return "".join(id)

def get_short_key(pathkeys, path):
    short_path = []
    cur = pathkeys
    for p in path:
        if not p in cur:
            short = get_id([cur[k]["short"] for k in cur.keys()])
            cur[p] = {"short": short, "dirs": {}}
        short_path.append(cur[p]["short"])
        cur = cur[p]["dirs"]
    return ".".join(short_path)

def create_tests(src, target, ctx):
    tests_path = os.path.join(target, TESTS)
    if not os.path.exists(tests_path):
        os.makedirs(tests_path)
    for d in ctx.dir_map:
        dir_ = ctx.dir_map[d]
        target_path = os.path.join(target, *dir_.path)
        src_path = os.path.join(src, *dir_.path)
        if not os.path.exists(target_path):
            os.makedirs(target_path)
        for e in dir_.labels:
            with open(os.path.join(tests_path, e.file_name), "wb") as f:
                if e.url.startswith(("http", "data")):
                    web_path = e.url
                else:
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
                    web_path = "/".join(web_path)
                e_dict = {"label": e.label,
                          "url": web_path,
                          "desc": e.desc,
                          "id": e.short_id,
                          "folder_path": e.folder_path,
                          "file_path": e.file_path}
                f.write(json.dumps(e_dict, indent=4, sort_keys=True))
        for d in dir_.dirs:
            d_path = os.path.join(target_path, d)
            if not os.path.exists(d_path):
                os.mkdir(d_path)
        for f in dir_.files:
            shutil.copyfile(os.path.join(src_path, f),
                            os.path.join(target_path, f))

def create_folders(src, target, ctx):
    target_path = os.path.join(target, FOLDERS)
    if not os.path.exists(target_path):
        os.makedirs(target_path)
    with open(os.path.join(target_path, "root.json"), "wb") as f:
        dirs = []
        for d in ctx.components:
            dirs.append({"label": d, "path": d})
        f.write(json.dumps({"files": [], "dirs": dirs, "path": ""}, indent=4, sort_keys=True))
    for p in ctx.readme_dirs:
        name = "%s.json" % p.replace("/", ".")
        folder = ctx.dir_map[p]
        with open(os.path.join(target_path, name), "wb") as f:
            labels = []
            for e in folder.labels:
                labels.append({"label":e.label,
                               "id": e.short_id,
                               "file_path": e.file_path})
            dirs = []
            folder_path = "%s.%%s" % ".".join(folder.path)
            for d in folder.dirs:
                if "%s/%s" %(p, d) in ctx.readme_dirs:
                    path = folder_path % d
                    dirs.append({"label": d, "path": path})
            f_dict = {"files": labels, "path": p, "dirs": dirs}
            f.write(json.dumps(f_dict, indent=4, sort_keys=True))

def create_test_lists(src, target, ctx):
    target_path = os.path.join(target, TESTLISTS)
    if not os.path.exists(target_path):
        os.makedirs(target_path)
    for p in ctx.readme_dirs:
        ids = []
        for p2 in ctx.readme_dirs:
            if not p == p2 and p2.startswith(p):
                ids.extend(e.short_id for e in ctx.dir_map[p2].labels)
        ids.extend(e.short_id for e in ctx.dir_map[p].labels)
        name = "%s.json" % p.replace("/", ".")
        with open(os.path.join(target_path, name), "wb") as f:
            f.write(json.dumps(ids, indent=4, sort_keys=True))

def _parse_args():
    parser = argparse.ArgumentParser(description="""Script to create the manual
                                                    test suite for Opera Dragnfly""")
    parser.add_argument("tests",
                        nargs="?",
                        default=TESTS_SRC,
                        help="the directory with the tests (default: %(default)s))")
    parser.add_argument("target",
                        nargs="?",
                        default=TARGET,
                        help="target path for the test suite (default: %(default)s))")
    parser.add_argument("--dfl-repo",
                        default=DFL_GITHUB_REPO,
                        dest="dfl_repo",
                        help="the Dragonfly repo (default: %(default)s))")
    parser.add_argument("--branch",
                        default="cutting-edge",
                        dest="dfl_branch",
                        help="the branch for the Dragonfly snapshot (default: %(default)s))")
    parser.add_argument("-r", "--revision",
                        default="tip",
                        help="""the target revision of the Dragonfly src
                                directory (default: %(default)s))""")
    parser.add_argument("--skip-clone",
                        action="store_true",
                        default=False,
                        dest="skip_clone",
                        help="skip cloning the Dragonfly repo")
    return parser.parse_args()

def proto_domain_path(url):
    m = _re_protcol_domain.match(url)
    return (m.group(PROTOCOl), m.group(DOMAIN), url[len(m.group(0)):]) if m else (None, None, None)

def download_snapshot(src, target):
    print "get a Dragonfly snapshot from %s" % src
    res = None
    count = 3
    while count and (not res or res.status == 302):
        count = count - 1
        url = res.getheader("location", "") if res else src
        proto, domain, path = proto_domain_path(url)
        if not proto:
            print "abort, not a valid download URL"
            return
        con = HTTPSConnection(domain) if proto =="https" else HTTPConnection(domain)
        con.request("GET", path)
        res = con.getresponse()
    if res.status == 200:
        temp = tempfile.TemporaryFile()
        temp.write(res.read())
        print "unziping snapshot to %s" % target
        zipfile.ZipFile(temp).extractall(target)
        listdir = os.listdir(target)
        if not len(listdir) == 1:
            print "abort, something went wrong while unzipping"
            return
        snapshot = listdir[0]
        for item in os.listdir(os.path.join(target, snapshot)):
            shutil.move(os.path.join(target, snapshot, item), os.path.join(target, item))
        os.rmdir(os.path.join(target, snapshot))
    else:
        print "not able to get a snapshot"

def update():
    args = _parse_args()
    tests = args.tests
    target = args.target
    ctx = CTX(tests, target)
    temp_dir_path = ""
    dfl_repo_path = ""
    count = 5
    while (count):
        try:
            if args.skip_clone:
                for n in os.listdir(target):
                    p = os.path.join(target, n)
                    if os.path.isfile(p):
                        os.unlink(p)
                    elif os.path.isdir(p) and not n == DFL_REPO:
                        shutil.rmtree(p)
            else:
                shutil.rmtree(target)
            break
        except:
            time.sleep(0.2)
        count -= 1
    time.sleep(0.2)
    if args.skip_clone:
        if not os.path.exists(target):
            os.mkdir(target)
        for n in os.listdir(SRC):
            p = os.path.join(SRC, n)
            if os.path.isfile(p):
                shutil.copy(p, os.path.join(target, n))
            else:
                shutil.copytree(p, os.path.join(target, n))
    else:
        shutil.copytree(SRC, target)
    pathkeys = {}
    with open(PATHKEYS, "rb") as f:
        pathkeys = json.loads(f.read())
    get_tests(ctx, pathkeys, BLACKLIST)
    create_tests(tests, target, ctx)
    with open(PATHKEYS, "wb") as f:
        f.write(json.dumps(pathkeys, indent=4, sort_keys=True))
    create_folders(tests, target, ctx)
    create_test_lists(tests, target, ctx)
    dfl_snapshot_target = os.path.join(target, DFL_REPO)
    if not args.skip_clone:
        download_snapshot(args.dfl_repo % args.dfl_branch, dfl_snapshot_target)
    print "Updated " + os.path.abspath(ctx.abs_target + BUILT_INDEX)

if __name__ == "__main__":
    update()
