// 図の仕様（*.fig.json）を SVG にする。kind は diagram（構成図）、columns（棒）、stacked（積み上げ棒）。
import { groupedColumns, stackedBars, type ColumnChart, type StackChart } from "./chart-figures.ts";
import { diagram, type DiagramSpec } from "./diagram.ts";

export type ColumnSpec = Omit<ColumnChart, "fmt"> & { kind: "columns"; decimals?: number };
export type StackSpec = StackChart & { kind: "stacked" };
export type FigureSpec = DiagramSpec | ColumnSpec | StackSpec;

export function renderFigure(spec: FigureSpec): string {
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
    default:
      throw new Error(`知らない kind: ${(spec as { kind?: string }).kind}`);
  }
}
