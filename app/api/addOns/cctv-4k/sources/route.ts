import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import { NextResponse } from "next/server";

type LiveSource = {
    id: string;
    name: string;
    url: string;
    priority: number;
    icon: string;
    valid: boolean;
    needProxy: boolean;
};

const SOURCE_FILE_PATH = join(
    process.cwd(),
    "app",
    "addOns",
    "cctv-4k",
    "source.json",
);

function sanitizeSource(input: Partial<LiveSource>): LiveSource | null {
    const id = typeof input.id === "string" ? input.id.trim() : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const url = typeof input.url === "string" ? input.url.trim() : "";

    if (!id || !name || !/^https?:\/\//i.test(url)) {
        return null;
    }

    return {
        id,
        name,
        url,
        priority: Number.isFinite(input.priority) ? Number(input.priority) : 0,
        icon: typeof input.icon === "string" ? input.icon.trim() : "",
        valid: typeof input.valid === "boolean" ? input.valid : true,
        needProxy: typeof input.needProxy === "boolean"
            ? input.needProxy
            : true,
    };
}

async function readSources() {
    try {
        const raw = await readFile(SOURCE_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as unknown;

        if (!Array.isArray(parsed)) {
            return [] as LiveSource[];
        }

        return parsed
            .map((item) => sanitizeSource(item as Partial<LiveSource>))
            .filter((item): item is LiveSource => Boolean(item))
            .sort((a, b) => b.priority - a.priority);
    } catch {
        return [] as LiveSource[];
    }
}

async function writeSources(sources: LiveSource[]) {
    await writeFile(
        SOURCE_FILE_PATH,
        `${JSON.stringify(sources, null, 2)}\n`,
        "utf-8",
    );
}

function normalizeId(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export async function GET() {
    const sources = await readSources();
    return NextResponse.json(sources);
}

export async function POST(request: Request) {
    try {
        const payload = (await request.json().catch(() => ({}))) as {
            name?: string;
            url?: string;
            priority?: number;
            icon?: string;
            valid?: boolean;
            needProxy?: boolean;
        };

        const name = typeof payload.name === "string"
            ? payload.name.trim()
            : "";
        const url = typeof payload.url === "string" ? payload.url.trim() : "";

        if (!name || !/^https?:\/\//i.test(url)) {
            return NextResponse.json(
                { error: "Invalid source payload" },
                { status: 400 },
            );
        }

        const sources = await readSources();
        const baseId = normalizeId(name || "source");
        let id = baseId || "source";
        let seed = 1;

        while (sources.some((item) => item.id === id)) {
            id = `${baseId}-${seed}`;
            seed += 1;
        }

        const newSource: LiveSource = {
            id,
            name,
            url,
            priority: Number.isFinite(payload.priority)
                ? Number(payload.priority)
                : 0,
            icon: typeof payload.icon === "string" ? payload.icon.trim() : "",
            valid: typeof payload.valid === "boolean" ? payload.valid : true,
            needProxy: typeof payload.needProxy === "boolean"
                ? payload.needProxy
                : true,
        };

        const merged = [...sources, newSource].sort((a, b) =>
            b.priority - a.priority
        );
        await writeSources(merged);

        return NextResponse.json({ success: true, source: newSource });
    } catch (error) {
        console.error("Create source failed:", error);
        return NextResponse.json(
            { error: "Failed to create source" },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request) {
    try {
        const payload = (await request.json().catch(() => ({}))) as {
            id?: string;
            name?: string;
            url?: string;
            priority?: number;
            icon?: string;
            valid?: boolean;
            needProxy?: boolean;
        };

        const id = typeof payload.id === "string" ? payload.id.trim() : "";
        const name = typeof payload.name === "string"
            ? payload.name.trim()
            : "";
        const url = typeof payload.url === "string" ? payload.url.trim() : "";

        if (!id || !name || !/^https?:\/\//i.test(url)) {
            return NextResponse.json(
                { error: "Invalid source payload" },
                { status: 400 },
            );
        }

        const sources = await readSources();
        const sourceIndex = sources.findIndex((item) => item.id === id);

        if (sourceIndex < 0) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 },
            );
        }

        const updated: LiveSource = {
            id,
            name,
            url,
            priority: Number.isFinite(payload.priority)
                ? Number(payload.priority)
                : 0,
            icon: typeof payload.icon === "string" ? payload.icon.trim() : "",
            valid: typeof payload.valid === "boolean" ? payload.valid : true,
            needProxy: typeof payload.needProxy === "boolean"
                ? payload.needProxy
                : true,
        };

        const merged = sources.map((item) => (item.id === id ? updated : item))
            .sort((a, b) => b.priority - a.priority);

        await writeSources(merged);

        return NextResponse.json({ success: true, source: updated });
    } catch (error) {
        console.error("Update source failed:", error);
        return NextResponse.json(
            { error: "Failed to update source" },
            { status: 500 },
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const payload = (await request.json().catch(() => ({}))) as {
            id?: string;
            ids?: string[];
        };

        const singleId = typeof payload.id === "string"
            ? payload.id.trim()
            : "";
        const ids = Array.isArray(payload.ids)
            ? payload.ids.filter((item): item is string =>
                typeof item === "string" && item.trim().length > 0
            ).map((item) => item.trim())
            : [];

        const targetIds = ids.length > 0 ? ids : singleId ? [singleId] : [];

        if (targetIds.length === 0) {
            return NextResponse.json(
                { error: "Invalid source id" },
                { status: 400 },
            );
        }

        const sources = await readSources();
        const targetSet = new Set(targetIds);
        const nextSources = sources.filter((item) => !targetSet.has(item.id));

        if (nextSources.length === sources.length) {
            return NextResponse.json(
                { error: "Source not found" },
                { status: 404 },
            );
        }

        await writeSources(nextSources);
        return NextResponse.json({ success: true, ids: targetIds });
    } catch (error) {
        console.error("Delete source failed:", error);
        return NextResponse.json(
            { error: "Failed to delete source" },
            { status: 500 },
        );
    }
}
