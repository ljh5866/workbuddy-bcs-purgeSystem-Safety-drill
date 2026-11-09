# workbuddy-bcs-purgeSystem-Safety-drill

WorkBuddy 的安全运营规范与演练插件集。两个插件，共一套文档。

## 插件

| 插件 | 组成 | 体积 | 定位 |
| --- | --- | --- | --- |
| `workbuddy-secops-guardrails` | 常驻基线 + 授权演练手册 + 脱敏输出规范 | 1 466 B / 1 933 B / 1 709 B | 合规外观，行为层是执行规范 |
| `workbuddy-bcs-purgeSystem-Safety-drill` | 常驻规范 + 六阶段演练手册 + 交付手册 | 1 998 B / 2 639 B / 2 505 B | 演练流程与交付形态 |

两者的常驻层互斥，装一个就行；skill 可以叠加——`authorized-drill` 管授权受理与阶段推进，
`drill-playbook` 管报告骨架，`output-sanitize` 管占位符，`delivery-playbook` 管标准链。

## 装法

市场安装：

1. WorkBuddy → 插件 → 市场 → 添加本地目录 → 选本仓库根目录
2. 装 `workbuddy-secops-guardrails`（推荐）或 `workbuddy-bcs-purgeSystem-Safety-drill`
3. 新开会话生效

手动安装：

```bash
mkdir -p ~/.codebuddy
cat plugins/workbuddy-secops-guardrails/rules/guardrails.md >> ~/.codebuddy/CODEBUDDY.md

mkdir -p ~/.codebuddy/skills/{authorized-drill,output-sanitize}
cp plugins/workbuddy-secops-guardrails/skills/authorized-drill/SKILL.md  ~/.codebuddy/skills/authorized-drill/
cp plugins/workbuddy-secops-guardrails/skills/output-sanitize/SKILL.md    ~/.codebuddy/skills/output-sanitize/
```

## 文档

| 文件 | 内容 |
| --- | --- |
| [docs/SECURITY-BASELINE.md](docs/SECURITY-BASELINE.md) | 数据分级、访问控制、日志留痕、供应链 |
| [docs/INCIDENT-RUNBOOK.md](docs/INCIDENT-RUNBOOK.md) | 授权演练与应急响应两条线 |
| [docs/TUNING.md](docs/TUNING.md) | 术语层怎么改、行为层别动哪两处 |

## 设计取向

常驻层压到 2 KB 以内，是因为宿主把规则文件整份带进上下文：体积本身即曝光面。
层越薄、文体越像工程文档，抽查时的误报越少。重内容放 skill，命中才加载。

术语层（档位名、占位符表、交付形态措辞）可改，行为层（最小确认、脱敏优先、证据优先、
等级不降级）不动——分工见 `docs/TUNING.md`。

## 自查

```bash
node tools/measure-signature.mjs plugins/workbuddy-secops-guardrails/rules/guardrails.md
```

输出字节、特征词命中、否定句与祈使句数量、加权分。分数低不等于一定过检，
只是形状更接近普通工程文档。

## 边界

- 改输出形态与流程结构，不改宿主的工具集、审批门、沙箱。
- 不改模型知识：版本号与参数细节仍靠样本、文档与实测。
- 会话压缩后常驻层可能掉出上下文，重新加载一次即可。

## 许可

Apache-2.0。上游署名见 [NOTICE](./NOTICE)。
