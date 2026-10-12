/* Node-only tests for sprite-baker, no dependencies. Run: node sprite-baker/test/run.js   (exits non-zero on any failure) */
'use strict';
var SB = require('../sprite-baker.js');

var failed = 0, passed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok   ' + name); }
  else { failed++; console.log('  FAIL ' + name + (detail ? '  (' + detail + ')' : '')); }
}

/* FNV-1a over the bytes of an RGBA image: a stable fingerprint of a render. */
function hash(img) {
  var h = 0x811c9dc5, d = img.data, i;
  for (i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return ('00000000' + h.toString(16)).slice(-8);
}
function same(a, b) { return hash(a) === hash(b); }
function coverage(data) { var n = 0, i; for (i = 3; i < data.length; i += 4) if (data[i] === 255) n++; return n; }

var RED = SB.material([[0, 200, 0, 0]]);       // one-stop ramps give a constant base color
var BLUE = SB.material([[0, 0, 0, 200]]);
var WARM = SB.material([[0, 90, 40, 20], [0.5, 220, 140, 60], [1, 255, 230, 160]]);
var COOL = SB.material([[0, 20, 40, 90], [0.5, 80, 140, 220], [1, 200, 230, 255]]);

console.log('sprite-baker tests');

/* 1. runs in Node without a canvas */
check('no canvas needed (ImageData absent in Node)', typeof ImageData === 'undefined' && typeof document === 'undefined');
var plain = new SB.Rast(2, 2).toImageData();
check('toImageData returns a plain { width, height, data } in Node', plain.width === 2 && plain.height === 2 && plain.data.length === 16);

/* 2. sphere coverage within 2% of pi r^2 */
(function () {
  var r = 40, rast = new SB.Rast(120, 120), m = SB.mesh(SB.sphere(r), 48, 96);
  SB.drawMesh(rast, m, WARM, { ox: 60, oy: 60 });
  var got = coverage(rast.px), want = Math.PI * r * r, err = Math.abs(got - want) / want;
  check('sphere r=40 coverage within 2% of pi r^2', err < 0.02, 'got ' + got + ', want ' + want.toFixed(1) + ', err ' + (err * 100).toFixed(2) + '%');
})();

/* 3. nearer triangle wins regardless of draw order */
(function () {
  function triPair(nearFirst) {
    var rast = new SB.Rast(16, 16), near = [[2, 2, 10, 0, 0, 1], [14, 2, 10, 0, 0, 1], [8, 14, 10, 0, 0, 1]], far = [[2, 14, -10, 0, 0, 1], [14, 14, -10, 0, 0, 1], [8, 1, -10, 0, 0, 1]];
    if (nearFirst) { SB.tri(rast, near[0], near[1], near[2], RED); SB.tri(rast, far[0], far[1], far[2], BLUE); }
    else { SB.tri(rast, far[0], far[1], far[2], BLUE); SB.tri(rast, near[0], near[1], near[2], RED); }
    return rast;
  }
  function px(rast, x, y) { var o = (y * rast.w + x) * 4; return [rast.px[o], rast.px[o + 1], rast.px[o + 2], rast.px[o + 3]]; }
  var a = triPair(true), b = triPair(false), pa = px(a, 8, 6), pb = px(b, 8, 6);   // (8,6) lies inside both triangles
  check('nearer (red, z=10) wins when drawn first', pa[3] === 255 && pa[0] > pa[2], JSON.stringify(pa));
  check('nearer (red, z=10) wins when drawn last', pb[3] === 255 && pb[0] > pb[2], JSON.stringify(pb));
  check('both draw orders give the identical raster', hash({ data: a.px }) === hash({ data: b.px }));
  check('far-only pixel is the far triangle (blue)', px(a, 3, 12)[2] > px(a, 3, 12)[0] && px(a, 3, 12)[3] === 255);
})();

/* 4. ramp LUT endpoints and interpolation */
(function () {
  var m = SB.material([[0, 10, 20, 30], [0.5, 100, 110, 120], [1, 250, 240, 230]]), L = m.lut;
  check('LUT has 256 RGB entries', L.length === 768);
  check('LUT[0] is the first stop', L[0] === 10 && L[1] === 20 && L[2] === 30);
  check('LUT[255] is the last stop', L[765] === 250 && L[766] === 240 && L[767] === 230);
  check('LUT midpoint is near the middle stop', Math.abs(L[128 * 3] - 100) <= 2, 'got ' + L[128 * 3]);
  var mono = true, i;
  for (i = 1; i < 256; i++) if (L[i * 3] < L[(i - 1) * 3]) mono = false;
  check('LUT red channel rises monotonically for a rising ramp', mono);
  var one = SB.material([[0.3, 5, 6, 7]]).lut;
  check('a one-stop ramp is constant', one[0] === 5 && one[765] === 5 && one[767] === 7);
})();

/* 5. rotation helpers */
(function () {
  var p = [3, -2, 5], q = SB.rotateX(p, Math.PI / 2), r = SB.rotateAxis(p, [1, 0, 0], Math.PI / 2);
  function near(a, b) { return a.every(function (v, i) { return Math.abs(v - b[i]) < 1e-9; }); }
  check('rotateX equals rotateAxis about [1,0,0]', near(q, r));
  var top = SB.rotateX([0, -1, 0], Math.PI / 2);
  check('positive rotateX turns the top (-y) toward the viewer (+z)', Math.abs(top[1]) < 1e-9 && Math.abs(top[2] - 1) < 1e-9, JSON.stringify(top));
  var about = SB.rotateX([0, 5, 0], Math.PI, 3);   // a half turn about the line y=3 sends y=5 to y=1
  check('rotateX about a center height', Math.abs(about[1] - 1) < 1e-9 && Math.abs(about[2]) < 1e-9, JSON.stringify(about));
  check('a full turn returns the point exactly', SB.rotateX(p, 2 * Math.PI).every(function (v, i) { return v === p[i]; }), JSON.stringify(SB.rotateX(p, 2 * Math.PI)));
  var six = SB.rotateAxis([0, 0, 0, 0, -1, 0], [1, 0, 0], Math.PI / 2);
  check('six-number form turns the normal too', six.length === 6 && Math.abs(six[5] - 1) < 1e-9);
})();

/* 6. finite-difference normals agree with the true sphere normals */
(function () {
  var exact = SB.mesh(SB.sphere(10), 12, 18), fn = SB.sphere(10);
  var fd = SB.mesh(function (u, v) { return fn(u, v).slice(0, 3); }, 12, 18), worst = 1, k, d;
  for (k = 0; k < exact.nrm.length; k += 3) {
    d = exact.nrm[k] * fd.nrm[k] + exact.nrm[k + 1] * fd.nrm[k + 1] + exact.nrm[k + 2] * fd.nrm[k + 2];
    if (d < worst) worst = d;
  }
  check('finite-difference normals match analytic (incl. poles and auto-orientation)', worst > 0.999, 'worst dot ' + worst.toFixed(5));
})();

/* 7. outline pass grows coverage */
(function () {
  var scene = [{ fn: SB.sphere(10), nu: 16, nv: 24, material: WARM }];
  var plainImg = SB.bakeSprite(scene, 40, { scale: 1.5 }), outlined = SB.bakeSprite(scene, 40, { scale: 1.5, outline: { radius: 2, color: [0, 0, 0] } });
  var a = 0, b = 0, i;
  for (i = 3; i < plainImg.data.length; i += 4) { a += plainImg.data[i]; b += outlined.data[i]; }
  check('outline adds opaque pixels around the shape', b > a * 1.15, 'alpha sum ' + a + ' -> ' + b);
})();

/* 8. a rolled torus: N differing frames, and a full turn loops exactly */
var ringScene = [
  { fn: SB.torus(12, 4), nu: 40, nv: 14, material: WARM },
  { fn: SB.sphere(4.5, [0, -12, 0]), nu: 10, nv: 16, material: COOL }   // a bead at the top of the ring breaks the ring's own symmetry
];
var ringOpts = { ss: 2, outline: { radius: 1, color: [30, 20, 10] } };
var frames = SB.bakeRoll(ringScene, 8, [48, 48], ringOpts);
(function () {
  check('bakeRoll returns 8 frames of the requested size', frames.length === 8 && frames.every(function (f) { return f.width === 48 && f.height === 48; }));
  var seen = {};
  frames.forEach(function (f) { seen[hash(f)] = 1; });
  check('all 8 frames differ from each other', Object.keys(seen).length === 8, Object.keys(seen).length + ' distinct');
  var full = SB.bakeSprite(ringScene, [48, 48], { ss: 2, outline: ringOpts.outline, phi: 2 * Math.PI });
  check('frame 0 equals the pose after a full turn (frame 8)', same(frames[0], full));
  var again = SB.bakeRoll(ringScene, 8, [48, 48], ringOpts);
  check('baking twice gives identical frames', frames.every(function (f, i) { return same(f, again[i]); }));
  var half = SB.bakeSprite(ringScene, [48, 48], { ss: 2, outline: ringOpts.outline, phi: Math.PI });
  check('frame 4 equals a direct half-turn render', same(frames[4], half));
})();

/* 9. light direction matters */
(function () {
  var scene = [{ fn: SB.sphere(10), nu: 16, nv: 24, material: WARM }];
  var left = SB.bakeSprite(scene, 40, { light: [-1, -0.5, 0.8] }), right = SB.bakeSprite(scene, 40, { light: [1, -0.5, 0.8] });
  function lum(img, x, y) { var o = (y * img.width + x) * 4; return img.data[o] + img.data[o + 1] + img.data[o + 2]; }
  check('light from the left lights the left side more', lum(left, 12, 20) > lum(left, 28, 20));
  check('light from the right lights the right side more', lum(right, 28, 20) > lum(right, 12, 20));
})();

/* 10. deterministic output hash. If you change the shading on purpose, update this constant. */
(function () {
  var scene = [{ fn: SB.capsule([-12, 0, 0], [12, 0, 0], 7, { lobes: 5, depth: 0.08 }), nu: 40, nv: 28, material: COOL }];
  var img = SB.bakeRoll(scene, 4, [64, 40], { ss: 2, outline: { radius: 1.5, color: [10, 10, 30] } })[1];
  var h = hash(img);
  check('pinned hash of a lobed capsule roll frame', h === 'f6b27a8b', 'hash ' + h);
  var all = SB.bakeRoll(scene, 4, [64, 40], { ss: 2 }), distinct = {};
  all.forEach(function (f) { distinct[hash(f)] = 1; });
  check('lobed capsule frames differ (the roll is visible)', Object.keys(distinct).length === 4);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
