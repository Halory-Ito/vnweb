import { readFile } from "fs/promises";
import { extname, join, normalize } from "path";

const ADDONS_DIR = join(process.cwd(), "app", "addOns");

const MIME_TYPES: Record<string, string> = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
};

function toSafeFilePath(pathSegments: string[]) {
    const decodedSegments = pathSegments.map((segment) =>
        decodeURIComponent(segment)
    );

    const requestedPath = normalize(join(ADDONS_DIR, ...decodedSegments));
    const addonsRoot = normalize(
        `${ADDONS_DIR}${process.platform === "win32" ? "\\" : "/"}`,
    );

    if (!requestedPath.startsWith(addonsRoot)) {
        return null;
    }

    return requestedPath;
}

export async function GET(
    _request: Request,
    context: { params: Promise<{ path: string[] }> },
) {
    const { path } = await context.params;

    if (!path || path.length === 0) {
        return new Response("Not Found", { status: 404 });
    }

    const filePath = toSafeFilePath(path);

    if (!filePath) {
        return new Response("Bad Request", { status: 400 });
    }

    try {
        const file = await readFile(filePath);
        const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ||
            "application/octet-stream";

        return new Response(file, {
            headers: {
                "cache-control":
                    "public, max-age=3600, stale-while-revalidate=86400",
                "content-type": contentType,
            },
        });
    } catch {
        return new Response("Not Found", { status: 404 });
    }
}
