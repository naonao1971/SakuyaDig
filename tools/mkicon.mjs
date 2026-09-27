// 咲耶ディグのアイコン（apple-touch-icon 180 / icon-192 / icon-512 / favicon-32）を作る。
//
//   PWPATH=$(npm root -g)/playwright node tools/mkicon.mjs
//
// 咲耶スクランブル（ピンクの三角形）・ジャンプバグ（跳ねる⌐◨-◨カー）と同じ作りのシンプルなアイコンにする。
//   - 暗い四角 + 金の枠
//   - 中身は1つのシルエットを、マゼンタで塗りつぶし・金で縁取り・マゼンタの淡い光
// 使う色はシリーズのアイコンと同じ3色（地・金・マゼンタ）だけ。形は「ツルハシ」（⛏ のように右上に頭、左下へ柄）。
// 形は 180px 基準の座標で書き、どの大きさも同じ形を縮めて作る。Playwright（Chromium の canvas）で描く。
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PWPATH || "playwright");

function draw(size) {
  const BG = "#06070C", GOLD = "#E8C56A", FILL = "#FF2D9B";
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const u = size / 180;
  g.fillStyle = BG;
  g.fillRect(0, 0, size, size);
  g.scale(u, u);

  // ツルハシ（柄を下に向けた局所座標で作り、45°傾けて置く）
  const p = new Path2D();
  p.moveTo(-70, 18); p.quadraticCurveTo(0, -74, 70, 18); p.quadraticCurveTo(0, -14, -70, 18); p.closePath(); // 頭（三日月・先はとがる）
  p.rect(-15, -40, 30, 30); // 柄をはめる金具
  p.moveTo(-10, -14); p.lineTo(10, -14); p.lineTo(10, 76); p.quadraticCurveTo(0, 86, -10, 76); p.closePath(); // 柄
  const shape = new Path2D();
  shape.addPath(p, new DOMMatrix().translate(90, 88).rotate(45).scale(1.06));

  // マゼンタの淡い光 → 金の縁取り（180px 基準で約3px）→ マゼンタの塗り
  g.save();
  g.shadowColor = "rgba(255,45,155,0.6)";
  g.shadowBlur = 18 * u;
  g.fillStyle = "rgba(255,45,155,0.45)";
  g.fill(shape);
  g.restore();
  g.lineJoin = "round";
  g.strokeStyle = GOLD;
  g.lineWidth = 6;
  g.stroke(shape);
  g.fillStyle = FILL;
  g.fill(shape);

  // 金の枠（180px で 7px。32px でも最低 1px）
  g.setTransform(1, 0, 0, 1, 0, 0);
  const f = Math.max(1, Math.round(7 * u));
  g.strokeStyle = GOLD;
  g.lineWidth = f;
  g.strokeRect(f / 2, f / 2, size - f, size - f);
  return c.toDataURL("image/png");
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512], ["favicon-32.png", 32]]) {
  const url = await page.evaluate(draw, size);
  fs.writeFileSync(path.join(ROOT, file), Buffer.from(url.split(",")[1], "base64"));
  console.log("wrote", file, size);
}
await browser.close();
