// 文字幅（S-TEXT-1）。
// 同梱するフォントを選ぶまで（T10）、全角を 1em、それ以外を 0.6em とする見積もりで代用する（検証 0001 と同じ）。

export const FONT_FAMILY = "Noto Sans CJK JP, sans-serif";
export const NODE_FONT_SIZE = 13;
export const LABEL_FONT_SIZE = 11;

export function textWidth(text: string, size: number): number {
  let w = 0;
  for (const c of text) w += c.codePointAt(0)! >= 0x2e80 ? size : size * 0.6;
  return w;
}
