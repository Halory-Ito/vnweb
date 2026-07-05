# 记录与统计 API

记录与统计 API 提供游玩记录的查询和统计分析功能。

## 端点列表

### 时间线

```http
GET /api/record/timeline
```

获取游玩时间线数据，按时间顺序展示所有游玩记录。

### 月报告

```http
GET /api/record/month-report
```

获取月度游玩统计报告，包含本月每日游玩时长分布。

### 年报告

```http
GET /api/record/year-report
```

获取年度游玩统计报告，包含全年各月游玩时长分布。

### 概览

```http
GET /api/record/overview
```

获取游玩概览数据，包括总时长、总次数、游戏数量等汇总指标。

### 导出

```http
GET /api/record/export
```

导出游玩记录为 Excel 文件（.xlsx 格式）。

## 查询参数

各端点通用查询参数：

| 参数        | 类型   | 说明           |
| ----------- | ------ | -------------- |
| `startDate` | string | 起始日期       |
| `endDate`   | string | 结束日期       |
| `gameId`    | number | 按游戏 ID 筛选 |

## 数据格式

### 游玩记录

```json
{
  "id": 1,
  "gameId": 5,
  "playTime": 3600,
  "playDate": "2024-01-15"
}
```

### 统计摘要

```json
{
  "totalPlayTime": 126000,
  "totalPlayCount": 42,
  "totalGames": 15,
  "averagePlayTime": 3000,
  "mostPlayedGame": {
    "gameId": 5,
    "name": "游戏名称",
    "totalTime": 36000
  }
}
```
