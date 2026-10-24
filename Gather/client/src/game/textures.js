// ── Enhanced Godot/RPG Maker style pixel-art textures ────────
const TS = 32;

// ── Color helpers ────────────────────────────────────────────
function hexToRgb(hex) {
  if (hex.startsWith("rgb")) {
    const m = hex.match(/(\d+)/g);
    return [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])];
  }
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbStr(r, g, b) { return `rgb(${r},${g},${b})`; }
function lighten(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbStr(Math.min(255, r + a), Math.min(255, g + a), Math.min(255, b + a)); }
function darken(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbStr(Math.max(0, r - a), Math.max(0, g - a), Math.max(0, b - a)); }

// ── Drawing primitives ──────────────────────────────────────
function f(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function p(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
function box(ctx, x, y, w, h, fill, border) {
  f(ctx, x, y, w, h, border);
  if (w > 2 && h > 2) f(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}
// Checkerboard dither between two colors
function checker(ctx, x, y, w, h, c1, c2) {
  f(ctx, x, y, w, h, c1);
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++)
      if ((px + py) % 2 === 0) p(ctx, x + px, y + py, c2);
}

// ── Palette ──────────────────────────────────────────────────
const C = {
  // Carpet
  carpet1: "#5E7088", carpet2: "#546478", carpetH: "#7888A0", carpetS: "#4C5C70",
  // Wood
  wood1: "#C8986C", wood2: "#B88C5C", woodH: "#E0B488", woodS: "#987044", woodG: "#A88050",
  // Kitchen tile
  tile1: "#F0ECE0", tile2: "#E4E0D4", tileH: "#FEFCF4", tileS: "#CCC8B8",
  // Wall
  wall: "#D8D4C8", wallH: "#ECE8DC", wallS: "#B8B4A8", wallM: "#A8A494", wallL: "#989484",
  // Window
  sky1: "#68B4E8", sky2: "#98CCF0", cloud: "#E8F4FF", wfr: "#586468",
  // Glass
  glass: "#98CCE0", glassH: "#B8E4F8", glassFr: "#586870",
  // Rug
  rug: "#983838", rugB: "#B04848", rugP: "#A84040", rugC: "#782828",
  // Desk
  dk: "#B88850", dkH: "#D0A068", dkS: "#987038", dkF: "#806030", dkL: "#604820",
  // Monitor
  mon: "#282838", monS: "#3080B8", monSH: "#48A0D8",
  // Chair
  ch: "#303048", chH: "#404060", chP: "#484868", chL: "#505060",
  // Meeting table
  mt: "#A07040", mtH: "#B88858", mtS: "#805830", mtL: "#604020",
  // Plant
  pot: "#946040", potD: "#784C2C", potR: "#A87050",
  lf: "#38944C", lfD: "#287838", lfH: "#58B868", lfDD: "#1C6028",
  // Counter
  cnt: "#E8E8F0", cntS: "#B0B4BC", cntD: "#8C9098",
  // Couch
  cou: "#6050A0", couH: "#7868B8", couD: "#4C3888", couDD: "#3C2870",
  // Whiteboard
  wb: "#F4F4F0", wbF: "#707478", wbR: "#D83838", wbB: "#3850D8",
  // Door
  dr: "#C09060", drP: "#A87848", drF: "#887050", drH: "#D4B870",
  // Bookshelf
  bs: "#886844", bsH: "#A08058", bsS: "#685028",
  bR: "#C04040", bG: "#408840", bB: "#4040B8", bY: "#C0A038", bP: "#7840A0", bO: "#D07828",
  // Coffee table
  ct: "#A08060", ctH: "#B89878", ctL: "#705840",
  // Printer
  pr: "#D0D0D8", prD: "#9898A0", prS: "#383840",
  // Water cooler
  wc: "#58A0D0", wcH: "#80C0E8", wcB: "#E0E0E8", wcG: "#808088",
  // Avatar
  out: "#181824",
  sh: "rgba(0,0,0,0.18)",
};

// ══════════════════════════════════════════════════════════════
//  FLOORS
// ══════════════════════════════════════════════════════════════
function drawCarpet(ctx, v) {
  f(ctx, 0, 0, TS, TS, v ? C.carpet2 : C.carpet1);
  // Cross-weave pattern
  for (let i = 0; i < 8; i++) {
    const x = (i * 9 + v * 5) % 30, y = (i * 7 + v * 3) % 30;
    p(ctx, x, y, C.carpetH); p(ctx, x + 1, y + 1, C.carpetS);
  }
  // Weave texture - subtle grid lines
  for (let y = 0; y < TS; y += 4) {
    for (let x = (v ? 2 : 0); x < TS; x += 4) {
      p(ctx, x, y, v ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)");
      p(ctx, x + 1, y + 1, v ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)");
    }
  }
  // Subtle pile direction lines
  for (let y = 4; y < TS; y += 8) f(ctx, 0, y, TS, 1, v ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)");
}

function drawWood(ctx, v) {
  f(ctx, 0, 0, TS, TS, v ? C.wood2 : C.wood1);
  // Plank seams
  f(ctx, 0, TS - 1, TS, 1, C.woodS);
  f(ctx, v ? 16 : 0, 0, 1, TS, C.woodS);
  // Grain
  for (let i = 0; i < 5; i++) {
    const y = 3 + i * 6 + (v ? 2 : 0);
    f(ctx, 2 + (i % 3) * 4, y, 6 + (i % 2) * 4, 1, C.woodG);
  }
  f(ctx, 0, 0, TS, 1, C.woodH);
  if (!v) { p(ctx, 18, 12, C.woodS); p(ctx, 19, 12, C.woodS); p(ctx, 18, 13, C.woodS); }
}

function drawTile(ctx, v) {
  f(ctx, 0, 0, TS, TS, v ? C.tile2 : C.tile1);
  f(ctx, 0, TS - 1, TS, 1, C.tileS); f(ctx, TS - 1, 0, 1, TS, C.tileS);
  f(ctx, 0, 0, TS, 1, C.tileH); f(ctx, 0, 0, 1, TS, C.tileH);
  if (!v) { p(ctx, 6, 6, C.tileH); p(ctx, 7, 6, C.tileH); }
  else { p(ctx, 22, 20, C.tileH); p(ctx, 23, 20, C.tileH); }
}

function drawRug(ctx, v) {
  f(ctx, 0, 0, TS, TS, C.rug);
  // Ornate border
  f(ctx, 0, 0, TS, 2, C.rugB); f(ctx, 0, TS - 2, TS, 2, C.rugB);
  f(ctx, 0, 0, 2, TS, C.rugB); f(ctx, TS - 2, 0, 2, TS, C.rugB);
  // Inner border
  f(ctx, 3, 3, TS - 6, 1, C.rugC); f(ctx, 3, TS - 4, TS - 6, 1, C.rugC);
  f(ctx, 3, 3, 1, TS - 6, C.rugC); f(ctx, TS - 4, 3, 1, TS - 6, C.rugC);
  // Center motif
  if (!v) {
    // Diamond
    for (let d = 1; d <= 6; d++) {
      p(ctx, 16 - d, 16, C.rugP); p(ctx, 16 + d, 16, C.rugP);
      p(ctx, 16, 16 - d, C.rugP); p(ctx, 16, 16 + d, C.rugP);
    }
    p(ctx, 16, 16, C.rugC);
  } else {
    f(ctx, 8, 15, 16, 2, C.rugP); f(ctx, 15, 8, 2, 16, C.rugP);
  }
  // Fringe
  for (let x = 1; x < TS - 1; x += 2) { p(ctx, x, 0, C.rugB); p(ctx, x, TS - 1, C.rugB); }
}

// ══════════════════════════════════════════════════════════════
//  WALLS
// ══════════════════════════════════════════════════════════════
function drawWall(ctx) {
  f(ctx, 0, 0, TS, TS, C.wall);
  f(ctx, 0, 0, TS, 1, C.wallH);
  // Brick pattern
  for (let row = 0; row < 3; row++) {
    const y = 4 + row * 8;
    f(ctx, 0, y, TS, 1, C.wallS);
    const off = row % 2 ? 12 : 0;
    f(ctx, off, y - 7, 1, 8, C.wallS);
    f(ctx, off + 16, y - 7, 1, 8, C.wallS);
  }
  // Baseboard
  f(ctx, 0, TS - 5, TS, 5, C.wallS);
  f(ctx, 0, TS - 5, TS, 1, C.wallM);
  f(ctx, 0, TS - 4, TS, 1, C.wall);
  f(ctx, 0, TS - 1, TS, 1, C.wallL);
}

// Wall variant with clock
function drawWallClock(ctx) {
  drawWall(ctx);
  // Clock body
  ctx.fillStyle = "#F0EDE4";
  ctx.beginPath();
  ctx.arc(16, 10, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.out;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Clock face
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(16, 10, 5, 0, Math.PI * 2);
  ctx.fill();
  // Hour marks
  ctx.fillStyle = "#444";
  p(ctx, 16, 6, "#444"); p(ctx, 16, 14, "#444"); // 12, 6
  p(ctx, 20, 10, "#444"); p(ctx, 12, 10, "#444"); // 3, 9
  // Hands
  f(ctx, 16, 8, 1, 3, "#333"); // hour
  f(ctx, 16, 10, 3, 1, "#555"); // minute
  p(ctx, 16, 10, "#C04040"); // center dot
}

// Wall variant with framed poster
function drawWallPoster(ctx) {
  drawWall(ctx);
  // Frame
  box(ctx, 6, 2, 20, 18, "#F0ECD8", "#5A5040");
  // Picture content - abstract landscape
  f(ctx, 8, 4, 16, 14, "#88C4E8"); // sky
  f(ctx, 8, 12, 16, 6, "#58A858"); // ground
  f(ctx, 12, 8, 2, 6, "#6B4828"); // tree trunk
  f(ctx, 9, 5, 8, 5, "#38884C"); // tree crown
  f(ctx, 20, 6, 3, 2, "#F8F8F0"); // cloud
}

function drawWindowWall(ctx) {
  f(ctx, 0, 0, TS, TS, C.wall);
  // Window frame
  box(ctx, 2, 2, TS - 4, TS - 8, C.wfr, C.wfr);
  // Sky panes
  f(ctx, 4, 4, 11, 7, C.sky1); f(ctx, 4, 11, 11, 3, C.sky2);
  f(ctx, 17, 4, 11, 7, C.sky1); f(ctx, 17, 11, 11, 3, C.sky2);
  // Clouds
  f(ctx, 6, 6, 5, 2, C.cloud); f(ctx, 7, 5, 3, 1, C.cloud);
  f(ctx, 20, 8, 4, 2, C.cloud); f(ctx, 21, 7, 2, 1, C.cloud);
  // Frame bars
  f(ctx, 15, 2, 2, TS - 8, C.wfr);
  f(ctx, 2, 9, TS - 4, 2, C.wfr);
  // Sill
  f(ctx, 1, TS - 6, TS - 2, 2, C.wallM); f(ctx, 1, TS - 6, TS - 2, 1, C.wallH);
  // Baseboard
  f(ctx, 0, TS - 4, TS, 4, C.wallS); f(ctx, 0, TS - 1, TS, 1, C.wallL);
}

function drawGlass(ctx) {
  f(ctx, 0, 0, TS, TS, C.glassFr);
  f(ctx, 2, 2, 12, TS - 4, C.glass); f(ctx, 18, 2, 12, TS - 4, C.glass);
  f(ctx, 15, 0, 2, TS, C.glassFr);
  // Reflections
  f(ctx, 4, 4, 2, TS - 8, "rgba(255,255,255,0.2)");
  f(ctx, 20, 4, 2, TS - 8, "rgba(255,255,255,0.2)");
  f(ctx, 2, 16, 12, 1, C.glassFr); f(ctx, 18, 16, 12, 1, C.glassFr);
  f(ctx, 0, 0, TS, 1, lighten(C.glassFr, 20));
}

// ══════════════════════════════════════════════════════════════
//  FURNITURE
// ═════════���════════════════════════════════════════════════════
function drawDesk(ctx) {
  // Monitor ambient glow on desk surface
  f(ctx, 8, 4, 18, 6, "rgba(48,128,184,0.08)");
  // Shadow on floor
  f(ctx, 3, TS - 2, TS - 6, 2, C.sh);
  // Desk top
  box(ctx, 1, 4, TS - 2, TS - 8, C.dk, C.dkL);
  f(ctx, 2, 5, TS - 4, 2, C.dkH); // highlight
  f(ctx, 4, 10, 10, 1, C.dkS); f(ctx, 6, 14, 14, 1, C.dkS); // grain
  // Front face
  f(ctx, 1, TS - 4, TS - 2, 4, C.dkF);
  f(ctx, 1, TS - 4, TS - 2, 1, C.dkL); f(ctx, 1, TS - 1, TS - 2, 1, C.dkL);
  // Legs
  box(ctx, 2, TS - 7, 3, 7, C.dkL, C.out);
  box(ctx, TS - 5, TS - 7, 3, 7, C.dkL, C.out);
  // Monitor
  box(ctx, 10, 0, 14, 12, C.mon, C.out);
  f(ctx, 12, 2, 10, 8, C.monS);
  f(ctx, 13, 3, 8, 1, C.monSH); f(ctx, 13, 5, 6, 1, lighten(C.monS, 15)); f(ctx, 13, 7, 4, 1, lighten(C.monS, 15));
  // Monitor glow halo
  f(ctx, 11, 10, 12, 2, "rgba(48,128,184,0.12)");
  p(ctx, 11, 1, "#3C3C50"); // bezel highlight
  f(ctx, 15, 12, 4, 2, C.mon); f(ctx, 13, 13, 8, 1, C.mon); // stand
  // Keyboard
  box(ctx, 4, 16, 14, 5, "#3C3C48", C.out);
  for (let kx = 5; kx < 17; kx += 2) { p(ctx, kx, 17, "#555"); p(ctx, kx, 19, "#555"); }
  // Mouse
  box(ctx, 20, 17, 4, 4, "#4C4C58", C.out);
  p(ctx, 21, 18, "#666");
  // Sticky note
  f(ctx, 2, 8, 6, 5, "#FFE066"); f(ctx, 2, 8, 6, 1, "#E8C840");
  f(ctx, 3, 10, 4, 1, "#D4B030"); f(ctx, 3, 12, 3, 1, "#D4B030");
  // Coffee cup on desk
  box(ctx, 26, 15, 4, 5, "#F8F4EC", C.out);
  f(ctx, 27, 14, 2, 1, C.out); // rim
  p(ctx, 27, 16, "#C8A070");
}

function drawChair(ctx, v) {
  drawCarpet(ctx, v);
  // Chair shadow
  f(ctx, 10, TS - 3, 12, 3, C.sh);
  // Backrest
  box(ctx, 9, 4, 14, 6, C.chH, C.out);
  f(ctx, 10, 5, 12, 2, C.chP);
  // Seat
  box(ctx, 8, 9, 16, 13, C.ch, C.out);
  f(ctx, 10, 11, 12, 9, C.chP);
  f(ctx, 10, 11, 12, 2, lighten(C.chP, 10));
  // Center post
  f(ctx, 14, 22, 4, 4, C.chL);
  // Wheels
  p(ctx, 10, 26, C.out); p(ctx, 11, 26, C.out);
  p(ctx, 20, 26, C.out); p(ctx, 21, 26, C.out);
  p(ctx, 14, 28, C.out); p(ctx, 17, 28, C.out);
}

function drawMeetingTable(ctx) {
  f(ctx, 3, TS - 2, TS - 6, 2, C.sh);
  box(ctx, 1, 3, TS - 2, TS - 6, C.mt, C.mtL);
  f(ctx, 2, 4, TS - 4, 3, C.mtH);
  f(ctx, 4, 10, TS - 8, 1, C.mtS); f(ctx, 5, 16, TS - 10, 1, C.mtS); f(ctx, 3, 22, TS - 6, 1, C.mtS);
  f(ctx, 1, TS - 3, TS - 2, 3, C.mtS);
  f(ctx, 1, TS - 3, TS - 2, 1, C.mtL); f(ctx, 1, TS - 1, TS - 2, 1, C.mtL);
  box(ctx, 3, TS - 5, 3, 5, C.mtL, C.out);
  box(ctx, TS - 6, TS - 5, 3, 5, C.mtL, C.out);
}

function drawPlant(ctx, v) {
  drawCarpet(ctx, v);
  // Pot
  box(ctx, 9, 20, 14, 9, C.pot, C.out);
  f(ctx, 7, 18, 18, 3, C.potR);
  f(ctx, 7, 18, 18, 1, C.out); f(ctx, 7, 20, 18, 1, C.out);
  f(ctx, 7, 18, 1, 3, C.out); f(ctx, 24, 18, 1, 3, C.out);
  f(ctx, 10, 26, 12, 2, C.potD);
  // Stem
  f(ctx, 15, 12, 2, 7, "#2C5830");
  // Leaves layers
  f(ctx, 8, 6, 6, 8, C.lfD); f(ctx, 18, 5, 6, 7, C.lfD);
  f(ctx, 10, 3, 12, 12, C.lf);
  f(ctx, 7, 7, 5, 7, C.lf); f(ctx, 20, 6, 5, 7, C.lf);
  // Highlights
  f(ctx, 11, 4, 5, 3, C.lfH); f(ctx, 18, 7, 3, 2, C.lfH);
  p(ctx, 9, 9, C.lfH);
  // Vein details
  f(ctx, 14, 8, 1, 4, C.lfDD); f(ctx, 19, 7, 1, 3, C.lfDD);
  // Leaf edge outlines (selective)
  p(ctx, 10, 2, C.out); p(ctx, 21, 2, C.out); p(ctx, 7, 6, C.out); p(ctx, 24, 6, C.out);
}

function drawCounter(ctx) {
  // Top
  box(ctx, 0, 5, TS, 5, C.cnt, C.out);
  f(ctx, 1, 6, TS - 2, 2, "#FFF");
  // Front
  f(ctx, 0, 10, TS, TS - 10, C.cntS);
  f(ctx, 0, 10, TS, 1, C.out); f(ctx, 0, TS - 1, TS, 1, C.out);
  // Cabinet doors
  box(ctx, 2, 12, 13, 17, C.cntS, C.cntD);
  box(ctx, 17, 12, 13, 17, C.cntS, C.cntD);
  // Handles
  f(ctx, 8, 19, 1, 4, lighten(C.cnt, 10));
  f(ctx, 23, 19, 1, 4, lighten(C.cnt, 10));
  // Faucet hint
  f(ctx, 14, 6, 4, 2, C.cntD); p(ctx, 15, 5, C.cntD);
}

function drawCouch(ctx) {
  f(ctx, 3, TS - 2, TS - 6, 2, C.sh);
  // Main body
  box(ctx, 1, 6, TS - 2, TS - 8, C.cou, C.couDD);
  // Cushions
  f(ctx, 3, 10, 12, TS - 14, C.couH);
  f(ctx, 17, 10, 12, TS - 14, C.couH);
  f(ctx, 15, 10, 2, TS - 14, C.couD);
  // Backrest
  box(ctx, 1, 3, TS - 2, 8, C.couD, C.couDD);
  f(ctx, 2, 4, TS - 4, 3, C.cou);
  f(ctx, 3, 4, TS - 6, 1, C.couH);
  // Armrests
  box(ctx, 0, 5, 4, TS - 8, C.couD, C.couDD);
  box(ctx, TS - 4, 5, 4, TS - 8, C.couD, C.couDD);
  f(ctx, 1, 6, 2, 2, C.couH); f(ctx, TS - 3, 6, 2, 2, C.couH);
  // Buttons
  p(ctx, 9, 16, lighten(C.cou, 20)); p(ctx, 22, 16, lighten(C.cou, 20));
  // Legs
  p(ctx, 2, TS - 2, C.out); p(ctx, 3, TS - 2, C.out);
  p(ctx, TS - 4, TS - 2, C.out); p(ctx, TS - 3, TS - 2, C.out);
}

function drawWhiteboard(ctx) {
  drawWall(ctx);
  box(ctx, 2, 2, TS - 4, TS - 10, C.wbF, C.out);
  f(ctx, 4, 4, TS - 8, TS - 14, C.wb);
  // Content
  f(ctx, 6, 7, 12, 1, C.wbR); f(ctx, 6, 10, 8, 1, C.wbB);
  f(ctx, 8, 13, 14, 1, C.wbR); f(ctx, 6, 16, 6, 1, "#38A058");
  f(ctx, 14, 16, 4, 1, C.wbB);
  // Tray
  f(ctx, 6, TS - 8, TS - 12, 2, C.wbF);
  f(ctx, 6, TS - 8, TS - 12, 1, lighten(C.wbF, 15));
  f(ctx, 8, TS - 9, 4, 1, C.wbR); f(ctx, 14, TS - 9, 4, 1, C.wbB);
  f(ctx, 4, 4, TS - 8, 1, "#FFF");
}

function drawDoor(ctx) {
  f(ctx, 0, 0, TS, TS, C.drF);
  box(ctx, 3, 1, TS - 6, TS - 2, C.dr, darken(C.dr, 40));
  // Panels
  box(ctx, 6, 3, TS - 12, 10, C.drP, darken(C.dr, 40));
  box(ctx, 6, 16, TS - 12, 10, C.drP, darken(C.dr, 40));
  f(ctx, 7, 4, TS - 14, 1, C.dr); f(ctx, 7, 17, TS - 14, 1, C.dr);
  // Handle
  f(ctx, TS - 9, 14, 2, 4, C.drH); p(ctx, TS - 9, 15, "#FFF");
  // Frame sides
  f(ctx, 0, 0, 3, TS, C.drF); f(ctx, TS - 3, 0, 3, TS, C.drF);
  f(ctx, 0, 0, TS, 1, C.drF);
  // Light under door
  f(ctx, 6, TS - 2, TS - 12, 2, "rgba(255,255,200,0.2)");
}

function drawBookshelf(ctx) {
  box(ctx, 0, 0, TS, TS, C.bs, C.out);
  // Shelves
  f(ctx, 0, 10, TS, 2, C.bsS); f(ctx, 0, 10, TS, 1, C.bsH);
  f(ctx, 0, 22, TS, 2, C.bsS); f(ctx, 0, 22, TS, 1, C.bsH);
  // Side shadow
  f(ctx, 1, 1, 1, TS - 2, C.bsS); f(ctx, TS - 2, 1, 1, TS - 2, C.bsS);
  // Books top shelf
  box(ctx, 3, 2, 4, 8, C.bR, C.out); box(ctx, 7, 3, 3, 7, C.bG, C.out);
  box(ctx, 10, 2, 4, 8, C.bB, C.out); box(ctx, 14, 3, 3, 7, C.bY, C.out);
  box(ctx, 17, 1, 4, 9, C.bP, C.out); box(ctx, 21, 2, 4, 8, C.bO, C.out);
  f(ctx, 25, 4, 4, 6, C.bR);
  // Books bottom shelf
  box(ctx, 2, 12, 5, 10, C.bB, C.out); box(ctx, 7, 14, 4, 8, C.bY, C.out);
  box(ctx, 11, 12, 4, 10, C.bG, C.out); box(ctx, 15, 13, 4, 9, C.bO, C.out);
  box(ctx, 19, 12, 5, 10, C.bR, C.out); f(ctx, 24, 14, 4, 8, C.bP);
  // Spine details
  p(ctx, 5, 4, "#FFF"); p(ctx, 12, 4, "#FFF"); p(ctx, 4, 14, "#FFF"); p(ctx, 13, 14, "#FFF");
}

function drawCoffeeTable(ctx, v) {
  drawCarpet(ctx, v);
  f(ctx, 7, TS - 3, TS - 14, 3, C.sh);
  box(ctx, 5, 8, TS - 10, TS - 12, C.ct, C.out);
  f(ctx, 6, 9, TS - 12, 2, C.ctH);
  p(ctx, 6, TS - 4, C.ctL); p(ctx, 7, TS - 4, C.ctL);
  p(ctx, TS - 8, TS - 4, C.ctL); p(ctx, TS - 7, TS - 4, C.ctL);
  // Magazine
  f(ctx, 8, 12, 7, 5, "#E8E0D0"); f(ctx, 8, 12, 7, 1, "#D0C8B8"); f(ctx, 9, 14, 5, 1, "#A0A0A0");
  // Cup
  box(ctx, 20, 13, 5, 5, "#F8F4EC", C.out);
  p(ctx, 21, 12, C.out); p(ctx, 21, 14, "#C8A070"); p(ctx, 22, 14, "#C8A070");
}

function drawPrinter(ctx, v) {
  drawCarpet(ctx, v);
  f(ctx, 6, TS - 2, TS - 12, 2, C.sh);
  box(ctx, 4, 8, TS - 8, TS - 10, C.pr, C.out);
  f(ctx, 5, 9, TS - 10, 3, lighten(C.pr, 8));
  box(ctx, 4, 6, TS - 8, 4, lighten(C.pr, 4), C.out);
  f(ctx, 8, 7, TS - 16, 2, C.prS);
  f(ctx, 8, 18, TS - 16, 6, "#F4F0E8"); f(ctx, 8, 18, TS - 16, 1, C.out);
  f(ctx, TS - 12, 12, 6, 4, C.prD);
  p(ctx, TS - 11, 13, "#50C860"); p(ctx, TS - 9, 13, "#E04040");
  f(ctx, 4, TS - 2, TS - 8, 2, C.prD); f(ctx, 4, TS - 2, TS - 8, 1, C.out);
}

function drawWaterCooler(ctx, v) {
  drawCarpet(ctx, v);
  f(ctx, 11, TS - 2, 10, 2, C.sh);
  box(ctx, 9, 20, 14, 9, C.wcG, C.out);
  f(ctx, 10, 21, 12, 1, lighten(C.wcG, 15));
  box(ctx, 10, 10, 12, 12, C.wcB, C.out);
  f(ctx, 10, 16, 5, 4, C.wcG);
  p(ctx, 12, 17, "#D04040"); p(ctx, 12, 18, "#D04040");
  box(ctx, 12, 1, 8, 10, C.wc, C.out);
  f(ctx, 14, 2, 4, 6, C.wcH);
  f(ctx, 13, 0, 6, 2, "#E8E8EC"); f(ctx, 13, 0, 6, 1, C.out);
  p(ctx, 14, 3, lighten(C.wcH, 20));
}

// ══════════════════════════════════════════════════════════════
//  AVATARS (Chibi RPG)
// ══════════════════════════════════════════════════════════════
function drawAvatar(ctx, style, dir, ox) {
  const s = style;
  const O = C.out;

  // Shadow
  f(ctx, ox + 8, TS - 3, 16, 3, C.sh);

  // Shoes
  box(ctx, ox + 10, 25, 5, 4, s.shoes, O);
  box(ctx, ox + 17, 25, 5, 4, s.shoes, O);
  p(ctx, ox + 11, 26, lighten(s.shoes, 35));
  p(ctx, ox + 18, 26, lighten(s.shoes, 35));

  // Pants
  f(ctx, ox + 10, 20, 5, 6, s.pants); f(ctx, ox + 17, 20, 5, 6, s.pants);
  f(ctx, ox + 9, 20, 1, 6, O); f(ctx, ox + 15, 20, 1, 8, O);
  f(ctx, ox + 16, 20, 1, 8, O); f(ctx, ox + 22, 20, 1, 6, O);
  f(ctx, ox + 9, 20, 14, 1, darken(s.pants, 35)); // belt
  p(ctx, ox + 12, 23, darken(s.pants, 18)); p(ctx, ox + 19, 23, darken(s.pants, 18)); // crease

  // Shirt
  box(ctx, ox + 8, 12, 16, 9, s.shirt, O);
  f(ctx, ox + 9, 13, 14, 2, lighten(s.shirt, 22));
  f(ctx, ox + 9, 18, 14, 2, darken(s.shirt, 18));
  // Collar
  f(ctx, ox + 12, 12, 8, 2, "#F0F0F0"); f(ctx, ox + 14, 11, 4, 2, "#F0F0F0");

  // Arms
  if (dir === "left") {
    box(ctx, ox + 5, 13, 4, 8, s.shirt, O);
    f(ctx, ox + 6, 14, 2, 2, lighten(s.shirt, 18));
    f(ctx, ox + 5, 20, 4, 3, s.skin); f(ctx, ox + 5, 20, 1, 3, O); f(ctx, ox + 8, 20, 1, 3, O);
  } else if (dir === "right") {
    box(ctx, ox + 23, 13, 4, 8, s.shirt, O);
    f(ctx, ox + 24, 14, 2, 2, lighten(s.shirt, 18));
    f(ctx, ox + 23, 20, 4, 3, s.skin); f(ctx, ox + 23, 20, 1, 3, O); f(ctx, ox + 26, 20, 1, 3, O);
  } else {
    box(ctx, ox + 5, 13, 4, 7, s.shirt, O);
    box(ctx, ox + 23, 13, 4, 7, s.shirt, O);
    f(ctx, ox + 6, 14, 2, 1, lighten(s.shirt, 18));
    f(ctx, ox + 24, 14, 2, 1, lighten(s.shirt, 18));
    f(ctx, ox + 6, 19, 2, 3, s.skin); f(ctx, ox + 24, 19, 2, 3, s.skin);
  }

  // Head
  box(ctx, ox + 8, 2, 16, 11, s.skin, O);
  f(ctx, ox + 10, 4, 4, 3, lighten(s.skin, 22));

  // Hair
  if (dir === "up") {
    f(ctx, ox + 7, 0, 18, 10, s.hair);
    f(ctx, ox + 8, 0, 16, 1, O); f(ctx, ox + 7, 0, 1, 10, O); f(ctx, ox + 24, 0, 1, 10, O);
    f(ctx, ox + 10, 2, 6, 3, lighten(s.hair, 28));
    f(ctx, ox + 18, 3, 4, 2, lighten(s.hair, 18));
    p(ctx, ox + 14, 6, darken(s.hair, 18)); p(ctx, ox + 20, 5, darken(s.hair, 18));
  } else {
    f(ctx, ox + 7, 0, 18, 6, s.hair);
    f(ctx, ox + 7, 0, 1, 8, s.hair); f(ctx, ox + 24, 0, 1, 8, s.hair);
    f(ctx, ox + 8, 0, 16, 1, O); f(ctx, ox + 7, 0, 1, 8, O); f(ctx, ox + 24, 0, 1, 8, O);
    f(ctx, ox + 8, 5, 4, 2, s.hair); f(ctx, ox + 20, 5, 4, 2, s.hair);
    f(ctx, ox + 10, 1, 5, 2, lighten(s.hair, 32));
    f(ctx, ox + 18, 2, 4, 1, lighten(s.hair, 22));
    p(ctx, ox + 12, 4, darken(s.hair, 18));
  }

  // Face
  if (dir !== "up") {
    const eyeW = "#FFFFFF", iris = "#3355AA", pupil = "#1A1A2E", blush = "#FFB0B0";
    if (dir === "left") {
      f(ctx, ox + 10, 6, 4, 4, eyeW);
      f(ctx, ox + 11, 7, 2, 2, pupil); p(ctx, ox + 11, 7, iris); p(ctx, ox + 12, 6, eyeW);
      p(ctx, ox + 9, 10, blush);
      p(ctx, ox + 11, 11, pupil); p(ctx, ox + 12, 11, pupil);
    } else if (dir === "right") {
      f(ctx, ox + 18, 6, 4, 4, eyeW);
      f(ctx, ox + 19, 7, 2, 2, pupil); p(ctx, ox + 20, 7, iris); p(ctx, ox + 20, 6, eyeW);
      p(ctx, ox + 22, 10, blush);
      p(ctx, ox + 19, 11, pupil); p(ctx, ox + 20, 11, pupil);
    } else {
      // Left eye
      f(ctx, ox + 10, 6, 4, 4, eyeW);
      f(ctx, ox + 11, 7, 2, 2, pupil); p(ctx, ox + 11, 7, iris); p(ctx, ox + 12, 6, eyeW);
      // Right eye
      f(ctx, ox + 18, 6, 4, 4, eyeW);
      f(ctx, ox + 19, 7, 2, 2, pupil); p(ctx, ox + 19, 7, iris); p(ctx, ox + 20, 6, eyeW);
      // Blush & mouth
      p(ctx, ox + 9, 10, blush); p(ctx, ox + 22, 10, blush);
      p(ctx, ox + 15, 11, pupil); p(ctx, ox + 16, 11, pupil);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════════
export function generateTextures(scene) {
  const tiles = [
    ["tile_carpet_0", ctx => drawCarpet(ctx, 0)],
    ["tile_carpet_1", ctx => drawCarpet(ctx, 1)],
    ["tile_wall", drawWall],
    ["tile_wall_clock", drawWallClock],
    ["tile_wall_poster", drawWallPoster],
    ["tile_desk", drawDesk],
    ["tile_chair_0", ctx => drawChair(ctx, 0)],
    ["tile_chair_1", ctx => drawChair(ctx, 1)],
    ["tile_meeting_table", drawMeetingTable],
    ["tile_plant_0", ctx => drawPlant(ctx, 0)],
    ["tile_plant_1", ctx => drawPlant(ctx, 1)],
    ["tile_counter", drawCounter],
    ["tile_couch", drawCouch],
    ["tile_whiteboard", drawWhiteboard],
    ["tile_door", drawDoor],
    ["tile_wood_0", ctx => drawWood(ctx, 0)],
    ["tile_wood_1", ctx => drawWood(ctx, 1)],
    ["tile_kitchen_0", ctx => drawTile(ctx, 0)],
    ["tile_kitchen_1", ctx => drawTile(ctx, 1)],
    ["tile_bookshelf", drawBookshelf],
    ["tile_coffee_table_0", ctx => drawCoffeeTable(ctx, 0)],
    ["tile_coffee_table_1", ctx => drawCoffeeTable(ctx, 1)],
    ["tile_printer_0", ctx => drawPrinter(ctx, 0)],
    ["tile_printer_1", ctx => drawPrinter(ctx, 1)],
    ["tile_water_cooler_0", ctx => drawWaterCooler(ctx, 0)],
    ["tile_water_cooler_1", ctx => drawWaterCooler(ctx, 1)],
    ["tile_rug_0", ctx => drawRug(ctx, 0)],
    ["tile_rug_1", ctx => drawRug(ctx, 1)],
    ["tile_window_wall", drawWindowWall],
    ["tile_glass_wall", drawGlass],
  ];

  tiles.forEach(([key, draw]) => {
    if (scene.textures.exists(key)) return;
    const c = document.createElement("canvas");
    c.width = TS; c.height = TS;
    draw(c.getContext("2d"));
    scene.textures.addCanvas(key, c);
  });
}

export function getTileKey(tile, x, y) {
  const v = (x + y) % 2;
  switch (tile) {
    case 0: return `tile_carpet_${v}`;
    case 1: {
      // Some wall tiles get decorations based on position
      const hash = (x * 7 + y * 13) % 17;
      if (hash === 3) return "tile_wall_clock";
      if (hash === 9) return "tile_wall_poster";
      return "tile_wall";
    }
    case 2: return "tile_desk";
    case 3: return `tile_chair_${v}`;
    case 4: return "tile_meeting_table";
    case 5: return `tile_plant_${v}`;
    case 6: return "tile_counter";
    case 7: return "tile_couch";
    case 8: return "tile_whiteboard";
    case 9: return "tile_door";
    case 10: return `tile_wood_${v}`;
    case 11: return `tile_kitchen_${v}`;
    case 12: return "tile_bookshelf";
    case 13: return `tile_coffee_table_${v}`;
    case 14: return `tile_printer_${v}`;
    case 15: return `tile_water_cooler_${v}`;
    case 16: return `tile_rug_${v}`;
    case 17: return "tile_window_wall";
    case 18: return "tile_glass_wall";
    default: return `tile_carpet_${v}`;
  }
}

export function generateAvatarTexture(scene, id, style) {
  const key = `avatar_${id}`;
  if (scene.textures.exists(key)) return;
  const c = document.createElement("canvas");
  c.width = TS * 4; c.height = TS;
  const ctx = c.getContext("2d");
  ["down", "left", "right", "up"].forEach((dir, i) => drawAvatar(ctx, style, dir, i * TS));
  const tex = scene.textures.addCanvas(key, c);
  if (tex) for (let i = 0; i < 4; i++) tex.add(i, 0, i * TS, 0, TS, TS);
}
