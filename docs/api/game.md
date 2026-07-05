# 游戏管理 API

游戏管理 API 提供游戏的增删改查、导入导出与批量操作功能。

## 端点列表

### 获取游戏列表

```http
GET /api/game/list
```

**查询参数**：

| 参数        | 类型   | 说明                |
| ----------- | ------ | ------------------- |
| `page`      | number | 页码                |
| `pageSize`  | number | 每页条数            |
| `sortBy`    | string | 排序字段            |
| `sortOrder` | string | 排序方向 (asc/desc) |
| `keyword`   | string | 搜索关键字          |

### 获取单个游戏

```http
GET /api/game/[id]
```

### 创建游戏

```http
POST /api/game
```

### 更新游戏

```http
PUT /api/game/[id]
```

### 删除游戏

```http
DELETE /api/game/[id]
```

### 批量操作

```http
POST /api/game/batch-nsfw
```

支持批量修改 NSFW 标记等操作。

### 筛选选项

```http
GET /api/game/filter-options
```

获取可用于筛选的选项列表（标签、类型、状态等）。

### 图片搜索

```http
GET /api/game/image-search
```

按图片搜索游戏信息。

### 元数据批量更新

```http
POST /api/game/metadata-batch
```

批量更新游戏元数据。

## 外部导入

### VNDB 导入

```http
POST /api/game/vndb-import
```

从 VNDB 导入游戏信息与角色数据。

### Steam 导入

```http
POST /api/game/steam-import
```

从 Steam 导入游戏信息。

### Bangumi 导入

```http
POST /api/game/bangumi-import
```

从 Bangumi 导入游戏信息。

### 第三方导入

```http
POST /api/game/third-party-import
```

统一的外部数据源导入入口。

### Ymgal 导入

```http
POST /api/game/ymgal-import
```

从 Ymgal 导入游戏信息。

### 图标提取

```http
POST /api/game/extract-icon
```

从游戏可执行文件中提取图标。

## 侧边栏

```http
GET /api/game/sidebar
```

获取侧边栏所需的游戏列表数据。

## 合并游戏

```http
POST /api/game/merge
```

合并重复的游戏条目。
