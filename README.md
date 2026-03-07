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

- [x] 在【设置-外观-字体】一栏中，支持自定义字体（读取本地的系统字体和用户安装的字体目录，找到字体文件，字体文件需要移动到 `public/fonts` 目录中），其中，在选择字体的时候，应该出现一个弹窗，用一段文本来预览字体，以供用户选择；支持自定义字体大小、粗细
- [x] 在【设置-外观-背景】一栏中，支持自定义背景（有开关，默认为关，表示背景图片会设置为上一次的游戏背景；如果开启的话，只要没有进入game-info界面，那么背景永远都是自定义的）
