// ベンチマーク用のサンプル構成図を、座標を手で指定して描く。
// Kothar が文法とモデルだけから再現すべき「元の図」であり、記述量の比較の基準でもある。
// 実行: node benchmarks/sample-arch/handplaced.ts > benchmarks/sample-arch/handplaced.svg

type Box = { id: string; label: string; x: number; y: number; w: number; h: number };
type Pt = [number, number];
type EdgeStyle = "sync" | "external" | "async" | "reverse" | "telemetry";
type Edge = { style: EdgeStyle; points: Pt[]; label?: string; labelAt?: Pt };

const H = 56;

// --- ノード -----------------------------------------------------------------
// 列（x）は処理の流れ、行（y）は領域。幅はラベルの長さを見て手で決めている。
const nodes: Box[] = [
  // 本流
  { id: "user", label: "ユーザー", x: 40, y: 220, w: 120, h: H },
  { id: "cdn", label: "CDN", x: 200, y: 220, w: 120, h: H },
  { id: "apigw", label: "API Gateway", x: 370, y: 220, w: 130, h: H },
  { id: "order", label: "注文サービス", x: 570, y: 220, w: 140, h: H },
  { id: "stock", label: "在庫サービス", x: 570, y: 320, w: 140, h: H },
  { id: "orderdb", label: "注文DB", x: 790, y: 220, w: 120, h: H },
  { id: "stockdb", label: "在庫DB", x: 790, y: 320, w: 120, h: H },
  // 上段：外部サービス。呼び出す側の真上に置く
  { id: "idp", label: "IdP", x: 370, y: 50, w: 130, h: H },
  { id: "psp", label: "決済代行", x: 570, y: 50, w: 140, h: H },
  // 下段：非同期レーン
  { id: "queue", label: "イベントキュー", x: 570, y: 460, w: 140, h: H },
  { id: "worker", label: "通知ワーカー", x: 790, y: 460, w: 120, h: H },
  // 右端の列：横断的な関心事
  { id: "log", label: "ログ基盤", x: 1090, y: 180, w: 140, h: H },
  { id: "mon", label: "監視", x: 1090, y: 300, w: 140, h: H },
  { id: "kms", label: "鍵管理", x: 1090, y: 420, w: 140, h: H },
];

// --- グループ ---------------------------------------------------------------
// 枠はノードを囲むように手で余白を足している。ラベルが線と重ならない位置も手で探した。
const groups = [
  { label: "VPC", x: 350, y: 170, w: 580, h: 380, dash: "" },
  { label: "アプリ層", x: 555, y: 195, w: 170, h: 200, dash: "4 3" },
  { label: "横断的な関心事", x: 1070, y: 150, w: 180, h: 350, dash: "2 4" },
];

// --- 線 ---------------------------------------------------------------------
// ラベルの位置は、隣のノードや枠線と重ならないよう試し描きを繰り返して決めた。
// 同期は右から出て左に入る。外部は上に出て下から入る。非同期は破線で下に出て上に入る。
// 逆向きの通知は外周（図の下）を回す。横断的な関心事へはグループの右辺から出る。
const edges: Edge[] = [
  { style: "sync", points: [[160, 248], [200, 248]], label: "HTTPS", labelAt: [163, 238] },
  { style: "sync", points: [[320, 248], [370, 248]] },
  { style: "sync", points: [[500, 240], [570, 240]] },
  // 在庫サービスは一段下にあるので、アプリ層の枠の手前で折る
  { style: "sync", points: [[500, 262], [535, 262], [535, 348], [570, 348]] },
  { style: "sync", points: [[710, 248], [790, 248]] },
  { style: "sync", points: [[710, 348], [790, 348]] },
  { style: "external", points: [[435, 220], [435, 106]], label: "トークン検証", labelAt: [441, 140] },
  { style: "external", points: [[640, 220], [640, 106]], label: "決済", labelAt: [646, 140] },
  { style: "async", points: [[640, 376], [640, 460]], label: "在庫変動", labelAt: [646, 430] },
  { style: "async", points: [[710, 488], [790, 488]] },
  // 本流と逆向き。ノードを避けるため、VPC の下まで降りてから左へ戻る
  {
    style: "reverse",
    points: [[850, 516], [850, 600], [100, 600], [100, 276]],
    label: "プッシュ通知",
    labelAt: [475, 592],
  },
  { style: "telemetry", points: [[930, 208], [1090, 208]] },
  { style: "telemetry", points: [[930, 328], [1090, 328]] },
  { style: "telemetry", points: [[930, 448], [1090, 448]] },
];

const stroke: Record<EdgeStyle, { color: string; width: number; dash: string }> = {
  sync: { color: "#1f2937", width: 1.6, dash: "" },
  external: { color: "#1f2937", width: 1.6, dash: "" },
  async: { color: "#1f2937", width: 1.6, dash: "6 4" },
  reverse: { color: "#b45309", width: 1.6, dash: "2 3" },
  telemetry: { color: "#9ca3af", width: 1.2, dash: "2 3" },
};

// --- 描画 -------------------------------------------------------------------
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const out: string[] = [];
out.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" font-family="Noto Sans CJK JP, sans-serif" font-size="13">`,
  `<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`,
  `<rect width="1280" height="640" fill="#ffffff"/>`,
  // 領域の名前。上段と下段は帯として示す
  `<text x="20" y="40" fill="#6b7280" font-size="11">上段：外部サービス</text>`,
  `<text x="20" y="450" fill="#6b7280" font-size="11">下段：非同期</text>`,
);
for (const g of groups) {
  out.push(
    `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" fill="none" stroke="#6b7280" stroke-dasharray="${g.dash}"/>`,
    `<text x="${g.x + 8}" y="${g.y + 16}" fill="#374151" font-size="12">${esc(g.label)}</text>`,
  );
}
for (const n of nodes) {
  out.push(
    `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="#f9fafb" stroke="#111827"/>`,
    `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 5}" text-anchor="middle">${esc(n.label)}</text>`,
  );
}
for (const e of edges) {
  const s = stroke[e.style];
  const d = e.points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  out.push(
    `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-dasharray="${s.dash}" marker-end="url(#arrow)"/>`,
  );
  if (e.label && e.labelAt) {
    out.push(`<text x="${e.labelAt[0]}" y="${e.labelAt[1]}" fill="#374151" font-size="11">${esc(e.label)}</text>`);
  }
}
out.push(`</svg>`);
process.stdout.write(out.join("\n") + "\n");
