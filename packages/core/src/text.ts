// 文字幅と、SVG に埋め込むフォント（S-TEXT-1、ADR 0006、ADR 0010、ADR 0011）。
// 同梱した BIZ UDPGothic のメトリクスで文字幅を測り、SVG には図に使う字だけを抜き出したサブセットを埋め込む。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";

export const FONT_NAME = "BIZ UDPGothic";
export const FONT_FAMILY = `${FONT_NAME}, sans-serif`;
export const NODE_FONT_SIZE = 13;
export const LABEL_FONT_SIZE = 11;

let cached: fontkit.Font | undefined;
function font(): fontkit.Font {
  cached ??= fontkit.create(readFileSync(join(import.meta.dirname, "..", "fonts", "BIZUDPGothic-Regular.ttf"))) as fontkit.Font;
  return cached;
}

/** 文字列を size（px）で組んだときの幅 */
export function textWidth(text: string, size: number): number {
  const f = font();
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size;
}

/** 文字列に使う字だけを含むサブセットを、TrueType のバイト列で返す */
export function subsetFont(texts: string[]): Uint8Array {
  const f = font();
  const chars = [...new Set([...texts.join("")])].sort().join("");
  const sub = f.createSubset();
  for (const g of f.glyphsForString(chars)) sub.includeGlyph(g);
  return sub.encode();
}
