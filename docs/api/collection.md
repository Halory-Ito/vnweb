# 收藏夹 API

收藏夹 API 提供收藏夹的增删改查以及游戏关联管理。

## 端点列表

### 获取收藏夹列表

```http
GET /api/collection
```

获取所有收藏夹及其包含的游戏信息。

### 创建收藏夹

```http
POST /api/collection
```

**请求体**：

```json
{
  "name": "收藏夹名称"
}
```

### 更新收藏夹

```http
PUT /api/collection/[id]
```

**请求体**：

```json
{
  "name": "新名称"
}
```

### 删除收藏夹

```http
DELETE /api/collection/[id]
```

删除收藏夹，不删除关联的游戏。

### 管理收藏夹游戏

```http
GET /api/collection/[id]   # 获取收藏夹中的游戏列表
```

添加/移除游戏到收藏夹的操作通过游戏 API 实现。
