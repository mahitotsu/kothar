// 検証 0002 の題材。モデルと文法を、検証 0001 と同じ形のデータで書く。
// 文法は、属性と線の種類から領域と線のスタイルを決める表で書き、題材ごとに差し替える。

export type NodeAttrs = Record<string, string>;
export type ModelNode = { id: string; label: string; attrs?: NodeAttrs };
export type ModelGroup = { id: string; label: string; members: string[]; groups?: ModelGroup[] };
export type ModelEdge = { from: string; to: string; kind: string; label?: string };
export type Model = { nodes: ModelNode[]; groups: ModelGroup[]; edges: ModelEdge[] };

export type Region = "top" | "main" | "bottom" | "side";
export type Side = "NORTH" | "SOUTH" | "EAST" | "WEST";
export type EdgeStyle = "sync" | "external" | "async" | "reverse" | "telemetry";
export type EdgeRule = { style: EdgeStyle; from: Side; to: Side };

// 文法：領域の割り当て（上から順に当てはめる）と、線の種類ごとの規則
export type Grammar = {
  regions: { attr: string; value: string; region: Region }[];
  edges: Record<string, (fromRegion: Region, toRegion: Region) => EdgeRule>;
};

const call = (_: Region, to: Region): EdgeRule =>
  to === "top" ? { style: "external", from: "NORTH", to: "SOUTH" } : { style: "sync", from: "EAST", to: "WEST" };
const publish = (from: Region, to: Region): EdgeRule =>
  from === to ? { style: "async", from: "EAST", to: "WEST" } : { style: "async", from: "SOUTH", to: "NORTH" };
const push = (): EdgeRule => ({ style: "reverse", from: "SOUTH", to: "SOUTH" });
const uses = (): EdgeRule => ({ style: "telemetry", from: "EAST", to: "WEST" });

// サンプル構成図の文法（benchmarks/sample-arch/grammar.md。検証 0001 の grammar.ts と同じ）
export const archGrammar: Grammar = {
  regions: [
    { attr: "concern", value: "cross-cutting", region: "side" },
    { attr: "trust", value: "external", region: "top" },
    { attr: "mode", value: "async", region: "bottom" },
  ],
  edges: { call, publish, push, uses },
};

// 作業プロセスの図の文法。語彙は構成図と別だが、置き方（上段、下段、端の列、逆向きの線）は同じものを使う。
// 承認する人は上段（承認を求める段階の真上）、段階の中で行う作業は下段、参照する決まりや道具は端の列、
// 前の段階に戻る線は図の下を回る。
export const processGrammar: Grammar = {
  regions: [
    { attr: "role", value: "reference", region: "side" },
    { attr: "role", value: "approver", region: "top" },
    { attr: "role", value: "activity", region: "bottom" },
  ],
  edges: { next: call, approve: call, do: publish, back: push, refer: uses },
};

