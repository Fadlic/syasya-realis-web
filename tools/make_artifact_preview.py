"""Turn the Astro dist/ into a flat, relative-path copy for the artifact preview.
Usage: python3 make_artifact_preview.py <dist> <out> [<admin-out>]
<admin-out>: a second, separate preview of /admin in demo mode (no Supabase config, sample data);
its views open from the URL hash (#inbox, #cal, #content, #pop, #rep, #set, #sys)."""
import os, re, shutil, sys

DIST, OUT = sys.argv[1], sys.argv[2]
shutil.rmtree(OUT, ignore_errors=True)
for d in ("_astro", "brand", "media", "js"):
    shutil.copytree(os.path.join(DIST, d), os.path.join(OUT, "assets" if d == "_astro" else d))
for f in ("config.js", "live.js"):  # live Supabase hooks are blocked in the preview frame
    os.remove(os.path.join(OUT, "js", f))

PAGES = {"index": "index.html", "about": "about/index.html", "guidelines": "guidelines/index.html", "faq": "faq/index.html"}
ROUTE = {"/about": "about.html", "/guidelines": "guidelines.html", "/faq": "faq.html"}

# storage shim: the preview frame may refuse sessionStorage/localStorage
SHIM = """<script>(function(){function mem(){var m={};return{getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}}
['sessionStorage','localStorage'].forEach(function(n){try{var s=window[n];s.setItem('__t','1');s.removeItem('__t')}catch(e){try{Object.defineProperty(window,n,{value:mem(),configurable:true})}catch(_){}}})})();</script>"""

def fix_links(html):
    html = re.sub(r'<script[^>]*src="/js/(config|live)\.js"[^>]*></script>\s*', "", html)
    html = re.sub(r'(href|src)="/_astro/', r'\1="assets/', html)
    html = html.replace("url(/_astro/", "url(assets/")   # small stylesheets Astro inlines into the page
    html = re.sub(r'(href|src)="/(brand|media|js)/', r'\1="\2/', html)
    html = re.sub(r'href="/#', 'href="index.html#', html)
    html = html.replace('href="/"', 'href="index.html"')
    for r, f in ROUTE.items():
        html = re.sub(rf'href="{r}/?"', f'href="{f}"', html)
        html = re.sub(rf'href="{r}/?#', f'href="{f}#', html)
    html = html.replace("<head>", "<head>" + SHIM, 1)
    # preview only: direct links to sub-pages from the artifact URL hash (the artifact URL always opens index.html)
    html = html.replace("<head>", r"""<head><script>(function(){var m={"#about-us":"about.html","#brand-guidelines":"guidelines.html","#faq":"faq.html","#not-found":"404.html"};if(m[location.hash]&&!/(about|guidelines|faq|404)\.html$/.test(location.pathname))location.replace(m[location.hash]);})();</script>""", 1)
    return html

PAGES["404"] = "404.html"
for name, src in PAGES.items():
    html = open(os.path.join(DIST, src), encoding="utf-8").read()
    open(os.path.join(OUT, "index.html" if name == "index" else ("404.html" if name == "404" else name + ".html")), "w", encoding="utf-8").write(fix_links(html))

for f in os.listdir(os.path.join(OUT, "assets")):
    if f.endswith(".css"):
        p = os.path.join(OUT, "assets", f)
        s = open(p, encoding="utf-8").read().replace("url(/brand/", "url(../brand/").replace("url(/_astro/", "url(./")
        open(p, "w", encoding="utf-8").write(s)

p = os.path.join(OUT, "js", "03-pages.js"); s = open(p).read()
s = s.replace('{ "#about-us": "/about", "#brand-guidelines": "/guidelines", "#faq": "/faq" }',
              '{ "#about-us": "about.html", "#brand-guidelines": "guidelines.html", "#faq": "faq.html" }')
s = s.replace('location.href = "/" + target', 'location.href = "index.html" + target').replace('location.href = "/"', 'location.href = "index.html"')
open(p, "w").write(s)
p = os.path.join(OUT, "js", "08-logo.js"); s = open(p).read().replace('location.href = "/"', 'location.href = "index.html"'); open(p, "w").write(s)

left = []
for root, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith((".html", ".js", ".css")):
            t = open(os.path.join(root, f), encoding="utf-8").read()
            left += [(f, m) for m in re.findall(r'(?:href|src)="(/[^"]*)"|url\((/[^)]*)\)|location\.\w+\s*=\s*"(/[^"]*)"', t) if any(m)]
print("absolute refs left:", left or "none")

# ---------- optional: admin board preview (demo mode) ----------
if len(sys.argv) > 3:
    AOUT = sys.argv[3]
    shutil.rmtree(AOUT, ignore_errors=True)
    shutil.copytree(os.path.join(DIST, "_astro"), os.path.join(AOUT, "assets"))
    shutil.copytree(os.path.join(DIST, "brand"), os.path.join(AOUT, "brand"))
    shutil.copytree(os.path.join(DIST, "admin"), os.path.join(AOUT, "admin"))
    os.remove(os.path.join(AOUT, "admin", "index.html"))
    html = open(os.path.join(DIST, "admin", "index.html"), encoding="utf-8").read()
    html = re.sub(r'<script[^>]*src="/js/config\.js"[^>]*></script>\s*', "", html)   # no config = demo mode
    html = re.sub(r'(href|src)="/_astro/', r'\1="assets/', html)
    html = html.replace("url(/_astro/", "url(assets/")
    html = re.sub(r'(href|src)="/(brand|admin)/', r'\1="\2/', html)
    html = html.replace("<head>", "<head>" + SHIM, 1)
    open(os.path.join(AOUT, "index.html"), "w", encoding="utf-8").write(html)
    for f in os.listdir(os.path.join(AOUT, "assets")):
        if f.endswith(".css"):
            q = os.path.join(AOUT, "assets", f)
            t = open(q, encoding="utf-8").read().replace("url(/_astro/", "url(./")
            open(q, "w", encoding="utf-8").write(t)
    print("admin preview:", AOUT)
