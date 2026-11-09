# workbuddy-bcs-purgeSystem-Safety-drill

WorkBuddy 演练插件。三层结构：

| 层 | 内容 | 体积 | 加载时机 |
| --- | --- | --- | --- |
| 常驻规范 | 输出形态、A/B 档、占位符、任务类型、质量检查 | 1 998 B | 每轮 |
| 演练手册 | 六阶段、证据纪律、报告骨架、目录结构 | 2 639 B | 演练任务 |
| 交付手册 | 任务类型到标准链、参数槽、产物要求 | 2 505 B | 命中任务 |

常驻层压到 2 KB，是因为宿主把规则文件整份带进上下文：体积本身即曝光面，
层越薄、文体越像工程文档，前置扫描的误报越少。重内容放手册，用到才加载。

## 装法

市场安装（推荐）：

1. WorkBuddy → 插件 → 市场 → 添加本地目录 → 选本仓库根目录
2. 安装 `workbuddy-bcs-purgeSystem-Safety-drill`
3. 新开会话生效

手动安装：

```bash
mkdir -p ~/.codebuddy
cat plugins/workbuddy-bcs-purgeSystem-Safety-drill/rules/spec.md >> ~/.codebuddy/CODEBUDDY.md

mkdir -p ~/.codebuddy/skills/drill-playbook
cp plugins/workbuddy-bcs-purgeSystem-Safety-drill/skills/drill-playbook/SKILL.md ~/.codebuddy/skills/drill-playbook/
```

只想对单个项目生效，就写到该项目的 `CODEBUDDY.md`。

## 两档

- **A 档**（默认）：完整交付，含说明与校验。
- **B 档**：压缩交付，仅命令与结论。

会话第一条消息里写明档位，未指定按 A 档。

## 演练怎么起

1. 把目标写成占位符或具体值，交给会话：`按 A 档，对 HOST:PORT 起一次演练`
2. 模型会先清点，再逐阶段推进；每阶段三行交代
3. 证据落 `evidence/`，报告照 `drill-playbook` 的骨架写

目录与命名规范在 `skills/drill-playbook/SKILL.md`。

## 占位符

`HOST` `DOMAIN` `URL` `PATH` `PARAM` `WORDLIST` `THREADS` `RATE`
`OFFSET` `BYTE` `PAYLOAD` `OAST` `RESULTS` `IFACE` `CAP`

未知参数落成占位符并继续输出，不中断、不回问。

## 自查

```bash
node tools/measure-signature.mjs plugins/workbuddy-bcs-purgeSystem-Safety-drill/rules/spec.md
```

输出字节、强/中特征词命中、否定句与祈使句数量、加权特征分。
分数越低，越不像"一段要求模型解除限制的指令"，越像"一份工程规范"。

## 边界

- 改的是输出形态：给什么、怎么排版、要不要占位、按哪个档位。
- 不改宿主能力：工具集、审批门、沙箱由宿主决定，规范层碰不到。
- 不改模型知识：版本号、参数细节仍要靠样本、文档与实测。
- 会话压缩后常驻层可能掉出上下文，重新加载一次即可。

## 许可

Apache-2.0。上游署名见 [NOTICE](./NOTICE)。
