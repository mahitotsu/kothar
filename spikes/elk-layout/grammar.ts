// サンプル構成図の文法（benchmarks/sample-arch/grammar.md）を関数で書いたもの。
// 文法はノードの名前を見ず、属性と線の kind だけを見る。

import type { ModelEdge, ModelNode } from "./model.ts";

export type Region = "top" | "main" | "bottom" | "side";
export type Side = "NORTH" | "SOUTH" | "EAST" | "WEST";
export type EdgeStyle = "sync" | "external" | "async" | "reverse" | "telemetry";

export const regionOrder: Region[] = ["top", "main", "bottom"];

export function regionOf(n: ModelNode | undefined): Region {
  // グループは本流に属するものとして扱う
  if (n?.attrs?.concern === "cross-cutting") return "side";
  if (n?.attrs?.trust === "external") return "top";
  if (n?.attrs?.mode === "async") return "bottom";
  return "main";
}

export type EdgeRule = { style: EdgeStyle; from: Side; to: Side };

export function edgeRule(e: ModelEdge, fromRegion: Region, toRegion: Region): EdgeRule {
  switch (e.kind) {
    case "call":
      return toRegion === "top"
        ? { style: "external", from: "NORTH", to: "SOUTH" }
        : { style: "sync", from: "EAST", to: "WEST" };
    case "publish":
      return fromRegion === toRegion
        ? { style: "async", from: "EAST", to: "WEST" }
        : { style: "async", from: "SOUTH", to: "NORTH" };
    case "push":
      return { style: "reverse", from: "SOUTH", to: "SOUTH" };
    case "uses":
      return { style: "telemetry", from: "EAST", to: "WEST" };
  }
}
