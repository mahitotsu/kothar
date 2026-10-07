// 文法を、配置と検査の両方が使う形に変換する（S-GRAMMAR-1）。
// 配置（layout.ts）と検査（lint.ts）は、どちらもこの変換の結果だけを見る。

import type { EdgeRuleDef, Input, ModelEdge, ModelGroup, ModelNode, RegionDef } from "./types.ts";

export type Compiled = {
  input: Input;
  nodes: Map<string, ModelNode>;
  groups: Map<string, ModelGroup>;
  /** ノードかグループ → それを含むグループ */
  parentOf: Map<string, string>;
  regionOf: (id: string) => RegionDef;
  /** 線ごとの規則。モデルの線と同じ順 */
  edgeRules: EdgeRuleDef[];
  /** グループに含まれるノードとグループ（入れ子の中も含む） */
  descendantsOf: (groupId: string) => Set<string>;
};

export function compile(input: Input): Compiled {
  const { model, grammar } = input;
  const nodes = new Map(model.nodes.map((n) => [n.id, n]));
  const groups = new Map((model.groups ?? []).map((g) => [g.id, g]));
  const parentOf = new Map<string, string>();
  for (const g of groups.values()) for (const m of g.members) parentOf.set(m, g.id);

  const main = grammar.regions.find((r) => r.place === "main" && !r.when)!;
  const regionCache = new Map<string, RegionDef>();
  // グループは本流に属するものとして扱う
  const regionOf = (id: string): RegionDef => {
    let r = regionCache.get(id);
    if (!r) {
      const n = nodes.get(id);
      r = (n && grammar.regions.find((reg) => reg.when && Object.entries(reg.when).every(([k, v]) => n.attrs?.[k] === v))) || main;
      regionCache.set(id, r);
    }
    return r;
  };

  const ruleFor = (e: ModelEdge, i: number): EdgeRuleDef => {
    const rule = grammar.edges.find(
      (r) => r.kind === e.kind && (!r.from || r.from === regionOf(e.from).name) && (!r.to || r.to === regionOf(e.to).name),
    );
    if (!rule) throw new Error(`線 ${i}（${e.from} → ${e.to}、${e.kind}）に当てはまる文法の規則がない`);
    return rule;
  };
  const edgeRules = model.edges.map(ruleFor);

  const descendantsOf = (groupId: string): Set<string> => {
    const out = new Set<string>();
    const walk = (id: string) => {
      for (const m of groups.get(id)?.members ?? []) {
        out.add(m);
        walk(m);
      }
    };
    walk(groupId);
    return out;
  };

  return { input, nodes, groups, parentOf, regionOf, edgeRules, descendantsOf };
}
