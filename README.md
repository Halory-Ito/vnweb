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

- 获取到的游戏封面、背景、图标和徽标需要存放在本地，文件名格式分别为：游戏名*发行日期\_cover.后缀、游戏名*发行日期*bg.后缀、游戏名*发行日期*icon.后缀、游戏名*发行日期\_logo.后缀
- 游戏tags做成outlined风格
- 游戏的基本信息和附加信息的值，也做成 tags
