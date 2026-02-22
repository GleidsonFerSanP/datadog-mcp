import fs from "fs";
import path from "path";
import os from "os";

const extDir = path.join(
  os.homedir(),
  ".vscode/extensions/gleidsonfersanp.datadog-observability-1.0.4/mcp-server/tools",
);
const files = fs
  .readdirSync(extDir)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
let errors = 0;

for (const f of files) {
  const mod = await import(path.join(extDir, f));
  for (const [key, val] of Object.entries(mod)) {
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      val[0].name &&
      val[0].inputSchema
    ) {
      for (const tool of val) {
        check(f, tool.name, tool.inputSchema, "");
      }
    }
  }
}

if (errors === 0) {
  console.log("INSTALLED EXTENSION: ALL SCHEMAS VALID");
} else {
  console.log("INSTALLED EXTENSION: " + errors + " errors found");
}

function check(file, toolName, schema, sp) {
  if (schema === null || schema === undefined || typeof schema !== "object")
    return;
  if (schema.type === "array" && schema.items === undefined) {
    console.log(
      "FAIL: " + file + " tool=" + toolName + " path=" + (sp || "root"),
    );
    errors++;
  }
  if (schema.items) check(file, toolName, schema.items, sp + ".items");
  if (schema.properties) {
    for (const [k, v] of Object.entries(schema.properties)) {
      check(file, toolName, v, sp + "." + k);
    }
  }
}
