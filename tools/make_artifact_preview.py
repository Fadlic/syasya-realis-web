"""Turn the Astro dist/ into a flat, relative-path copy for the artifact preview.
Usage: python3 make_preview.py <dist> <out>"""
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
    html = re.sub(r'(href|src)="/(brand|media|js)/', r'\1="\2/', html)
    html = re.sub(r'href="/#', 'href="index.html#', html)
    html = html.replace('href="/"', 'href="index.html"')
    for r, f in ROUTE.items():
        html = re.sub(rf'href="{r}/?"', f'href="{f}"', html)
        html = re.sub(rf'href="{r}/?#', f'href="{f}#', html)
    html = html.replace("<head>", "<head>" + SHIM, 1)
    return html

for name, src in PAGES.items():
    html = open(os.path.join(DIST, src), encoding="utf-8").read()
    open(os.path.join(OUT, "index.html" if name == "index" else name + ".html"), "w", encoding="utf-8").write(fix_links(html))

for f in os.listdir(os.path.join(OUT, "assets")):
    if f.endswith(".css"):
        p = os.path.join(OUT, "assets", f)
        s = open(p, encoding="utf-8").read().replace("url(/brand/", "url(../brand/")
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
