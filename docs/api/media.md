# 媒体管理 API

媒体管理 API 包括 OST（原声带）和 PV（宣传视频）的管理端点。

## OST API

### 获取 OST 列表

```http
GET /api/ost
```

获取 OST 列表，支持按游戏 ID 筛选。

### 获取单个 OST

```http
GET /api/ost/[id]
```

### 创建 OST

```http
POST /api/ost
```

### 更新 OST

```http
PUT /api/ost/[id]
```

### 删除 OST

```http
DELETE /api/ost/[id]
```

### OST 曲目管理

```http
GET /api/ost/songs          # 获取曲目列表
POST /api/ost/songs          # 添加曲目
PUT /api/ost/songs           # 更新曲目
DELETE /api/ost/songs        # 删除曲目
```

### 从外部源导入

#### Khinsider 导入

```http
POST /api/ost/khinsider
```

从 Khinsider 搜索并导入 OST 信息。

#### 网易云音乐导入

```http
POST /api/ost/netease
```

从网易云音乐导入 OST 信息。

### 歌曲转换

```http
POST /api/ost/convert-songs
```

转换歌曲格式或来源。

```http
GET /api/ost/search-convert
```

搜索可转换的歌曲资源。

### 下载 OST 封面

```http
POST /api/ost/download-image
```

下载 OST 封面图片到本地。

## PV API

### 获取 PV 列表

```http
GET /api/pv?gameId=<id>
```

按游戏 ID 获取 PV 列表。

### 获取单个 PV

```http
GET /api/pv/[id]
```

### 创建 PV

```http
POST /api/pv
```

### 更新 PV

```http
PUT /api/pv/[id]
```

### 删除 PV

```http
DELETE /api/pv/[id]
```

### 上传 PV 文件

```http
POST /api/pv/upload
```

上传本地视频文件作为 PV。
