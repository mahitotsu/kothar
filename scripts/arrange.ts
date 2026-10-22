// 格子の図の自動調整。同じ行の節点どうし（列を入れ替え）、同じ列の節点どうし（行を入れ替え）を試し、警告（矢印の交差、節点の横切り）が最も少ない配置にする。
// 行と列の順序の意味（上から下の流れなど）を壊さないよう、行をまたぐ入れ替えはしない。同じ入力なら同じ出力。
import { layoutGrid, type GridSpec } from "./grid.ts";

export interface Arranged {
  spec: GridSpec;
  before: number;
  after: number;
}

const score = (s: GridSpec) => layoutGrid(s, s.allowCrossings).warnings.length;

export function arrange(spec: GridSpec): Arranged {
  let best: GridSpec = JSON.parse(JSON.stringify(spec));
  const before = score(best);
  let cur = before;
  for (let round = 0; round < 20 && cur > 0; round++) {
    let improved = false;
    const nodes = best.nodes;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const [a, b] = [nodes[i], nodes[j]];
      if ((a.colSpan ?? 1) > 1 || (b.colSpan ?? 1) > 1) continue;
      const sameRow = a.row === b.row, sameCol = a.col === b.col;
      if (!sameRow && !sameCol) continue;
      const trial: GridSpec = JSON.parse(JSON.stringify(best));
      const [ta, tb] = [trial.nodes[i], trial.nodes[j]];
      if (sameRow) [ta.col, tb.col] = [tb.col, ta.col];
      else [ta.row, tb.row] = [tb.row, ta.row];
      let s: number;
      try {
        s = score(trial);
      } catch {
        continue;
      }
      if (s < cur) {
        best = trial;
        cur = s;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return { spec: best, before, after: cur };
}
