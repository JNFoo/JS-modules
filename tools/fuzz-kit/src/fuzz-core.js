/* fuzz-core: a seeded, reproducible random-input fuzzer for stateful web pages and games. MIT License, Copyright (c) 2026 JNFoo. https://github.com/JNFoo/JS-modules */

/* A fuzzer here is: a list of weighted OPERATIONS (taps, key presses, menu clicks, "load a damaged save"...), a list of INVARIANTS
   (things that must hold after every operation) and an optional LIVENESS check (from anywhere, ordinary input must lead somewhere).
   One seed gives one exact sequence, so a failure is reproduced by running the same seed again; every failure carries the tail of
   operation names that led to it.

     var f = new Fuzzer({
       seed: 7,
       ops: [ { name: 'tap', weight: 5, run: function (c) { app.tap(c.int(360), c.int(640)); } }, ... ],   // c: see Context below
       invariants: [ function (c) { return app.score >= 0 ? '' : 'score is negative'; } ],               // '' / falsy = fine; a string or an array of strings = broken
       liveness: { every: 25, signature: function (c) { return app.state + app.score; }, nudge: function (c) { app.tap(10, 10); app.step(60); }, tries: 60 },
       state: function (c) { return app.state; },            // optional: counted per operation so you can see which parts of the app were visited
       errors: true,                                          // also fail on window 'error' and 'unhandledrejection' events
       every: [ { n: 40, run: function (c) { app.render(); } } ],   // run something every n operations (an exception becomes a failure)
       afterFail: function (c) { app.reset(); },              // put the app back in a sane place after a failure so the run can go on
       tailLength: 40, maxFails: 5
     });
     f.run(600).then(function (result) { ... });   // { seed, ops, fails: [{ i, op, what, tail }], visited: { state: count } }

   Context c (passed to everything): c.rand() uniform [0,1), c.int(n) 0..n-1, c.pick(array), c.chance(p), c.seed, c.i (operation index), c.op (current op name).
   Options for run(n, { stopAt: k }) stop after operation k (to rebuild the exact state of a failure for debugging). */

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function Fuzzer(cfg) {
  if (!(this instanceof Fuzzer)) return new Fuzzer(cfg);
  this.cfg = cfg || {};
  if (!this.cfg.ops || !this.cfg.ops.length) throw new Error('Fuzzer needs at least one operation');
}

