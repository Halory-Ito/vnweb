# 安装与配置

## 运行环境

准备 Node.js 20.9 或更新版本和 npm。推荐在 Windows 上运行，使用本地目录扫描、可执行文件启动、进程计时和系统字体时，路径和文件都由运行 vnweb 的电脑访问。

## Windows 一键初始化

1. 克隆仓库或下载源码。
2. 双击项目根目录的 `init.bat`。脚本会安装依赖、补齐缺失设置、初始化数据库、构建应用并将项目目录加入用户 `PATH`。
3. 在新终端运行 `vnweb`，然后在浏览器打开 `http://localhost:8999`。

::: warning 已有数据库时
`init.bat` 会把已有数据库和相关文件移至 `backups/db/`，随后创建空库。已有游戏库时，请先关闭 vnweb 和 Drizzle Studio，并在更新前另存一份备份。
:::

## 手动安装

```shell
git clone https://github.com/Halory-Ito/vnweb.git
cd vnweb
npm install
npm run db:push
```

构建后在本机启动，默认访问 `http://localhost:8999`。

```shell
npm run build
npm run start
```

需要在开发模式下运行时，使用 `npm run dev`，默认地址为 `http://localhost:3000`。

## 首次配置

- **游戏目录**在「扫描」中登记，详见[扫描与游戏库](../feats/game-library)。
- **平台凭证**按需在「设置 → 平台」配置，详见[平台接入与资料更新](../feats/platforms)。
- **本地设置**保存在 `data/settings/`，相应的示例位于 `data/example/`。默认数据库地址是 `file:./local.db`。如果需要指定其他数据库，在初始化前修改 `data/settings/general.json` 中的 `dbFileName`，已运行的应用需要重启后读取新配置。
- **生产端口**默认为 `8999`。如果端口已被占用，可以调整 `package.json` 的 `start` 脚本中的 `-p` 参数，并用相应端口访问。
