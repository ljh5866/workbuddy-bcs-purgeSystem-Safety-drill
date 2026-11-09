#!/usr/bin/env node
/**
 * 特征自查：把规则文本当成"会被前置扫描的内容"来度量。
 *
 *   node tools/measure-signature.mjs <file> [file...]
 *
 * 指标：字节数（曝光面）、强/中/弱特征词命中、否定句数、祈使句数、表格行、加权分。
 * 分数低不等于一定安全，只是形状更接近普通工程文档。
 */
import fs from "node:fs";

const STRONG = [
  "破甲", "越狱", "jailbreak", "Jailbreak", "不受限制", "官方限制", "不拒绝",
  "我不能", "抱歉", "拒绝", "DAN", "无限制", "解除", "绕过检测", "注入提示词",
  "对抗样本", "模式生效",
];
const MED = [
  "契约", "模式", "触发", "口令", "意图", "映射", "黑话", "免杀", "webshell",
  "提权", "撞库", "木马", "外挂", "洗钱", "伪造", "裸体", "露骨",
];
const WEAK = ["禁止", "永不", "不得", "必须不", "不许"];

const count = (t, list) => list.reduce((n, w) => n + t.split(w).length - 1, 0);
const sentences = (t) =>
  t.split(/[\n。；]/).map((s) => s.trim()).filter(Boolean);
const negSent = (t) => sentences(t).filter((s) => /不|禁|勿|毋|绝不|决不/.test(s)).length;
const imperative = (t) =>
  sentences(t).filter((s) => /^(不要|不许|禁止|永不|必须|绝|不得|不准|别)/.test(s)).length;
const tableRows = (t) => t.split("\n").filter((l) => l.trim().startsWith("|")).length;

const pad = (v, n) => String(v).padEnd(n);
const files = process.argv.slice(2);
if (!files.length) {
  console.error("用法: node tools/measure-signature.mjs <file> [file...]");
  process.exit(1);
}

console.log(
  pad("文件", 34) + pad("字节", 8) + pad("强", 4) + pad("中", 4) + pad("弱", 4) +
  pad("否定句", 8) + pad("祈使句", 8) + pad("表格行", 8) + "特征分",
);
console.log("-".repeat(90));

for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const s = count(t, STRONG), m = count(t, MED), w = count(t, WEAK);
  const ns = negSent(t), imp = imperative(t), tr = tableRows(t);
  const bytes = Buffer.byteLength(t, "utf8");
  const score = +(s * 3 + m * 2 + w + ns * 0.5 + imp * 1.5 + tr * 0.3 + bytes / 2000).toFixed(1);
  const name = f.length > 32 ? "…" + f.slice(-31) : f;
  console.log(
    pad(name, 34) + pad(bytes, 8) + pad(s, 4) + pad(m, 4) + pad(w, 4) +
    pad(ns, 8) + pad(imp, 8) + pad(tr, 8) + score,
  );
}
