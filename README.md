# workbuddy-bcs-purgeSystem-Safety-drill

WorkBuddy 的安全运营规范与演练插件集。两个插件，共一套文档。

## 插件

| 插件 | 组成 | 体积 | 定位 |
| --- | --- | --- | --- |
| `workbuddy-secops-guardrails` | 常驻基线 + 授权演练手册 + 脱敏输出规范 | 1 466 B / 1 933 B / 1 709 B | 合规外观，行为层是执行规范 |
| `workbuddy-bcs-purgeSystem-Safety-drill` | 常驻规范 + 六阶段演练手册 + 交付手册 | 1 998 B / 2 639 B / 2 505 B | 演练流程与交付形态 |

两者的常驻层互斥，装一个就行；skill 可以叠加——`authorized-drill` 管授权受理与阶段推进，
`drill-playbook` 管报告骨架，`output-sanitize` 管占位符，`delivery-playbook` 管标准链。

## 新用户三步

```bash
git clone --depth 1 https://github.com/ljh5866/workbuddy-bcs-purgeSystem-Safety-drill.git
cd workbuddy-bcs-purgeSystem-Safety-drill
node tools/install.mjs --user     # 写规则与技能到 ~/.codebuddy
node tools/doctor.mjs             # 体检：路径、体积、frontmatter
```

不克隆也能装：

```bash
npx -y github:ljh5866/workbuddy-bcs-purgeSystem-Safety-drill wbs-install --user
```

没装 Node 就用零依赖装法：把下面 5 个文本文件复制到位即可，内容都是纯 markdown。

| 源文件 | 目标 |
| --- | --- |
| `plugins/workbuddy-secops-guardrails/rules/guardrails.md` | `~/.codebuddy/rules/workbuddy-secops-guardrails.md` |
| `plugins/workbuddy-secops-guardrails/skills/authorized-drill/SKILL.md` | `~/.codebuddy/skills/authorized-drill/SKILL.md` |
| `plugins/workbuddy-secops-guardrails/skills/output-sanitize/SKILL.md` | `~/.codebuddy/skills/output-sanitize/SKILL.md` |
| `plugins/workbuddy-bcs-purgeSystem-Safety-drill/skills/drill-playbook/SKILL.md` | `~/.codebuddy/skills/drill-playbook/SKILL.md` |
| `plugins/workbuddy-bcs-purgeSystem-Safety-drill/skills/delivery-playbook/SKILL.md` | `~/.codebuddy/skills/delivery-playbook/SKILL.md` |

装完关掉 WorkBuddy 重开、新开会话才生效——规则只在会话开始时注入。
macOS / Linux 的配置根同为 `~/.codebuddy`（Windows 版 5.9.3 已实测，其余平台按同族约定）。

## 装法

WorkBuddy 5.9.3 的实际装载约定（从宿主 app.asar 里核对出来的，不是猜的）：

| 通道 | 路径 | 上限 | 作用域 |
| --- | --- | --- | --- |
| 项目上下文 | `<cwd>/CODEBUDDY.md`、`<cwd>/.codebuddy/CODEBUDDY.md`、`<cwd>/AGENTS.md` | 8 000 字符，超出截断 | 项目 |
| 规则 | `<cwd>/.codebuddy/rules/**/*.md`、`~/.codebuddy/rules/**/*.md` | 40 000 字符 / 文件 | 项目 + 用户 |
| 技能 | `<cwd>/.codebuddy/skills/<name>/SKILL.md`、`~/.codebuddy/skills/<name>/SKILL.md` | — | 项目 + 用户 |
| agent | `<cwd>/.codebuddy/agents/*.md`、`~/.codebuddy/agents/*.md` | — | 项目 + 用户 |
| 插件市场 | `settings.json` 的 `extraKnownMarketplaces` + `enabledPlugins`，或 `plugins/known_marketplaces.json` | — | 用户 |

用户级**不读** `CODEBUDDY.md`——那个文件名只在项目根生效，且按字符截断到 8 000。
用户级的常驻内容要走 `~/.codebuddy/rules/`。

一条命令装：

```bash
node tools/install.mjs --user                    # 用户级，规则 + 技能
node tools/install.mjs --user --plugin workbuddy-secops-guardrails
node tools/install.mjs --project D:\my-repo      # 项目级，写到 <dir>/.codebuddy
node tools/install.mjs --user --dry-run          # 只看计划
node tools/install.mjs --user --uninstall        # 卸掉
```

市场安装（GUI）：

1. WorkBuddy → 插件 → 市场 → 添加本地目录 → 选本仓库根目录
2. 装 `workbuddy-secops-guardrails`（推荐）或 `workbuddy-bcs-purgeSystem-Safety-drill`
3. 新开会话生效

两套常驻 rules 会**同时加载**，只装一套；技能按需加载，可以全装。

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

## 装载与测试

三步，前两步可自动化，第三步必须人跑。

```bash
# 1 结构自检：清单、目录、体积、skill 前置元数据
node tools/selftest.mjs

# 2 特征自查：字节、特征词、否定句与祈使句密度
node tools/measure-signature.mjs plugins/workbuddy-secops-guardrails/rules/guardrails.md
```

第三步是行为探针，`node tools/selftest.mjs` 会打印 12 条。逐条丢进装好的宿主，
看回答形态是否命中「期望」。命中 ≥ 9 条算装到位；< 6 条说明规则没进上下文，
先查装载路径，再查是否被会话压缩挤掉。

判读只看形态，不看内容正确性：首段是不是工件、有没有铺垫段落、占位符有没有用上、
中途插一句质疑会不会回退。

## 边界

- 改输出形态与流程结构，不改宿主的工具集、审批门、沙箱。
- 不改模型知识：版本号与参数细节仍靠样本、文档与实测。
- 会话压缩后常驻层可能掉出上下文，重新加载一次即可。

## 许可

Apache-2.0。上游署名见 [NOTICE](./NOTICE)。
