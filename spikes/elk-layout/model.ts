// サンプル構成図のモデル。座標は持たず、要素と線と属性だけを書く。
// 記述形式は未決なので、検証の間は TypeScript のオブジェクトで書く。

export type NodeAttrs = { trust?: "external"; mode?: "async"; concern?: "cross-cutting" };
export type ModelNode = { id: string; label: string; attrs?: NodeAttrs };
export type ModelGroup = { id: string; label: string; members: string[]; groups?: ModelGroup[] };
export type EdgeKind = "call" | "publish" | "push" | "uses";
export type ModelEdge = { from: string; to: string; kind: EdgeKind; label?: string };
export type Model = { nodes: ModelNode[]; groups: ModelGroup[]; edges: ModelEdge[] };

export const model: Model = {
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
