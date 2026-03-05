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

- 支持自定义字体（从本地和从网络），字体需要移动到 `public/fonts` 目录中
- 支持自定义字体大小、粗细
- 支持自定义背景（有开关，默认为关，表示背景图片会设置为上一次的游戏背景；如果开启的话，只要没有进入game-info界面，那么背景永远都是自定义的）
