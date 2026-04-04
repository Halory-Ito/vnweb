import AdmZip from "adm-zip";
import { access, mkdir, readFile, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";

import { NextResponse } from "next/server";

type ManifestPreview = {
    id: string;
    name: string;
    description: string;
    version: string;
    icon: string;
    authors: string[];
    previewIconUrl?: string;
};

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

function parseManifestContent(content: string): ManifestPreview | null {
    const idMatch = content.match(/id:\s*["']([^"']+)["']/);
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    const descMatch = content.match(/description:\s*["']([^"']*)["']/);
    const versionMatch = content.match(/version:\s*["']([^"']+)["']/);
    const iconMatch = content.match(/icon:\s*["']([^"']*)["']/);
    const authorsBlockMatch = content.match(/authors:\s*\[([^\]]*)\]/);

    if (!idMatch || !nameMatch) {
        return null;
    }

    const authorsValue = authorsBlockMatch ? authorsBlockMatch[1] : "";
    const authors = authorsValue
        ? [...authorsValue.matchAll(/["']([^"']+)["']/g)].map((match) =>
            match[1]
        )
        : [];

    return {
        id: idMatch[1],
        name: nameMatch[1],
        description: descMatch ? descMatch[1] : "",
        version: versionMatch ? versionMatch[1] : "0.0.0",
        icon: iconMatch ? iconMatch[1] : "",
        authors,
    };
}

function normalizeEntryPath(entryName: string) {
    return entryName.replace(/\\/g, "/").replace(/^\/+/, "");
}

function findManifestEntry(zip: AdmZip) {
    const manifestEntries = zip
        .getEntries()
        .filter((entry) =>
            !entry.isDirectory && /(^|\/)manifest\.ts$/.test(entry.entryName)
        );

    if (manifestEntries.length === 0) {
        return null;
    }

    manifestEntries.sort((a, b) =>
        a.entryName.split("/").length - b.entryName.split("/").length
    );

    return manifestEntries[0];
}

function getManifestRootPrefix(manifestEntryPath: string) {
    const normalized = normalizeEntryPath(manifestEntryPath);
    if (!normalized.includes("/")) {
        return "";
    }

    return normalized.slice(0, normalized.lastIndexOf("/") + 1);
}

function isUnsafePath(relativePath: string) {
    return relativePath.split("/").some((segment) => segment === "..");
}

function getMimeTypeByFileName(fileName: string) {
    const lower = fileName.toLowerCase();

    if (lower.endsWith(".png")) {
        return "image/png";
    }

    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        return "image/jpeg";
    }

    if (lower.endsWith(".webp")) {
        return "image/webp";
    }

    if (lower.endsWith(".gif")) {
        return "image/gif";
    }

    if (lower.endsWith(".svg")) {
        return "image/svg+xml";
    }

    return "application/octet-stream";
}

function normalizeManifestIconPath(iconPath: string, pluginId: string) {
    let normalized = iconPath.trim().replace(/^\.\//, "").replace(/^\//, "");

    if (normalized.startsWith("addOns/")) {
        normalized = normalized.slice("addOns/".length);
    }

    if (normalized.startsWith(`${pluginId}/`)) {
        normalized = normalized.slice(pluginId.length + 1);
    }

    return normalized;
}

function findZipEntryByPath(zip: AdmZip, candidatePath: string) {
    const normalizedCandidate = normalizeEntryPath(candidatePath);

    return zip
        .getEntries()
        .find((entry) =>
            !entry.isDirectory &&
            normalizeEntryPath(entry.entryName) === normalizedCandidate
        );
}

function buildPreviewIconUrl(
    zip: AdmZip,
    rootPrefix: string,
    manifest: ManifestPreview,
) {
    const iconValue = manifest.icon.trim();

    if (!iconValue) {
        return "";
    }

    if (
        iconValue.startsWith("http://") ||
        iconValue.startsWith("https://") ||
        iconValue.startsWith("data:")
    ) {
        return iconValue;
    }

    const normalizedIconPath = normalizeManifestIconPath(
        iconValue,
        manifest.id,
    );

    if (!normalizedIconPath || isUnsafePath(normalizedIconPath)) {
        return "";
    }

    const candidates = [
        `${rootPrefix}${normalizedIconPath}`,
        normalizedIconPath,
    ];

    for (const candidate of candidates) {
        const entry = findZipEntryByPath(zip, candidate);
        if (!entry) {
            continue;
        }

        const mimeType = getMimeTypeByFileName(entry.entryName);
        const base64 = entry.getData().toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }

    return "";
}

async function getUploadFromRequest(request: Request) {
    const formData = await request.formData();
    const action = (formData.get("action") as string | null) ?? "preview";
    const overwrite = formData.get("overwrite") === "true";
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return { action, overwrite, file: null };
    }

    return { action, overwrite, file };
}

