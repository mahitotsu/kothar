// Claude Agent SDK から Kothar のプラグインを使う例（X12）。
// 使い方：node examples/agent-sdk/draft-model.mjs "<依頼の文>"
// 例：node examples/agent-sdk/draft-model.mjs "docs/process.md から、benchmarks/process/ の語彙と文法を使って、作業プロセスのモデルを下書きして。図も描いて。"
// 作業するディレクトリは、このコマンドを実行したディレクトリである。
// 環境変数 CLAUDE_CODE_EXECUTABLE に、Claude Code の実行ファイルのパスを指定できる。

import { query } from "@anthropic-ai/claude-agent-sdk";
import { fileURLToPath } from "node:url";

const kothar = fileURLToPath(new URL("../../plugins/kothar", import.meta.url));

for await (const message of query({
  prompt: process.argv[2],
  options: {
    plugins: [{ type: "local", path: kothar }],
    allowedTools: ["Bash(kothar:*)", "Read", "Write", "Edit", "Glob", "Grep"],
    ...(process.env.CLAUDE_CODE_EXECUTABLE ? { pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_EXECUTABLE } : {}),
  },
})) {
  if (message.type === "result") console.log(message.subtype === "success" ? message.result : message);
}
