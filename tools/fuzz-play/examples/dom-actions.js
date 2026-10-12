// Works on most click-based pages with no game-specific code: clicks visible enabled buttons, presses keys, scrolls, resizes.
module.exports = {
  actions: [
    { name: 'clickRandomButton', weight: 6, run: (page, rnd) => page.evaluate((r) => {
        const bs = [...document.querySelectorAll('button, [role=button], a[href]')].filter(b => !b.disabled && b.offsetParent);
        if (bs.length) bs[Math.floor(r * bs.length)].click();
      }, rnd()) },
    { name: 'mashCenter', weight: 4, run: async (page, rnd) => {
        const vp = page.viewportSize();
        for (let i = 0; i < 1 + Math.floor(rnd() * 10); i++) await page.mouse.click(vp.width / 2 + (rnd() - .5) * 80, vp.height / 2 + (rnd() - .5) * 80);
      } },
    { name: 'key', weight: 1, run: (page, rnd) => page.keyboard.press(['Escape', 'Enter', 'Space', 'Tab', 'ArrowDown'][Math.floor(rnd() * 5)]) },
    { name: 'scroll', weight: 1, run: (page, rnd) => page.evaluate((y) => window.scrollTo(0, y), Math.floor(rnd() * 900)) },
    { name: 'resize', weight: 0.5, run: (page, rnd) => { const s = [[412, 800], [360, 640], [820, 1100], [1229, 662]][Math.floor(rnd() * 4)]; return page.setViewportSize({ width: s[0], height: s[1] }); } },
    { name: 'wait', weight: 3, run: (page, rnd) => page.waitForTimeout(100 + rnd() * 900) },
    { name: 'reload', weight: 0.2, run: async (page) => { await page.reload(); await page.waitForTimeout(700); } }
  ]
};
