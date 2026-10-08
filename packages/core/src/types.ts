// 入力（語彙、文法、モデル）と、配置の結果の型。

export type Side = "north" | "south" | "east" | "west";
export type Place = "main" | "below-main" | "above-caller" | "side-column" | "column" | "hidden";

export type Vocabulary = {
  attributes: Record<string, string[]>;
  edgeKinds: string[];
};

/** when の inGroup は、その属性を持つグループの中（入れ子を含む）にあるノードに当たる */
export type RegionWhen = { inGroup?: Record<string, string> } & { [key: string]: string | Record<string, string> | undefined };
export type RegionDef = { name: string; place: Place; column?: number; when?: RegionWhen; label?: string };
export type StyleDef = { line: "solid" | "dashed" | "dotted"; color?: string; weight?: "thin" | "normal" | "thick" };
export type EdgeRuleDef = {
  kind: string;
  from?: string;
  to?: string;
  /** この属性を持つグループの枠を、片方の端だけが中にある線に当たる */
  crosses?: Record<string, string>;
  /** この規則に当たる線を出さない。出さない規則には style、exit、enter を書かない */
  hidden?: true;
  style: string;
  exit: Side;
  enter: Side;
  flow?: boolean;
  route?: "around";
};

export type Grammar = {
  vocabulary: string;
  flow: "right";
  regions: RegionDef[];
  styles: Record<string, StyleDef>;
  edges: EdgeRuleDef[];
};

export type ModelNode = { id: string; label: string; attrs?: Record<string, string>; pin?: { x: number; y: number } };
export type ModelGroup = { id: string; label: string; attrs?: Record<string, string>; members: string[] };
export type ModelEdge = { from: string; to: string; kind: string; label?: string };

export type Model = {
  vocabulary: string;
  grammar: string;
  nodes: ModelNode[];
  groups?: ModelGroup[];
  edges: ModelEdge[];
};

/** 読み込んで検査を通った入力 */
export type Input = { model: Model; grammar: Grammar; vocabulary: Vocabulary };

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = [number, number];

/** 配置の結果。座標は左上を原点とし、ノードとグループの矩形は左上の角で持つ */
export type Layout = {
  nodes: { id: string; label: string; region: RegionDef; rect: Rect; pinned: boolean }[];
  groups: { id: string; label: string; rect: Rect; members: string[] }[];
  edges: { from: string; to: string; kind: string; rule: EdgeRuleDef; points: Point[]; label?: { text: string; rect: Rect } }[];
  regions: { region: RegionDef; rect: Rect }[];
};