// 題材1：サンプル構成図（検証 0001 の model.ts と同じ）
export const sample: Model = {
  nodes: [
    { id: "user", label: "ユーザー" },
    { id: "cdn", label: "CDN" },
    { id: "apigw", label: "API Gateway" },
    { id: "order", label: "注文サービス" },
    { id: "stock", label: "在庫サービス" },
    { id: "orderdb", label: "注文DB" },
    { id: "stockdb", label: "在庫DB" },
    { id: "idp", label: "IdP", attrs: { trust: "external" } },
    { id: "psp", label: "決済代行", attrs: { trust: "external" } },
    { id: "queue", label: "イベントキュー", attrs: { mode: "async" } },
    { id: "worker", label: "通知ワーカー", attrs: { mode: "async" } },
    { id: "log", label: "ログ基盤", attrs: { concern: "cross-cutting" } },
    { id: "mon", label: "監視", attrs: { concern: "cross-cutting" } },
    { id: "kms", label: "鍵管理", attrs: { concern: "cross-cutting" } },
  ],
  groups: [
    {
      id: "vpc",
      label: "VPC",
      members: ["apigw", "orderdb", "stockdb", "queue", "worker"],
      groups: [{ id: "app", label: "アプリ層", members: ["order", "stock"] }],
    },
  ],
  edges: [
    { from: "user", to: "cdn", kind: "call", label: "HTTPS" },
    { from: "cdn", to: "apigw", kind: "call" },
    { from: "apigw", to: "order", kind: "call" },
    { from: "apigw", to: "stock", kind: "call" },
    { from: "order", to: "orderdb", kind: "call" },
    { from: "stock", to: "stockdb", kind: "call" },
    { from: "apigw", to: "idp", kind: "call", label: "トークン検証" },
    { from: "order", to: "psp", kind: "call", label: "決済" },
    { from: "stock", to: "queue", kind: "publish", label: "在庫変動" },
    { from: "queue", to: "worker", kind: "publish" },
    { from: "worker", to: "user", kind: "push", label: "プッシュ通知" },
    { from: "vpc", to: "log", kind: "uses" },
    { from: "vpc", to: "mon", kind: "uses" },
    { from: "vpc", to: "kms", kind: "uses" },
  ],
};

// 題材2：題材1で、在庫サービスも決済代行を呼ぶ。上段のノードを2つの呼び出す側が共有し、
// 在庫サービスは注文サービスと同じ列の下にあるので、真上への線の通り道に注文サービスがある。
export const shared: Model = {
  ...sample,
  edges: [...sample.edges, { from: "stock", to: "psp", kind: "call", label: "返金" }],
};

// 題材3：作業プロセスの図（docs/process.md のサイクルと収束のループ）
export const process: Model = {
  nodes: [
    { id: "s1", label: "1. 約束" },
    { id: "s2", label: "2. 体験" },
    { id: "s3", label: "3. 要件" },
    { id: "s4", label: "4. 仕様の仮説" },
    { id: "s5", label: "5. 収束" },
    { id: "s6", label: "6. ゲート" },
    { id: "owner", label: "責任者", attrs: { role: "approver" } },
    { id: "adr", label: "ADR", attrs: { role: "activity" } },
    { id: "spike", label: "検証", attrs: { role: "activity" } },
    { id: "impl", label: "実装とテスト", attrs: { role: "activity" } },
    { id: "docs", label: "文書体系", attrs: { role: "reference" } },
    { id: "todo", label: "作業項目の一覧", attrs: { role: "reference" } },
    { id: "trace", label: "対応表", attrs: { role: "reference" } },
  ],
  groups: [
    {
      id: "cycle",
      label: "サイクル",
      members: ["s6"],
      groups: [
        { id: "promise", label: "約束のループ", members: ["s1", "s2", "s3"] },
        { id: "converge", label: "収束のループ", members: ["s4", "s5", "adr", "spike", "impl"] },
      ],
    },
  ],
  edges: [
    { from: "s1", to: "s2", kind: "next" },
    { from: "s2", to: "s3", kind: "next" },
    { from: "s3", to: "s4", kind: "next" },
    { from: "s4", to: "s5", kind: "next" },
    { from: "s5", to: "s6", kind: "next" },
    { from: "s1", to: "owner", kind: "approve" },
    { from: "s2", to: "owner", kind: "approve" },
    { from: "s3", to: "owner", kind: "approve" },
    { from: "s5", to: "owner", kind: "approve", label: "ADR" },
    { from: "s6", to: "owner", kind: "approve", label: "判定" },
    { from: "s5", to: "adr", kind: "do" },
    { from: "s5", to: "spike", kind: "do" },
    { from: "s5", to: "impl", kind: "do" },
    { from: "s5", to: "s3", kind: "back", label: "上流に戻る" },
    { from: "s6", to: "s1", kind: "back", label: "次のサイクル" },
    { from: "cycle", to: "docs", kind: "refer" },
    { from: "cycle", to: "todo", kind: "refer" },
    { from: "s2", to: "trace", kind: "refer" },
  ],
};
