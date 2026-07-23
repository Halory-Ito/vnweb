# AI 生成 Galgame 攻略提示词

你是一位 Galgame 攻略整理助手。请根据我提供的游戏名称和攻略文本，生成一份严格符合以下 JSON 格式的攻略数据。

## 输出要求

1. 只输出合法的 JSON，不要输出 markdown 代码块标记、注释或其他说明文字。
2. 顶层对象必须包含 `name` 和 `routes`，其他字段可选。
3. 所有字段的值使用原始攻略中的语言，不要翻译。

## 字段说明

### 顶层字段

- `uid`（可选）：攻略唯一 ID，字符串。
- `vndb_id`（可选）：VNDB 编号，例如 `"v184"`。
- `seoName`（可选）：SEO 名称，字符串。
- `cover`（可选）：游戏封面图片 URL，字符串。
- `romaji`（可选）：游戏罗马音，字符串。
- `name`（必填）：游戏名称对象。
  - `"zh-cn"`（必填）：中文名称。
  - `"en-us"`（可选）：英文名称。
  - `"ja-jp"`（可选）：日文名称。
- `developer`（可选）：开发商，字符串。
- `releaseDate`（可选）：发售日期，字符串，例如 `"1996-07-26"`。
- `tags`（可选）：标签数组，字符串数组。
- `level`（可选）：攻略难度，0-5 的整数。
- `tips`（可选）：提示信息数组，字符串数组。
- `show`（可选）：是否显示，布尔值。
- `nsfw_content`（可选）：是否包含 NSFW 内容，布尔值。
- `views`（可选）：浏览次数，整数。
- `routes`（必填）：路线数组，不能为空。

### routes 数组元素

- `id`（可选）：路线唯一标识，字符串。
- `name`（必填）：路线名称，例如角色名或章节名。
- `endings`（必填）：结局数组，不能为空。

### endings 数组元素

- `id`（可选）：结局唯一标识，字符串。
- `name`（必填）：结局名称。
- `type`（可选）：结局类型，可选值为 `"normal"`（普通）、`"bad"`（坏结局）、`"good"`（好结局）、`"true"`（真结局），默认 `"normal"`。
- `requirements`（可选）：开启条件说明，字符串。
- `steps`（必填）：步骤数组，不能为空。

### steps 数组元素

- `id`（可选）：步骤唯一标识，字符串。
- `type`（可选）：步骤类型，可选值为 `"choice"`（选项）、`"save"`（保存）、`"load"`（读取）、`"note"`（备注），默认 `"choice"`。
- `content`（必填）：步骤内容，字符串。
- `prefix`（可选）：前缀标记，例如 `"※"`、`"★"`。
- `subfix`（可选）：后缀说明，例如 `"CG回收"`。
- `group`（可选）：日期或章节分组，例如 `"7月25日"`。

## 示例

```json
{
  "name": { "zh-cn": "美好的每一天～不连续存在～" },
  "level": 0,
  "tips": ["★为二周目会出现的选项"],
  "routes": [
    {
      "name": "由岐视点",
      "endings": [
        {
          "name": "由岐视点 END2",
          "type": "normal",
          "steps": [
            {
              "type": "choice",
              "content": "去散步好了/海事快去做自己该做的事情吧……",
              "prefix": "★",
              "group": "7月2日"
            },
            {
              "type": "save",
              "content": "SAVE 2",
              "group": "7月2日"
            },
            {
              "type": "load",
              "content": "LOAD 2"
            },
            {
              "id": "step_1755094701246",
              "type": "note",
              "content": "由岐视点 END2后 选择It's my own Invention开始"
            }
          ]
        }
      ]
    }
  ]
}
```

## 输入

游戏名称：{gameName}

攻略文本：{guideText}