Fuzzer.prototype.run = async function (nOps, runOpts) {
  var cfg = this.cfg, seed = cfg.seed === undefined ? 1 : cfg.seed, R = mulberry32(seed), ops = cfg.ops, total = 0, i, j;
  runOpts = runOpts || {};
  var tailLen = cfg.tailLength || 40, maxFails = cfg.maxFails || 5, fails = [], tail = [], visited = {}, winErr = [], opsDone = 0;
  ops.forEach(function (o) { total += o.weight === undefined ? 1 : o.weight; });
  var c = { seed: seed, i: 0, op: '', rand: R, int: function (n) { return Math.floor(R() * n); }, pick: function (a) { return a[Math.floor(R() * a.length)]; }, chance: function (p) { return R() < p; } };
  var onErr = null, onRej = null;
  if (cfg.errors !== false && typeof window !== 'undefined' && window.addEventListener) {
    onErr = function (e) { winErr.push('error: ' + e.message); };
    onRej = function (e) { winErr.push('rejection: ' + (e.reason && e.reason.message || e.reason)); };
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onRej);
  }
  function choose() { var r = R() * total, k; for (k = 0; k < ops.length; k++) { r -= ops[k].weight === undefined ? 1 : ops[k].weight; if (r < 0) return ops[k]; } return ops[0]; }
  function fail(what, opName) { fails.push({ i: c.i, op: opName, what: what, tail: tail.slice() }); }
  async function recover() { try { if (cfg.afterFail) await cfg.afterFail(c); } catch (e) { } }
  async function liveness() {   // from here, a handful of ordinary inputs must change the signature
    var L = cfg.liveness, before = String(L.signature(c)), k, tries = L.tries || 60;
    for (k = 0; k < tries; k++) { await L.nudge(c, k); if (String(L.signature(c)) !== before) return ''; }
    return 'no progress after ' + tries + ' ordinary inputs; stuck at ' + before;
  }
  try {
    for (i = 0; i < nOps; i++) {
      c.i = i; var op = choose(); c.op = op.name;
      tail.push(op.name); if (tail.length > tailLen) tail.shift();
      var pre = cfg.before ? cfg.before(c, op) : null;   // optional: capture something before the op (for example numbers that must only grow)
      var threw = false; try { var p = op.run(c); if (p && p.then) await p; } catch (e) { threw = true; fail('threw ' + String(e && e.stack || e).slice(0, 400), op.name); }
      opsDone++;
      if (cfg.state) { var sv = String(cfg.state(c)); visited[sv] = (visited[sv] || 0) + 1; }
      var bad = [];
      (cfg.invariants || []).forEach(function (inv) { try { var r = inv(c, pre); if (r) { if (Array.isArray(r)) bad = bad.concat(r.filter(Boolean)); else bad.push(String(r)); } } catch (e) { bad.push('invariant threw ' + String(e && e.stack || e).slice(0, 200)); } });
      if (winErr.length) bad.push('window ' + winErr.splice(0).slice(0, 3).join(' | '));
      if (bad.length) fail(bad.join('; '), op.name);
      if (bad.length || threw) { if (fails.length >= maxFails) break; await recover(); }
      if (cfg.liveness && i % (cfg.liveness.every || 25) === (cfg.liveness.every || 25) - 1) {
        var l = ''; try { l = await liveness(); } catch (e) { l = 'liveness threw ' + String(e && e.stack || e).slice(0, 200); }
        if (l) { fail(l, 'liveness'); if (fails.length >= maxFails) break; await recover(); }
      }
      (cfg.every || []).forEach(function (ev) { if (i % ev.n === ev.n - 1) { try { var q = ev.run(c); if (q && q.then) return q; } catch (e) { fail((ev.name || 'periodic') + ' threw ' + String(e && e.stack || e).slice(0, 400), ev.name || 'periodic'); } } });
      if (runOpts.stopAt !== undefined && i >= runOpts.stopAt) break;
    }
  } finally {
    if (onErr) { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej); }
  }
  return { seed: seed, ops: opsDone, fails: fails, visited: visited };
};

/* Small input helpers for DOM pages. They only build and dispatch events; nothing here knows your app. */
var FuzzInput = {
  visible: function (el) { if (!el || el.disabled) return false; for (var e = el; e && e !== document.body; e = e.parentElement) { if (e.hidden || getComputedStyle(e).display === 'none') return false; } return true; },
  clickables: function (selector, skip) {   // visible, enabled controls (default: buttons, checkboxes, radios, selects, ranges); skip(el) can exclude some (file pickers, downloads...)
    return Array.prototype.filter.call(document.querySelectorAll(selector || 'button, input[type=checkbox], input[type=radio], select, input[type=range], a[href]'), function (el) { return FuzzInput.visible(el) && !(skip && skip(el)); });
  },
  pointer: function (target, type, x, y, kind) {   // x, y in CLIENT pixels
    var ev = new PointerEvent(type, { clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerType: kind || 'touch', bubbles: true, cancelable: true, isPrimary: true, pointerId: 1 });
    (target || document.elementFromPoint(x, y) || document.body).dispatchEvent(ev); return ev;
  },
  canvasPoint: function (canvas, lx, ly, logicalW, logicalH) { var r = canvas.getBoundingClientRect(); return { x: r.left + lx / logicalW * r.width, y: r.top + ly / logicalH * r.height }; },
  key: function (k, down, repeat) { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key: k, repeat: !!repeat, bubbles: true, cancelable: true })); },
  junk: function (c) { return c.pick([0, -1, 1, 2, 9, 10, 99, 1e6, 1e9, 1e15, -5, 0.5, 1e-9, 'x', null, true, [], {}, NaN, Infinity]); }   // values to damage saved data with
};
Fuzzer.mulberry32 = mulberry32; Fuzzer.Input = FuzzInput;

if (typeof module !== 'undefined' && module.exports) module.exports = Fuzzer; else (typeof globalThis !== 'undefined' ? globalThis : this).Fuzzer = Fuzzer;
