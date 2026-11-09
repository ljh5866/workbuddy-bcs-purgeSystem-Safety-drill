#!/usr/bin/env node
/**
 * 安装器：按 WorkBuddy 5.9.3 实际的装载约定落盘。
 *
 *   node tools/install.mjs --user              用户级（~/.codebuddy）
 *   node tools/install.mjs --project D:\repo   项目级（<dir>/.codebuddy）
 *   node tools/install.mjs --user --dry-run    只看计划
 *   node tools/install.mjs --user --uninstall  卸载
 *
 * 约定来自宿主代码：用户规则 <configDir>/rules/**\/*.md（另支持 .mdc，单文件上限 40000 字符），
 * 用户技能 <configDir>/skills/<name>/SKILL.md；
 * 项目规则 <cwd>/.codebuddy/rules/**，项目技能 <cwd>/.codebuddy/skills/**。
 * 项目根 CODEBUDDY.md 是另一条通道，按字符截断到 8000，不适合放长规则。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const dryRun = has("--dry-run");
const uninstall = has("--uninstall");
const projectDir = valueOf("--project");
const scope = projectDir ? "project" : "user";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const PLUGINS = [
  {
    name: "workbuddy-secops-guardrails",
    rules: "plugins/workbuddy-secops-guardrails/rules/guardrails.md",
    skills: ["authorized-drill", "output-sanitize"],
    dir: "plugins/workbuddy-secops-guardrails/skills",
  },
  {
    name: "workbuddy-bcs-purgeSystem-Safety-drill",
    rules: "plugins/workbuddy-bcs-purgeSystem-Safety-drill/rules/spec.md",
    skills: ["drill-playbook", "delivery-playbook"],
    dir: "plugins/workbuddy-bcs-purgeSystem-Safety-drill/skills",
  },
];

const only = valueOf("--plugin");
const selected = PLUGINS.filter((p) => !only || p.name === only);

const base =
  scope === "user"
    ? path.join(os.homedir(), ".codebuddy")
    : path.join(path.resolve(projectDir), ".codebuddy");

const plan = [];
for (const p of selected) {
  plan.push({ kind: "rule", from: p.rules, to: path.join(base, "rules", `${p.name}.md`) });
  for (const s of p.skills) {
    plan.push({
      kind: "skill",
      from: `${p.dir}/${s}/SKILL.md`,
      to: path.join(base, "skills", s, "SKILL.md"),
    });
  }
}

console.log(`作用域 ${scope} · 目标根 ${base}${dryRun ? " · dry-run" : ""}`);
console.log(`宿主约定：规则走 rules/*.md（≤40000 字符），技能走 skills/<name>/SKILL.md\n`);

let changed = 0;
for (const item of plan) {
  const exists = fs.existsSync(item.to);
  const action = uninstall ? (exists ? "删除" : "跳过") : exists ? "覆盖" : "新建";
  const bytes = uninstall ? 0 : Buffer.byteLength(read(item.from), "utf8");
  console.log(`  ${action}  ${item.kind.padEnd(5)}  ${item.to}${uninstall ? "" : `  ${bytes} B`}`);
  if (dryRun) continue;
  if (uninstall) {
    if (exists) {
      fs.rmSync(item.to, { force: true });
      changed++;
    }
    continue;
  }
  const content = read(item.from);
  if (item.kind === "rule" && content.length > 40000) {
    console.error(`    跳过：超过单文件 40000 字符上限`);
    continue;
  }
  fs.mkdirSync(path.dirname(item.to), { recursive: true });
  fs.writeFileSync(item.to, content, "utf8");
  changed++;
}

if (!dryRun) {
  console.log(`\n${uninstall ? "已移除" : "已写入"} ${changed} 个文件。`);
  console.log("生效：WorkBuddy 新开会话。多套常驻 rules 会同时加载，别装两套。");
  console.log("校验：node tools/selftest.mjs");
}
