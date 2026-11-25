# 命令行工具

Windows 下在项目目录运行 `.\vnweb.bat`。如果通过 `init.bat` 将项目目录加入用户 `PATH`，可以在新终端中从任意目录使用 `vnweb`。

```powershell
vnweb                     # 启动已经构建的 Web 服务
vnweb --help              # 查看支持的命令
vnweb list game           # 列出游戏，也可写作 list g
vnweb list g -p 2 -s 10   # 查看第 2 页，每页 10 条
vnweb list collection     # 列出收藏夹，也可写作 list c
vnweb open "我的收藏"      # 按名称或 ID 查看收藏夹
vnweb search "白色相簿"    # 按名称搜索，可加 -p / -s 分页
vnweb start 12            # 按游戏 ID 启动并计时，也可写作 s 12
vnweb start               # 启动最近一次游玩的游戏
```

可先用 `list game` 或 `search` 找到游戏 ID。启动前在 Web 界面的游戏设置中确认可执行路径。计时界面可按 `q` 结束计时并保存记录。
