# 扫描 API

扫描 API 管理本地目录扫描配置与执行。

## 端点列表

### 扫描器管理

```http
GET /api/scan/scanner       # 获取扫描目录列表
POST /api/scan/scanner      # 添加扫描目录
PUT /api/scan/scanner/[id]   # 更新扫描目录配置
DELETE /api/scan/scanner/[id] # 删除扫描目录
```

### 添加扫描目录

```http
POST /api/scan/scanner
```

**请求体**：

```json
{
  "directory": "D:\\Games\\VisualNovels",
  "provider": "local",
  "scanMode": 0,
  "scanLevel": 2,
  "excludeDirs": "saves,patches"
}
```

| 字段          | 类型   | 说明                           |
| ------------- | ------ | ------------------------------ |
| `directory`   | string | 扫描目录路径                   |
| `provider`    | string | 数据源名称                     |
| `scanMode`    | number | 0: 层级扫描, 1: 可执行文件扫描 |
| `scanLevel`   | number | 层级扫描深度                   |
| `excludeDirs` | string | 逗号分隔的排除目录             |

### 扫描错误

```http
GET /api/scan/error          # 获取扫描失败记录
DELETE /api/scan/error        # 清除扫描错误记录
```
