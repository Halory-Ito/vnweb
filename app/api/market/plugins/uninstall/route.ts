import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import { NextResponse } from "next/server";

const ADDONS_DIR = join(process.cwd(), "app", "addOns");

function normalizePluginId(input: unknown) {
    if (typeof input !== "string") {
        return "";
    }

    const trimmed = input.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return "";
    }

    return trimmed;
}

function setInstalledFalse(manifestContent: string) {
    if (/installed:\s*(true|false)/.test(manifestContent)) {
        return manifestContent.replace(
            /installed:\s*(true|false)/,
            "installed: false",
        );
    }

    return manifestContent.replace(
        /\n\s*};\s*$/,
        "\n    installed: false,\n};\n",
    );
}

export async function POST(request: Request) {
    try {
        const payload = (await request.json().catch(() => ({}))) as {
            id?: string;
        };

        const pluginId = normalizePluginId(payload.id);

        if (!pluginId) {
            return NextResponse.json({ error: "Invalid plugin id" }, {
                status: 400,
            });
        }

        const manifestPath = join(ADDONS_DIR, pluginId, "manifest.ts");
        const content = await readFile(manifestPath, "utf-8");
        const updated = setInstalledFalse(content);

        if (updated !== content) {
            await writeFile(manifestPath, updated, "utf-8");
        }

        return NextResponse.json({
            success: true,
            id: pluginId,
            installed: false,
        });
    } catch (error) {
        console.error("Uninstall plugin failed:", error);
        return NextResponse.json(
            { error: "Failed to uninstall plugin" },
            { status: 500 },
        );
    }
}
