// 受け入れテストの入力。体験の例（docs/experience/XNN/）のファイルを読み、ピン留めの座標は X01 の配置の結果から求める。

import { join } from "node:path";
import { draw, drawInput, loadInput, type Drawing, type Input, type Rect } from "../src/index.ts";

export const ROOT = join(import.meta.dirname, "..", "..", "..");
export const X01_MODEL = join(ROOT, "benchmarks/sample-arch/model.yaml");
export const X02_MODEL = join(ROOT, "docs/experience/X02/model.yaml");
export const X06_AFTER = join(ROOT, "docs/experience/X06/model-after.yaml");
export const X07_MODEL = join(ROOT, "docs/experience/X07/model.yaml");

let x01: Promise<Drawing> | undefined;
export const drawX01 = () => (x01 ??= draw(X01_MODEL));

export const nodeRect = (d: Drawing, id: string): Rect => d.layout.nodes.find((n) => n.id === id)!.rect;
export const groupRect = (d: Drawing, id: string): Rect => d.layout.groups.find((g) => g.id === id)!.rect;
export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export function withPin(input: Input, id: string, pin: { x: number; y: number }): Input {
  return { ...input, model: { ...input.model, nodes: input.model.nodes.map((n) => (n.id === id ? { ...n, pin } : n)) } };
}

/** X03 の例：queue を、stock の真下で、アプリ層の枠の下辺と VPC の枠の下辺の中点に固定する */
export async function x03Pin() {
  const d = await drawX01();
  const app = groupRect(d, "app");
  const vpc = groupRect(d, "vpc");
  return { x: center(nodeRect(d, "stock")).x, y: (app.y + app.h + vpc.y + vpc.h) / 2 };
}

/** X04 の例：queue を、stockdb の中心に固定する（書き間違い） */
export async function x04Pin() {
  return center(nodeRect(await drawX01(), "stockdb"));
}

export const drawX03 = async () => drawInput(withPin(loadInput(X01_MODEL), "queue", await x03Pin()));
export const drawX04 = async () => drawInput(withPin(loadInput(X01_MODEL), "queue", await x04Pin()));
