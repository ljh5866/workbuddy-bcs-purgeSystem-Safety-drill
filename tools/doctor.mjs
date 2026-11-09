#!/usr/bin/env node
/**
 * 装机体检：核对宿主实际会读的位置，而不是仓库里的文件。
 *
 *   node tools/doctor.mjs                 只看用户级
 *   node tools/doctor.mjs --project D:\x   顺带看项目级
 *
 * 判定依据来自 WorkBuddy 5.9.3 的装载逻辑：
 *   用户规则 ~/.codebuddy/rules/**\/*.md|.mdc  单文件 ≤40000 字符
 *   项目规则 <cwd>/.codebuddy/rules/**
 *   技能     <configDir>/skills/<name>/SKILL.md 与 <cwd>/.codebuddy/skills/**
 *   项目上下文 <cwd>/CODEBUDDY.md 等，8 000 字符截断
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const projectDir = argv.includes("--project") ? path.resolve(argv[argv.indexOf("--project") + 1]) : null;
const HOME_CFG = path.join(os.homedir(), ".codebuddy");

let issues = 0;
const ok = (label, cond, detail = "") => {
  console.log(`${cond ? "✓" : "✗"} ${label}${detail ? "  " + detail : ""}`);
  if (!cond) issues++;
};

const readFm = (text) => {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
};

function scanDir(dir, label, ext = [".md", ".mdc"]) {
  console.log(`\n── ${label}: ${dir}`);
  if (!fs.existsSync(dir)) {
    console.log("  · 目录不存在（这条通道没有内容）");
    return 0;
  }
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      n += scanDir(p, path.basename(dir) + "/" + entry.name, ext);
      continue;
    }
    if (!ext.some((e) => entry.name.endsWith(e))) continue;
    const text = fs.readFileSync(p, "utf8");
    const chars = text.length;
    const bytes = Buffer.byteLength(text, "utf8");
    const fm = readFm(text);
    const off = fm.enabled === "false";
    ok(`文件  ${entry.name}`, !off && chars <= 40000, `${bytes} B / ${chars} 字符${off ? " · enabled:false（不生效）" : ""}`);
    if (fm.paths) console.log(`     paths: ${fm.paths}（仅这些路径生效）`);
    n++;
  }
  return n;
}

console.log(`装机体检 · WorkBuddy 5.9.3 · 用户配置 ${HOME_CFG}\n`);

const rules = scanDir(path.join(HOME_CFG, "rules"), "用户规则 rules（常驻）");
const skillsDir = path.join(HOME_CFG, "skills");
console.log(`\n── 用户技能: ${skillsDir}`);
let skills = 0;
if (fs.existsSync(skillsDir)) {
  for (const d of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const p = path.join(skillsDir, d.name, "SKILL.md");
    if (!fs.existsSync(p)) {
      ok(`技能 ${d.name}`, false, "缺 SKILL.md");
      continue;
    }
    const text = fs.readFileSync(p, "utf8");
    const fm = readFm(text);
    ok(`技能 ${d.name}`, Boolean(fm.name && fm.description), `${Buffer.byteLength(text, "utf8")} B${fm.name ? " · " + fm.name : ""}`);
    if (!fm.description) console.log("     缺 description，模型不会主动加载");
    skills++;
  }
} else {
  console.log("  · 目录不存在");
}

if (projectDir) {
  scanDir(path.join(projectDir, ".codebuddy", "rules"), "项目规则 rules");
  for (const f of ["CODEBUDDY.md", path.join(".codebuddy", "CODEBUDDY.md"), "AGENTS.md"]) {
    const p = path.join(projectDir, f);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    ok(`项目上下文 ${f}`, text.length <= 8000, `${text.length} 字符${text.length > 8000 ? " · 会被截断到 8000" : ""}`);
  }
}

console.log(`\n── 结论`);
console.log(`常驻规则 ${rules} 条 · 技能 ${skills} 个`);
if (rules > 1) console.log("  ! 多条常驻规则会同时加载，档位可能重复定义，建议只留一条");
if (issues === 0) console.log("  路径与体积都没有问题。新开会话后跑行为探针确认生效。");
else console.log(`  ${issues} 处需要处理，按上面标 ✗ 的项修。`);

process.exit(issues ? 1 : 0);
