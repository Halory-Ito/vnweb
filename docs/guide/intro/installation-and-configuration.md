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

见`app/config.example.ts`，填写好配置后，把该文件重命名为`config.ts`

其中`app/config.example.json`只需要拷贝一份，重命名为`config.json`即可，该`json`文件的具体配置可以在 Web UI 中修改

> 一开始还是用.env的，后来意识到这是一个本地软件，没必要搞.env，索性就换成 type-safe 高一点的配置方式了

### 3. 初始化数据库

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

## config.ts

详见`config.example.ts`文件

## config.example.json

这里主要用于一些非 api-key、token 之类的配置，目前支持：

- 游戏存档备份

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
