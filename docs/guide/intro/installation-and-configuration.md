# 环境准备

## 运行环境

建议环境：

- Node.js 20+
- npm 10+
- Windows

之所以推荐 Windows，是因为项目包含本地字体读取、游戏进程监控、本地图标提取、本地文件浏览等能力，当前实现明显偏向 Windows 桌面环境。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编写配置文件

启动后打开「设置 → 平台」，填写所需的接口地址和凭证。设置保存在 `data/settings/platform.json`，首次读取时自动创建。

### 3. 初始化数据库

数据库默认为项目根目录的 `local.db`。可在 `data/settings/general.json` 中设置 `dbFileName`（例如 `file:./local.db`），修改后重启应用。

```bash
npx drizzle-kit generate # 生成 sql 文件
npx drizzle-kit migrate # 创建 sqlite 数据库（如没有），并生成表字段
```

### 4. 构建

```bash
npm run build
```

### 5. 环境变量

这里推荐将根目录下的`vnweb.bat`添加至环境变量中，然后你就可以在任意的位置执行系统的命令行工具：

```sh
# 1. 启动 web ui
vnweb

# 2. 查看帮助文档
vnweb --help

# 3. 查看游戏列表
vnweb list game

# 4. 根据名称搜索游戏
vnweb search game_name

# 5. 根据id启动游戏
vnweb start game_id

# 6. 快速启动上一次的游戏
vnweb start
```

# 配置文件

## 平台配置

可在 Web UI 修改平台配置。SteamGridDB 的密钥和接口地址可在 `data/settings/platform.json` 的 `steamgriddb` 中填写。

## 设置示例

`data/example/` 包含平台、外观、备份和通用设置的 JSON 示例。运行 `init.bat` 会将缺失的文件复制到 `data/settings/`，保留已有设置。手动安装时也可以按需复制。

# 项目启动

默认使用了`8999`端口，如果端口与其他服务冲突，可以修改`package.json`文件中的脚本：

```json
{
  "scripts": {
    "start": "next start -p 8999"
  }
}
```

将其中的`8999`修改为你想要的端口号（需要介于0和65535之间）
