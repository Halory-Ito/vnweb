import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";

// 获取数据库路径
function getDbPath() {
    const dbUrl = process.env.DB_FILE_NAME?.trim() || "file:./local.db";
    // 如果是 file:./local.db 格式，提取路径
    if (dbUrl.startsWith("file:")) {
        return path.join(process.cwd(), dbUrl.replace("file:", ""));
    }
    return dbUrl;
}

// 获取 assets 目录路径
function getAssetsPath() {
    return path.join(process.cwd(), "public", "assets");
}

// 需要包含的 assets 子目录
const ASSET_DIRS = ["cover", "bg", "icon", "logo", "ost", "characters", "pv"];

export async function POST(_req: NextRequest) {
    try {
        // 创建归档
        const archive = archiver("zip", { zlib: { level: 9 } });

        // 设置响应头
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(
            0,
            19,
        );
        const fileName = `vnweb-backup-${timestamp}.zip`;

        const chunks: Uint8Array[] = [];
        archive.on("data", (chunk: Uint8Array) => {
            chunks.push(chunk);
        });

        // 1. 导出数据库
        const dbPath = getDbPath();
        if (fs.existsSync(dbPath)) {
            const dbBuffer = fs.readFileSync(dbPath);
            archive.append(dbBuffer, { name: "database/local.db" });
        }

        // 2. 导出 assets 目录
        const assetsPath = getAssetsPath();
        if (fs.existsSync(assetsPath)) {
            for (const dir of ASSET_DIRS) {
                const dirPath = path.join(assetsPath, dir);
                if (fs.existsSync(dirPath)) {
                    archive.directory(dirPath, `assets/${dir}`);
                }
            }
        }

        // 3. 添加备份元信息
        const backupInfo = {
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            description: "VNWeb Database Backup",
        };
        archive.append(JSON.stringify(backupInfo, null, 2), {
            name: "backup-info.json",
        });

        // 完成归档
        await new Promise<void>((resolve, reject) => {
            archive.on("end", () => resolve());
            archive.on("error", (err: Error) => reject(err));
            archive.finalize();
        });

        // 合并所有 chunks
        const totalLength = chunks.reduce(
            (sum, chunk) => sum + chunk.length,
            0,
        );
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return new NextResponse(result, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Export backup failed:", error);
        return NextResponse.json(
            { error: (error as Error).message || "导出备份失败" },
            { status: 500 },
        );
    }
}
