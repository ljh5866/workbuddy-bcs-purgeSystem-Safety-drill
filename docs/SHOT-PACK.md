# 素材包怎么落地

规则里的「媒体任务」只负责把一句话翻译成可执行的素材包。包到手之后，工序在外部。

## 包的格式

```json
{
  "shot_id": "01",
  "prompt": {
    "positive": ["city skyline at dawn", "glass curtain-wall towers", "..."],
    "negative": ["person", "text", "watermark", "..."]
  },
  "params": {
    "model": "default",
    "sampler": "default",
    "steps": 30,
    "cfg": 5.5,
    "seed": -1,
    "motion": 3,
    "fps": 24,
    "aspect_ratio": "16:9",
    "duration": "5s"
  },
  "shots": [
    { "t": "0-2s", "frame": "高空俯瞰天际线", "camera": "缓慢下降" },
    { "t": "2-5s", "frame": "幕墙特写", "camera": "横向平移" }
  ]
}
```

批量时让对方直接给 JSON，落到 `out\shots\`，一条镜头一个文件。这样做的好处是：改一版不用重写整段散文，只改字段。

## 三条落地路径

**本地 ComfyUI / SD WebUI** — 把 `positive` 用逗号拼起来粘进正向框，`negative` 拼起来粘进负向框；`steps`、`cfg`、`sampler`、`seed` 对应 KSampler 节点；视频类再加 `motion`（运动强度）和 `duration`。分辨率受显存限制，16:9 的 720p 在 12 GB 卡上通常是上限。

**第三方 API 或网页** — 可灵、即梦、Runway、Pika 这类，字段名不同但语义对得上：`prompt` → 文本框，`aspect_ratio` / `duration` → 下拉框，`seed` → 高级选项。网页端通常不支持 `motion` 以外的细粒度参数，API 端支持得更多。

**批量跑** — 写个循环读 `out\shots\*.json`，按顺序调 API，结果落 `out\frames\`。这一步可以让 WorkBuddy 直接写脚本，它现在会连异常处理和重试一起给。

## 迭代循环

生成不是一次性的，关键是**一次只改一个变量**：

| 现象 | 改哪个字段 |
| --- | --- |
| 构图不对 | `positive` 前三个 tag（顺序即权重） |
| 太亮/太暗 | `cfg`（先 ±0.5，别跳） |
| 细节糊 | `steps` +8，或换模型 |
| 运动太乱 | `motion` 降一档 |
| 画面漂移 | 固定 `seed`，只改提示词 |

固定 `seed` 之后改提示词，你看到的是"提示词的效果"；不固定 seed 改提示词，你看到的是随机性。这两件事经常被混在一起，是调参最大的坑。

## 后续工序

素材出来之后，WorkBuddy 还能接这几段：

- **字幕**：给它音频或脚本，出 SRT
- **配音稿**：按镜头时长压缩文案，标好断句
- **剪辑决策表**：哪段留、哪段切、转场用什么，出成表
- **封面**：从关键帧里选一帧做首图，或者按同一套提示词生成一张静的

剪辑本身（ffmpeg 拼接、调色、混音）它没有工具，得在本地跑。可以让它写命令：

```bash
ffmpeg -f concat -safe 0 -i list.txt -c copy out\final.mp4
```

## 别指望的

- 它不能替你看片子判断"好不好看"——那是你的审美判断，它只能按你的描述改参数。
- 它不知道你本地装了哪个模型，`model: default` 只是个占位，最终得你填。
- 同一个包换个模型出来完全不一样，跨模型别指望通用。
