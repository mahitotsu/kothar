// 検証 0007：Claude Agent SDK にプラグインを読み込ませ、bin/ のコマンドとスキルの本文のパスが使えるかを確かめる。
// 実行: node spikes/plugin-reach/sdk.mjs <claude の実行ファイルのパス>
import { query } from "@anthropic-ai/claude-agent-sdk";
import { fileURLToPath } from "node:url";

const plugin = fileURLToPath(new URL("./probe", import.meta.url));
let text = "";
for await (const m of query({
  prompt: "/probe:probe",
  options: {
    plugins: [{ type: "local", path: plugin }],
    allowedTools: ["Bash"],
    model: "haiku",
    pathToClaudeCodeExecutable: process.argv[2],
  },
})) {
  if (m.type === "system" && m.subtype === "init") console.log("plugins:", JSON.stringify(m.plugins), "skills:", JSON.stringify(m.skills.filter((s) => s.startsWith("probe"))));
  if (m.type === "result") text = m.result ?? "";
}
console.log(text);
