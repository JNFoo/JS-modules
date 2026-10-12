"""Opens demo.html headless with Playwright for Python and fails on any console error, page error or failed request.
Run: python3 modules/frame-kit/test/check-example.py   (needs Playwright for Python with Chromium already installed; not part of `node test-all.js`)"""
import pathlib, sys
from playwright.sync_api import sync_playwright

url = (pathlib.Path(__file__).resolve().parent.parent / "demo.html").as_uri()
problems = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.on("console", lambda m: problems.append((m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: problems.append(("pageerror", str(e))))
    page.on("requestfailed", lambda r: problems.append(("requestfailed", r.url)))
    page.goto(url)
    page.wait_for_timeout(1500)
    page.click("#go")
    page.wait_for_function("document.getElementById('status').textContent.startsWith('done')", timeout=60000)
    if float(page.inner_text("#per")) <= 0:
        problems.append(("check", "EvenDt never learned a period"))
    browser.close()
print("problems:", problems)
sys.exit(1 if problems else 0)
