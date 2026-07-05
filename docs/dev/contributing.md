# 参与开发

欢迎为 vnweb 项目贡献代码！本文介绍开发流程和规范。

## 环境搭建

1. Fork 并克隆项目
2. 安装依赖：`npm install`
3. 复制配置文件：`cp app/config.example.ts app/config.ts`
4. 初始化数据库：`npx drizzle-kit generate && npx drizzle-kit migrate`
5. 启动开发服务器：`npm run dev`

## 代码规范

### 代码检查与格式化

项目使用 **oxlint** 进行代码检查，**oxfmt** 进行格式化：

```bash
npm run lint          # 检查代码
npm run lint:fix      # 自动修复
npm run fmt           # 格式化
npm run fmt:check     # 检查格式
```

### 测试

项目使用 **Vitest** 作为测试框架：

```bash
npm run test                # 运行测试（watch 模式）
npm run test:run            # 单次运行测试
npm run test:coverage       # 测试覆盖率
```

### TypeScript

项目全面使用 TypeScript，类型定义位于 `types/` 目录：

- `types/game-types.ts`
- `types/record-types.ts`
- `types/vndb-types.ts`

## 开发约定

### 添加新功能

1. 在 `features/` 下创建模块目录
2. 按模块结构组织 hooks、components、data、views
3. 在 `app/api/` 下添加对应的 API 端点
4. 如需新数据库表，在 `db/schema.ts` 中添加定义
5. 运行 `npx drizzle-kit generate` 生成迁移

### 添加新 API

1. 在 `app/api/<module>/route.ts` 中创建 Route Handler
2. 使用 Drizzle ORM 进行数据库操作
3. 返回标准 JSON 响应格式

### 添加新依赖

- 先确认现有依赖能否实现功能
- 优先使用原生 API 和项目已有的库
- 添加后更新 `package.json`

### 提交规范

- 提交前运行 `npm run lint` 和 `npm run fmt:check`
- 确保所有测试通过
- 更新 `plan.md` 标记完成的功能

## 项目架构

详见 [项目架构](/guide/architecture) 了解整体技术栈和目录结构。
