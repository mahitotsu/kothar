// 図の仕様（*.fig.json）を SVG にする。kind の登録表。表の双子（figureTable）も、ここから出す。
// kind: 構造・流れ = grid（格子の図: 構成、レイヤー、コンテキスト、フローチャート）、sequence、timeline、compare（Before/After）、matrix（2x2）、diagram（手書き座標）。
//       グラフ = bars（横棒）、lines（折れ線）、dumbbell、heatmap、tiles（KPI）、meter、columns（棒）、stacked（積み上げ棒）。
import { bars, barsTable, dumbbell, dumbbellTable, heatmap, heatmapTable, lines, linesTable, meter, meterTable, need, tiles, tilesTable } from "./charts-more.ts";
import type { BarsSpec, DumbbellSpec, HeatmapSpec, LinesSpec, MeterSpec, TilesSpec } from "./charts-more.ts";
import { columnsTable, groupedColumns, stackedBars, stackedTable, type ColumnChart, type StackChart } from "./chart-figures.ts";
import { diagram, type DiagramSpec } from "./diagram.ts";
import { compare, compareWarnings, type CompareSpec } from "./compare.ts";
import { grid, layoutGrid, type GridSpec } from "./grid.ts";
import { matrix, matrixTable, type MatrixSpec } from "./matrix.ts";
import { sequence, type SequenceSpec } from "./sequence.ts";
import { timeline, timelineTable, type TimelineSpec } from "./timeline.ts";

export type ColumnSpec = Omit<ColumnChart, "fmt"> & { kind: "columns"; decimals?: number };
export type StackSpec = StackChart & { kind: "stacked" };
export type FigureSpec = DiagramSpec | ColumnSpec | StackSpec | BarsSpec | LinesSpec | DumbbellSpec | HeatmapSpec | TilesSpec | MeterSpec | GridSpec | SequenceSpec | TimelineSpec | CompareSpec | MatrixSpec;

/** どの図にも、題名（title）と、要点を書いた説明（desc）が要る。 */
function common(spec: FigureSpec) {
  need(spec.title?.trim(), "title がない（図の題名）");
  need(spec.desc?.trim(), "desc がない（図の要点を、読み上げ用に書く）");
}

const KINDS = ["diagram", "columns", "stacked", "bars", "lines", "dumbbell", "heatmap", "tiles", "meter", "grid", "sequence", "timeline", "compare", "matrix"];

export function renderFigure(spec: FigureSpec): string {
  need(KINDS.includes(spec.kind), `知らない kind: ${spec.kind}（使えるのは ${KINDS.join("、")}）`);
  common(spec);
  switch (spec.kind) {
    case "diagram":
      return diagram(spec);
    case "columns": {
      const { kind: _k, decimals, ...c } = spec;
      return groupedColumns({ ...c, fmt: (n) => (decimals === undefined ? String(n) : n.toFixed(decimals)) });
    }
    case "stacked": {
      const { kind: _k, ...c } = spec;
      return stackedBars(c);
    }
    case "bars":
      return bars(spec);
    case "lines":
      return lines(spec);
    case "dumbbell":
      return dumbbell(spec);
    case "heatmap":
      return heatmap(spec);
    case "tiles":
      return tiles(spec);
    case "meter":
      return meter(spec);
    case "grid":
      return grid(spec);
    case "sequence":
      return sequence(spec);
    case "timeline":
      return timeline(spec);
    case "compare":
      return compare(spec);
    case "matrix":
      return matrix(spec);
    default:
      throw new Error(`知らない kind: ${(spec as { kind?: string }).kind}`);
  }
}

/** 表の双子（Markdown）。表にできない図（構成図など）は null。 */
export function figureTable(spec: FigureSpec): string | null {
  switch (spec.kind) {
    case "columns":
      return columnsTable(spec);
    case "stacked":
      return stackedTable(spec);
    case "bars":
      return barsTable(spec);
    case "lines":
      return linesTable(spec);
    case "dumbbell":
      return dumbbellTable(spec);
    case "heatmap":
      return heatmapTable(spec);
    case "tiles":
      return tilesTable(spec);
    case "meter":
      return meterTable(spec);
    case "timeline":
      return timelineTable(spec);
    case "matrix":
      return matrixTable(spec);
    default:
      return null;
  }
}

/** 配置の警告（矢印の交差、節点の横切り）。エージェントは、0 件になるまで、仕様の row と col を直す。 */
export function lintFigure(spec: FigureSpec): string[] {
  switch (spec.kind) {
    case "grid":
      return layoutGrid(spec, spec.allowCrossings).warnings;
    case "compare":
      return compareWarnings(spec);
    default:
      return [];
  }
}
