import subprocess, re

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

inline_scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, flags=re.DOTALL)

test_bundle = """
const window = global;
window.addEventListener = () => {};
window.scrollTo = () => {};
const mockElem = {
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild: () => {},
    remove: () => {},
    innerHTML: '',
    value: '',
    setAttribute: () => {},
    getAttribute: () => '',
    addEventListener: () => {}
};
const document = {
    addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') setTimeout(fn, 10); },
    querySelectorAll: () => [],
    querySelector: () => mockElem,
    getElementById: (id) => mockElem,
    createElement: () => mockElem,
    body: { classList: { add: () => {}, remove: () => {}, contains: () => false }, appendChild: () => {}, style: {} },
    documentElement: { scrollTop: 0 }
};
const localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
const location = { reload: () => {} };
const navigator = { userAgent: 'test' };

"""

for i, s in enumerate(inline_scripts):
    test_bundle += f"\n// === Inline Script {i} ===\n" + s + "\n"

with open('config.js', 'r', encoding='utf-8', errors='ignore') as f:
    test_bundle += "\n// === config.js ===\n" + f.read() + "\n"

with open('app.js', 'r', encoding='utf-8', errors='ignore') as f:
    test_bundle += "\n// === app.js ===\n" + f.read() + "\n"

with open('test_bundle.js', 'w', encoding='utf-8') as f:
    f.write(test_bundle)

res = subprocess.run(['node', 'test_bundle.js'], capture_output=True, text=True)
print("=== Node Execution Result ===")
print("Return code:", res.returncode)
print("Stdout:", res.stdout)
print("Stderr:", res.stderr)
