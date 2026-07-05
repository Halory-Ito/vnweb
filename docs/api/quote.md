# 台词摘录 API

台词摘录 API 提供台词的增删改查功能。

## 端点列表

### 获取台词列表

```http
GET /api/quote
```

**查询参数**：

| 参数          | 类型   | 说明           |
| ------------- | ------ | -------------- |
| `gameId`      | number | 按游戏 ID 筛选 |
| `characterId` | number | 按角色 ID 筛选 |
| `keyword`     | string | 关键字搜索     |
| `startDate`   | string | 起始日期       |
| `endDate`     | string | 结束日期       |
| `page`        | number | 页码           |
| `pageSize`    | number | 每页条数       |

### 获取单条台词

```http
GET /api/quote/[id]
```

### 创建台词

```http
POST /api/quote
```

**请求体**：

```json
{
  "gameId": 5,
  "characterId": 12,
  "content": "这是摘录的台词内容",
  "background": "这是台词出现的场景背景"
}
```

| 字段          | 类型   | 说明             |
| ------------- | ------ | ---------------- |
| `gameId`      | number | 游戏 ID（必填）  |
| `characterId` | number | 角色 ID（必填）  |
| `content`     | string | 台词内容（必填） |
| `background`  | string | 台词背景（可选） |

### 更新台词

```http
PUT /api/quote/[id]
```

### 删除台词

```http
DELETE /api/quote/[id]
```
