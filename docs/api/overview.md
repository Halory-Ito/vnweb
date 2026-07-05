# API 概览

vnweb 的 API 层基于 Next.js App Router 的 Route Handlers 构建，所有 API 通过 `app/api/` 目录下的模块组织。

## 请求规范

### 基础 URL

所有 API 请求以 `/api` 为前缀。

### 请求客户端

使用项目封装的 `api` 实例（`lib/request-utils.ts`）发起请求：

```ts
import { api } from '@/lib/request-utils'

// GET 请求
const { data } = await api.get('/api/game/list')

// POST 请求
const { data } = await api.post('/api/game', { name: '游戏名称' })

// DELETE 请求
const { data } = await api.delete('/api/game/1')
```

> 不要在组件中直接使用 `fetch`，统一通过 `api` 实例发起请求。

### 响应格式

API 返回标准 JSON 格式，成功响应通常包含：

```json
{
  "data": {},
  "message": "操作成功"
}
```

错误响应包含错误信息和状态码。

## API 模块

| 模块     | 路径前缀              | 说明                      |
| -------- | --------------------- | ------------------------- |
| 游戏管理 | `/api/game`           | 游戏 CRUD、导入、批量操作 |
| 媒体管理 | `/api/ost`, `/api/pv` | OST 与 PV 管理            |
| 记录统计 | `/api/record`         | 游玩记录与统计            |
| 收藏夹   | `/api/collection`     | 收藏夹管理                |
| 扫描     | `/api/scan`           | 扫描目录管理              |
| 设置     | `/api/settings`       | 系统设置                  |
| 台词摘录 | `/api/quote`          | 台词管理                  |
| 图片代理 | `/api/proxy-image`    | 外部图片代理              |
| 插件市场 | `/api/market`         | 插件市场                  |
| 数据库   | `/api/db`             | 数据库操作                |
| 系统     | `/api/system`         | 系统级操作                |

## 代理支持

API 实例通过 `lib/request-utils.ts` 中的 `api` 对象统一管理，支持通过系统设置中的代理配置对所有 HTTP 请求进行代理转发。

## 相关文档

- [游戏管理 API](/api/game)
- [媒体管理 API](/api/media)
- [记录与统计 API](/api/record)
- [收藏夹 API](/api/collection)
- [扫描 API](/api/scan)
- [设置 API](/api/settings)
- [台词摘录 API](/api/quote)
