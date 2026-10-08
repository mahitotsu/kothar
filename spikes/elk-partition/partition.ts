// 検証 0006：ELK の layered のパーティションで、入れ子のグループがあっても、ノードを列に並べられるかを確かめる。
// 実行: node spikes/elk-partition/partition.ts
// 題材は X08（信頼境界の図）。X01 のモデルから、横断的な関心事と uses の線を除き、ノードを3つの列に割り当てる。

import ElkModule from "elkjs/lib/elk.bundled.js";
import { createHash } from "node:crypto";

const ELK = ElkModule as unknown as typeof ElkModule.default;

type Opt = { partitionGroups: boolean; partitionMembers: boolean; note: string };
// A：ルートの直下のノードとグループにだけパーティションを付ける
// B：A に加えて、グループの中のノードにも、グループと同じパーティションを付ける
const variants: Record<string, Opt> = {
  A: { partitionGroups: true, partitionMembers: false, note: "ルートの直下にだけ付ける" },
  B: { partitionGroups: true, partitionMembers: true, note: "グループの中にも付ける" },
};

const column: Record<string, number> = { user: 0, cdn: 0, vpc: 1, idp: 2, psp: 2 };
const label: Record<string, string> = {
  user: "ユーザー", cdn: "CDN", apigw: "API Gateway", order: "注文サービス", stock: "在庫サービス",
  orderdb: "注文DB", stockdb: "在庫DB", queue: "イベントキュー", worker: "通知ワーカー", idp: "IdP", psp: "決済代行",
};
const groups: Record<string, string[]> = { vpc: ["apigw", "orderdb", "stockdb", "queue", "worker", "app"], app: ["order", "stock"] };
// [出る, 入る, 出る辺, 入る辺, 逆向きか]
const edges: [string, string, string, string, boolean][] = [
  ["user", "cdn", "EAST", "WEST", false],
  ["cdn", "apigw", "EAST", "WEST", false],
  ["apigw", "order", "EAST", "WEST", false],
  ["apigw", "stock", "EAST", "WEST", false],
  ["order", "orderdb", "EAST", "WEST", false],
  ["stock", "stockdb", "EAST", "WEST", false],
  ["apigw", "idp", "EAST", "WEST", false],
  ["order", "psp", "EAST", "WEST", false],
  ["stock", "queue", "SOUTH", "NORTH", false],
  ["queue", "worker", "EAST", "WEST", false],
  ["worker", "user", "SOUTH", "SOUTH", true],
];

async function run(opt: Opt) {
  const nodes = new Map<string, any>();
  for (const id of Object.keys(label))
    nodes.set(id, { id, width: 130, height: 56, layoutOptions: { "elk.portConstraints": "FIXED_SIDE" }, ports: [] });
  for (const id of Object.keys(groups))
    nodes.set(id, { id, layoutOptions: { "elk.portConstraints": "FIXED_SIDE", "elk.padding": "[top=32,left=16,bottom=16,right=16]", "elk.spacing.nodeNode": "40" }, ports: [], children: [] });
  const parent = new Map<string, string>();
  for (const [g, ms] of Object.entries(groups)) for (const m of ms) parent.set(m, g);
  const rootOf = (id: string): string => (parent.has(id) ? rootOf(parent.get(id)!) : id);
  const roots: any[] = [];
  for (const [id, n] of nodes) {
    const p = parent.get(id);
    (p ? nodes.get(p).children : roots).push(n);
    const part = column[rootOf(id)];
    if (part !== undefined && (!p ? opt.partitionGroups : opt.partitionMembers)) n.layoutOptions["elk.partitioning.partition"] = String(part);
  }
  const elkEdges = edges.map(([s, t, ss, ts, rev], k) => {
    const sp = { id: `e${k}.s`, layoutOptions: { "elk.port.side": ss } };
    const tp = { id: `e${k}.t`, layoutOptions: { "elk.port.side": ts } };
    nodes.get(s).ports.push(sp);
    nodes.get(t).ports.push(tp);
    return { id: `e${k}`, sources: [rev ? tp.id : sp.id], targets: [rev ? sp.id : tp.id] };
  });
  const laid = await new ELK().layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.json.shapeCoords": "ROOT",
      "elk.json.edgeCoords": "ROOT",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.separateConnectedComponents": "false",
      "elk.partitioning.activate": "true",
    },
    children: roots,
    edges: elkEdges,
  } as any);
  const rect = new Map<string, any>();
  const visit = (n: any) => {
    rect.set(n.id, { x: n.x, y: n.y, w: n.width, h: n.height });
    (n.children ?? []).forEach(visit);
  };
  (laid.children ?? []).forEach(visit);
  // $H は ELK の中のオブジェクトの番号で、実行のたびに変わるので比べない
  return { rect, json: JSON.stringify(laid, (k, v) => (k === "$H" ? undefined : v)) };
}

console.log("| 案 | 内容 | 列の順の違反 | グループの外にはみ出したメンバー | 2回実行 | 配置の結果の SHA-256（先頭12桁） |");
console.log("| --- | --- | --- | --- | --- | --- |");
for (const [name, opt] of Object.entries(variants)) {
  let a, b;
  try {
    [a, b] = [await run(opt), await run(opt)];
  } catch (err) {
    console.log(`| ${name} | ${opt.note} | 失敗：${String((err as Error).message ?? err).split("\n")[0]} | | |`);
    continue;
  }
  const { rect } = a;
  // 列の順：ある列のノードの中心が、それより左の列のどのノードの中心よりも右にあるか（グループの中のノードはグループの列）
  const rootOf = (id: string): string => {
    for (const [g, ms] of Object.entries(groups)) if (ms.includes(id)) return rootOf(g);
    return id;
  };
  const cx = (id: string) => rect.get(id).x + rect.get(id).w / 2;
  const ids = Object.keys(label);
  const order: string[] = [];
  for (const p of ids) for (const q of ids) if (column[rootOf(p)] < column[rootOf(q)] && cx(p) >= cx(q)) order.push(`${p}≥${q}`);
  // グループの枠の外にはみ出したメンバー
  const outside: string[] = [];
  for (const [g, ms] of Object.entries(groups)) {
    const r = rect.get(g);
    for (const m of ms) {
      const c = rect.get(m);
      if (c.x < r.x || c.y < r.y || c.x + c.w > r.x + r.w || c.y + c.h > r.y + r.h) outside.push(`${m}（${g}）`);
    }
  }
  const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);
  console.log(`| ${name} | ${opt.note} | ${order.length ? order.join("、") : "なし"} | ${outside.length ? outside.join("、") : "なし"} | ${hash(a.json) === hash(b.json) ? "一致" : "不一致"} | ${hash(a.json)} |`);
  for (const id of ["user", "cdn", "vpc", "idp", "psp"]) process.stderr.write(`${name} ${id} x=${rect.get(id).x}\n`);
}
