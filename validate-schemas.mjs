import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "dist", "tools");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
let errors = 0;

for (const f of files) {
  const mod = await import(path.join(dir, f));
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
  console.log("ALL SCHEMAS VALID - no arrays missing items");
} else {
  console.log("Total errors: " + errors);
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
