import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const CUSTOM_CSS_PATH = path.join(process.cwd(), "app", "custom.css");
const MAX_CSS_SIZE = 1024 * 1024;

const readThemeCss = async () => {
    try {
        const content = await fs.readFile(CUSTOM_CSS_PATH, "utf-8");
        return NextResponse.json({ data: { content } });
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
            return NextResponse.json({ data: { content: "" } });
        }

        console.error("Read custom.css failed:", error);
        return NextResponse.json(
            { error: "读取主题文件失败" },
            { status: 500 },
        );
    }
};

const updateThemeCss = async (req: NextRequest) => {
    try {
        const payload = (await req.json().catch(() => ({}))) as {
            content?: string;
        };

        if (typeof payload.content !== "string") {
            return NextResponse.json({ error: "主题内容格式不合法" }, {
                status: 400,
            });
        }

        if (Buffer.byteLength(payload.content, "utf-8") > MAX_CSS_SIZE) {
            return NextResponse.json(
                { error: "主题内容过大（超过 1MB）" },
                { status: 400 },
            );
        }

        await fs.writeFile(CUSTOM_CSS_PATH, payload.content, "utf-8");

        return NextResponse.json({
            data: {
                saved: true,
            },
        });
    } catch (error) {
        console.error("Update custom.css failed:", error);
        return NextResponse.json(
            { error: "保存主题文件失败" },
            { status: 500 },
        );
    }
};

export { readThemeCss as GET, updateThemeCss as PUT };
