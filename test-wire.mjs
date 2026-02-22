import { spawn } from "child_process";
import path from "path";
import os from "os";

const serverPath = path.join(
  os.homedir(),
  ".vscode/extensions/gleidsonfersanp.datadog-observability-1.0.4/mcp-server/index.js",
);

const proc = spawn("node", [serverPath], {
  env: {
    ...process.env,
    DD_API_KEY: "test",
    DD_APP_KEY: "test",
    DD_SITE: "datadoghq.com",
  },
  stdio: ["pipe", "pipe", "pipe"],
});

const init =
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    },
  }) + "\n";
const listTools =
  JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) +
  "\n";

proc.stdin.write(init);

let sentList = false;
let buffer = "";
proc.stdout.on("data", (data) => {
  buffer += data.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line.trim());
      if (json.id === 1 && !sentList) {
        sentList = true;
        proc.stdin.write(listTools);
      }
      if (json.id === 2 && json.result) {
        const tools = json.result.tools;
        console.log("Total tools: " + tools.length);
        let errors = 0;
        for (const tool of tools) {
          const issues = validateTool(tool.name, tool.inputSchema, "");
          for (const i of issues) {
            console.log("  FAIL: " + i);
            errors++;
          }
        }
        const dashTools = tools.filter((t) => t.name.includes("dashboard"));
        for (const t of dashTools) {
          console.log("\n=== " + t.name + " ===");
          console.log(JSON.stringify(t.inputSchema, null, 2));
        }
        console.log(
          errors === 0 ? "\nALL WIRE SCHEMAS VALID" : "\nErrors: " + errors,
        );
        proc.kill();
        process.exit(0);
      }
    } catch (e) {
      /* partial */
    }
  }
});

proc.stderr.on("data", () => {});

function validateTool(name, schema, sp) {
  const r = [];
  if (!schema || typeof schema !== "object") return r;
  if (schema.type === "array" && !schema.items)
    r.push(name + " @ " + (sp || "root"));
  if (schema.items) r.push(...validateTool(name, schema.items, sp + ".items"));
  if (schema.properties)
    for (const [k, v] of Object.entries(schema.properties))
      r.push(...validateTool(name, v, sp + "." + k));
  return r;
}

setTimeout(() => {
  console.log("Timeout");
  proc.kill();
  process.exit(1);
}, 10000);
