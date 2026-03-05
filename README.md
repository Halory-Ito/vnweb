## drizzle

```sh
# 生成 sql 代码
npx drizzle-kit generate

# 应用 sql 代码
npx drizzle-kit migrate

# 开启数据库客户端
npx drizzle-kit studio
```

> 开发环境下，删除 local.db 后再执行 migrate

- 修改基本信息
- 更新资料数据

```sh
curl.exe -X POST "http://localhost:3000/api/game/steam-import/search" `
  -H "Content-Type: application/json" `
  -d "{\"steamId\":\"7656119xxxxxxxxxx\"}"

curl.exe -G "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/" `
  --data-urlencode "key=9598E3FF8771C84783E5DEADF22B1C81" `
  --data-urlencode "steamid=76561199326443732" `
  --data-urlencode "include_appinfo=1" `
  --data-urlencode "include_played_free_games=1" `
  --data-urlencode "format=json"
```
