// 文法を、配置と検査の両方が使う形に変換する（S-GRAMMAR-1、S-GRAMMAR-2、S-LAYOUT-5）。
// 配置（layout.ts）と検査（lint.ts）は、どちらもこの変換の結果だけを見る。
// 出さないノードと線は、ここでモデルから除く。返す input のモデルは、除いたあとのモデルである。

import { InputError } from "./input.ts";
import type { EdgeRuleDef, Input, ModelEdge, ModelGroup, ModelNode, RegionDef } from "./types.ts";

export type Compiled = {
  /** 出さないノードと線を除いたあとの入力 */
  input: Input;
  nodes: Map<string, ModelNode>;
  groups: Map<string, ModelGroup>;
  /** ノードかグループ → それを含むグループ */
  parentOf: Map<string, string>;
  regionOf: (id: string) => RegionDef;
  /** 線ごとの規則。除いたあとのモデルの線と同じ順 */
  edgeRules: EdgeRuleDef[];
  /** グループに含まれるノードとグループ（入れ子の中も含む） */
  descendantsOf: (groupId: string) => Set<string>;
  /** 列（column）で配置するか */
  columns: boolean;
};

// グループのメンバーをたどる道具。除く前のモデルと、除いたあとのモデルの両方に使う
function tree(groups: ModelGroup[]) {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const parentOf = new Map<string, string>();
  for (const g of groups) for (const m of g.members) parentOf.set(m, g.id);
  const descendantsOf = (groupId: string): Set<string> => {
    const out = new Set<string>();
    const walk = (id: string) => {
      for (const m of byId.get(id)?.members ?? []) {
        out.add(m);
        walk(m);
      }
    };
    walk(groupId);
    return out;
  };
  const ancestorsOf = (id: string): ModelGroup[] => {
    const out: ModelGroup[] = [];
    for (let p = parentOf.get(id); p; p = parentOf.get(p)) out.push(byId.get(p)!);
    return out;
  };
  return { byId, parentOf, descendantsOf, ancestorsOf };
}

const hasAttrs = (attrs: Record<string, string> | undefined, want: Record<string, string>) =>
  Object.entries(want).every(([k, v]) => attrs?.[k] === v);

export function compile(input: Input): Compiled {
  const { model, grammar } = input;
  const all = tree(model.groups ?? []);
  const fallback = grammar.regions.find((r) => !r.when)!;

  // 領域：条件の当たる最初の領域。グループは、列で配置するときはメンバーの領域、そうでなければ条件のない領域とする
  const nodeRegion = new Map<string, RegionDef>();
  for (const n of model.nodes) {
    const region = grammar.regions.find((r) => {
      if (!r.when) return false;
      const { inGroup, ...attrs } = r.when;
      return hasAttrs(n.attrs, attrs as Record<string, string>) && (!inGroup || all.ancestorsOf(n.id).some((g) => hasAttrs(g.attrs, inGroup)));
    });
    nodeRegion.set(n.id, region ?? fallback);
  }
  const columns = grammar.regions.some((r) => r.place === "column");

  // 出さないノードを除き、メンバーがいなくなったグループも除く
  const visibleNodes = model.nodes.filter((n) => nodeRegion.get(n.id)!.place !== "hidden");
  const visible = new Set(visibleNodes.map((n) => n.id));
  const groups: ModelGroup[] = [];
  const keepGroup = (id: string): boolean => [...all.descendantsOf(id)].some((m) => visible.has(m));
  for (const g of model.groups ?? []) if (keepGroup(g.id)) visible.add(g.id);
  for (const g of model.groups ?? []) if (visible.has(g.id)) groups.push({ ...g, members: g.members.filter((m) => visible.has(m)) });

  const groupRegion = (id: string): RegionDef => {
    if (!columns) return fallback;
    const regions = [...new Set([...all.descendantsOf(id)].filter((m) => nodeRegion.has(m) && visible.has(m)).map((m) => nodeRegion.get(m)!))];
    return regions[0] ?? fallback;
  };
  const regionOf = (id: string): RegionDef => nodeRegion.get(id) ?? groupRegion(id);

  const problems: string[] = [];
  if (columns)
    for (const g of groups) {
      const cols = new Set([...all.descendantsOf(g.id)].filter((m) => nodeRegion.has(m) && visible.has(m)).map((m) => nodeRegion.get(m)!.column));
      if (cols.size > 1) problems.push(`グループ「${g.id}」の中に、違う列（${[...cols].join("、")}）に割り当てたノードがある`);
    }

  // 線の規則：種類、両端の領域、枠をまたぐかの条件の当たる最初の規則
  const crosses = (e: ModelEdge, want: Record<string, string>) =>
    (model.groups ?? [])
      .filter((g) => hasAttrs(g.attrs, want))
      .some((g) => {
        const inside = (id: string) => all.descendantsOf(g.id).has(id);
        return inside(e.from) !== inside(e.to) && e.from !== g.id && e.to !== g.id;
      });
  const edges: ModelEdge[] = [];
  const edgeRules: EdgeRuleDef[] = [];
  model.edges.forEach((e, i) => {
    const rule = grammar.edges.find(
      (r) =>
        r.kind === e.kind &&
        (!r.from || r.from === regionOf(e.from).name) &&
        (!r.to || r.to === regionOf(e.to).name) &&
        (!r.crosses || crosses(e, r.crosses)),
    );
    if (!rule) {
      problems.push(`線 ${i}（${e.from} → ${e.to}、${e.kind}）に当てはまる文法の規則がない`);
      return;
    }
    if (rule.hidden || !visible.has(e.from) || !visible.has(e.to)) return;
    edges.push(e);
    edgeRules.push(rule);
  });
  if (problems.length) throw new InputError(problems);

  const shown = tree(groups);
  const filtered: Input = { ...input, model: { ...model, nodes: visibleNodes, groups, edges } };
  return {
    input: filtered,
    nodes: new Map(visibleNodes.map((n) => [n.id, n])),
    groups: shown.byId,
    parentOf: shown.parentOf,
    regionOf,
    edgeRules,
    descendantsOf: shown.descendantsOf,
    columns,
  };
}
