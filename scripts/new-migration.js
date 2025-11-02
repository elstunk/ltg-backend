// scripts/new-migration.js
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

// slugify a name into file-friendly
function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "_" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

const nameArg = process.argv.slice(2).join(" ").trim();
if (!nameArg) {
  console.error("Usage: npm run migrate:new \"your migration name\"");
  process.exit(1);
}

const filename = `${nowStamp()}_${slug(nameArg)}.sql`;
fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

const template = `-- ${filename}
-- Write your SQL here. This file runs inside a transaction.
-- Example:
--   ALTER TABLE tournaments ADD COLUMN purse NUMERIC;
`;

const full = path.join(MIGRATIONS_DIR, filename);
fs.writeFileSync(full, template, { encoding: "utf8" });
console.log(`📝 Created ${full}`);
