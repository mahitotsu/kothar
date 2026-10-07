// 配置の結果の JSON（S-OUT-1）と SVG（S-OUT-2）。
// どちらも、同じ配置の結果からバイト単位で同じ文字列を出す（S-DET-1）。配列はモデルの順、キーは決めた順で出す。

import type { Compiled } from "./compile.ts";
import { r2 } from "./layout.ts";
import { FONT_FAMILY, FONT_NAME, LABEL_FONT_SIZE, NODE_FONT_SIZE, subsetFont } from "./text.ts";
import type { Layout, StyleDef } from "./types.ts";

export function toJson(l: Layout): string {
  const pinned = l.nodes.filter((n) => n.pinned).map((n) => n.id);
  const data = {
    nodes: l.nodes.map((n) => ({
      id: n.id,
      region: n.region.name,
      x: r2(n.rect.x + n.rect.w / 2),
      y: r2(n.rect.y + n.rect.h / 2),
      width: n.rect.w,
      height: n.rect.h,
      pinned: n.pinned,
    })),
    edges: l.edges.map((e) => ({
      from: e.from,
      to: e.to,
      kind: e.kind,
      style: e.rule.style,
      points: e.points,
      ...(e.label ? { label: { text: e.label.text, x: e.label.rect.x, y: e.label.rect.y, width: e.label.rect.w, height: e.label.rect.h } } : {}),
    })),
    groups: l.groups.map((g) => ({ id: g.id, x: g.rect.x, y: g.rect.y, width: g.rect.w, height: g.rect.h })),
    pins: { count: pinned.length, nodes: pinned },
  };
  return JSON.stringify(data, null, 2) + "\n";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DASH: Record<StyleDef["line"], string> = { solid: "", dashed: ` stroke-dasharray="6 4"`, dotted: ` stroke-dasharray="2 3"` };

export function toSvg(c: Compiled, l: Layout): string {
  const styles = c.input.grammar.styles;
  const sideFrame = l.regions.find((r) => r.region.place === "side-column" && r.region.label);
  const frame = sideFrame && { x: r2(sideFrame.rect.x - 16), y: r2(sideFrame.rect.y - 32), w: r2(sideFrame.rect.w + 32), h: r2(sideFrame.rect.h + 48) };
  const rects = [...l.nodes.map((n) => n.rect), ...l.groups.map((g) => g.rect), ...(frame ? [frame] : [])];
  const pts = l.edges.flatMap((e) => e.points);
  const W = Math.ceil(Math.max(...rects.map((r) => r.x + r.w), ...pts.map((q) => q[0]), ...l.edges.flatMap((e) => (e.label ? [e.label.rect.x + e.label.rect.w] : [])))) + 20;
  const H = Math.ceil(Math.max(...rects.map((r) => r.y + r.h), ...pts.map((q) => q[1]))) + 20;

  // 図に使う字だけのサブセットを埋め込む（ADR 0010）
  const texts = [
    ...l.nodes.map((n) => n.label),
    ...l.groups.map((g) => g.label),
    ...l.edges.flatMap((e) => (e.label ? [e.label.text] : [])),
    ...l.regions.flatMap((r) => (r.region.label ? [r.region.label] : [])),
  ];
  const fontData = Buffer.from(subsetFont(texts)).toString("base64");
  const o: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${esc(FONT_FAMILY)}" font-size="${NODE_FONT_SIZE}">`,
    `<style>@font-face{font-family:"${FONT_NAME}";src:url(data:font/ttf;base64,${fontData}) format("truetype");}</style>`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>`,
  ];
  // 領域の名前。上段と下段は帯の名前を書き、端の列は破線の枠で囲む
  for (const r of l.regions) {
    if (!r.region.label) continue;
    if (r.region.place === "above-caller" || r.region.place === "below-main")
      o.push(`<text x="8" y="${r2(r.rect.y - 8)}" fill="#6b7280" font-size="${LABEL_FONT_SIZE}">${esc(r.region.label)}</text>`);
  }
  if (frame && sideFrame)
    o.push(
      `<rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="8" fill="none" stroke="#9ca3af" stroke-dasharray="4 4"/>`,
      `<text x="${r2(frame.x + 8)}" y="${r2(frame.y + 16)}" fill="#6b7280" font-size="${LABEL_FONT_SIZE}">${esc(sideFrame.region.label!)}</text>`,
    );
  for (const g of l.groups)
    o.push(
      `<rect x="${g.rect.x}" y="${g.rect.y}" width="${g.rect.w}" height="${g.rect.h}" rx="8" fill="none" stroke="#6b7280"/>`,
      `<text x="${r2(g.rect.x + 8)}" y="${r2(g.rect.y + 16)}" fill="#374151" font-size="12">${esc(g.label)}</text>`,
    );
  for (const n of l.nodes)
    o.push(
      `<rect x="${n.rect.x}" y="${n.rect.y}" width="${n.rect.w}" height="${n.rect.h}" rx="6" fill="#f9fafb" stroke="#111827"/>`,
      `<text x="${r2(n.rect.x + n.rect.w / 2)}" y="${r2(n.rect.y + n.rect.h / 2 + 5)}" text-anchor="middle">${esc(n.label)}</text>`,
    );
  for (const e of l.edges) {
    const s = styles[e.rule.style];
    const color = s.color ?? "#1f2937";
    const width = s.weight === "thin" ? 1.2 : 1.6;
    const d = e.points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
    o.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${DASH[s.line]} marker-end="url(#arrow)"/>`);
    if (e.label)
      o.push(`<text x="${r2(e.label.rect.x + 3)}" y="${r2(e.label.rect.y + 12)}" fill="#374151" font-size="${LABEL_FONT_SIZE}">${esc(e.label.text)}</text>`);
  }
  o.push(`</svg>`);
  return o.join("\n") + "\n";
}