async function buildZipContext(file: File) {
    const zipBuffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    const manifestEntry = findManifestEntry(zip);

    if (!manifestEntry) {
        throw new Error("压缩包中未找到 manifest.ts");
    }

    const manifestContent = manifestEntry.getData().toString("utf-8");
    const manifest = parseManifestContent(manifestContent);

    if (!manifest) {
        throw new Error("manifest.ts 解析失败，请检查 id 和 name 字段");
    }

    const normalizedId = normalizePluginId(manifest.id);
    if (!normalizedId) {
        throw new Error("manifest.ts 中的 id 不合法，仅支持字母、数字、_、-");
    }

    const rootPrefix = getManifestRootPrefix(manifestEntry.entryName);

    return {
        zip,
        manifest: {
            ...manifest,
            id: normalizedId,
        },
        rootPrefix,
    };
}

async function hasPluginConflict(pluginId: string) {
    const targetRoot = join(ADDONS_DIR, pluginId);

    try {
        await access(targetRoot);
        return true;
    } catch {
        return false;
    }
}

async function getExistingPluginPreview(pluginId: string) {
    const manifestPath = join(ADDONS_DIR, pluginId, "manifest.ts");

    try {
        const content = await readFile(manifestPath, "utf-8");
        return parseManifestContent(content);
    } catch {
        return null;
    }
}

async function importPluginFiles(
    zip: AdmZip,
    rootPrefix: string,
    pluginId: string,
    overwrite: boolean,
) {
    const targetRoot = join(ADDONS_DIR, pluginId);

    if (overwrite) {
        await rm(targetRoot, { recursive: true, force: true });
    }

    await mkdir(targetRoot, { recursive: false });

    const entries = zip.getEntries();

    for (const entry of entries) {
        const normalizedEntry = normalizeEntryPath(entry.entryName);

        if (rootPrefix && !normalizedEntry.startsWith(rootPrefix)) {
            continue;
        }

        const relativePath = rootPrefix
            ? normalizedEntry.slice(rootPrefix.length)
            : normalizedEntry;

        if (!relativePath || isUnsafePath(relativePath)) {
            continue;
        }

        const destinationPath = join(targetRoot, relativePath);

        if (entry.isDirectory) {
            await mkdir(destinationPath, { recursive: true });
            continue;
        }

        await mkdir(dirname(destinationPath), { recursive: true });
        await writeFile(destinationPath, entry.getData());
    }
}

export async function POST(request: Request) {
    try {
        const { action, overwrite, file } = await getUploadFromRequest(request);

        if (!file) {
            return NextResponse.json({ error: "请先上传插件压缩文件" }, {
                status: 400,
            });
        }

        if (!file.name.toLowerCase().endsWith(".zip")) {
            return NextResponse.json({ error: "仅支持 .zip 压缩文件" }, {
                status: 400,
            });
        }

        const { zip, manifest, rootPrefix } = await buildZipContext(file);
        const previewIconUrl = buildPreviewIconUrl(zip, rootPrefix, manifest);
        const previewPlugin = {
            ...manifest,
            previewIconUrl,
        };
        const conflict = await hasPluginConflict(manifest.id);
        const existingPlugin = conflict
            ? await getExistingPluginPreview(manifest.id)
            : null;

        if (action !== "import") {
            return NextResponse.json({
                success: true,
                stage: "preview",
                plugin: previewPlugin,
                conflict,
                existingPlugin,
            });
        }

        if (conflict && !overwrite) {
            return NextResponse.json(
                {
                    error: "检测到同名插件，是否覆盖现有插件？",
                    conflict: true,
                    plugin: previewPlugin,
                    existingPlugin,
                },
                { status: 409 },
            );
        }

        await importPluginFiles(zip, rootPrefix, manifest.id, overwrite);

        return NextResponse.json({
            success: true,
            stage: "import",
            plugin: previewPlugin,
            conflict,
            existingPlugin,
            overwritten: conflict && overwrite,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "导入插件失败";

        if (/EEXIST/.test(message)) {
            return NextResponse.json(
                { error: "同名插件已存在，请先移除或修改插件 id" },
                { status: 409 },
            );
        }

        console.error("Import plugin failed:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
