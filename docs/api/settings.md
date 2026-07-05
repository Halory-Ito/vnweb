# 设置 API

设置 API 管理系统各项配置。

## 背景设置

```http
GET  /api/settings/background     # 获取背景设置
POST /api/settings/background     # 上传自定义背景
```

上传自定义背景时，文件保存到 `/assets/bg/custom/` 目录，以时间戳命名。

## 备份设置

```http
GET  /api/settings/backup         # 获取备份设置
POST /api/settings/backup         # 更新备份设置
```

## 游戏存档设置

```http
GET  /api/settings/game-save       # 获取存档设置
POST /api/settings/game-save       # 更新存档设置
```

支持配置全局游戏存档目录和开关状态，配置保存在 `app/config.json` 中。

## 代理设置

```http
GET  /api/settings/proxy          # 获取代理设置
POST /api/settings/proxy          # 更新代理设置
```

支持 HTTP、HTTPS、SOCKS 代理配置。代理设置会对所有通过 `api` 实例发起的请求生效。

## 字体设置

```http
GET  /api/settings/font           # 获取字体列表
POST /api/settings/font           # 设置项目字体
```

读取 Windows 系统字体并应用到项目界面。

## 主题 CSS

```http
GET  /api/settings/theme-css      # 获取主题 CSS 配置
POST /api/settings/theme-css      # 更新主题 CSS
```

## 云同步设置

```http
GET  /api/settings/cloud-sync     # 获取云同步设置
POST /api/settings/cloud-sync     # 更新云同步设置
```

管理云端数据同步配置，通过 `lib/cloud-sync-utils.ts` 实现。
