import { beforeEach, describe, expect, test, vi } from "vitest";

type ZipEntry = {
    entryName: string;
    isDirectory: boolean;
    getData: () => Buffer;
};

const mocks = vi.hoisted(() => {
    const state = {
        entries: [] as ZipEntry[],
        accessExists: false,
        existingManifest: "",
    };

    const access = vi.fn(async () => {
        if (!state.accessExists) {
            throw new Error("ENOENT");
        }
    });
    const mkdir = vi.fn(async () => undefined);
    const readFile = vi.fn(async () => state.existingManifest);
    const rm = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    class MockZip {
        constructor(_buffer: Buffer) {}
        getEntries() {
            return state.entries;
        }
    }

    return {
        state,
        access,
        mkdir,
        readFile,
        rm,
        writeFile,
        MockZip,
    };
});

vi.mock("adm-zip", () => ({
    default: mocks.MockZip,
}));

vi.mock("fs/promises", () => ({
    access: mocks.access,
    mkdir: mocks.mkdir,
    readFile: mocks.readFile,
    rm: mocks.rm,
    writeFile: mocks.writeFile,
}));

import { POST } from "@/app/api/market/plugins/import/route";

const makeZipFile = () =>
    new File([new Uint8Array([1, 2, 3])], "plugin.zip", {
        type: "application/zip",
    });

const createRequest = (params: {
    action?: string;
    overwrite?: boolean;
    file?: File | null;
}): Request => {
    const formData = new FormData();
    formData.set("action", params.action ?? "preview");
    formData.set("overwrite", String(params.overwrite ?? false));
    if (params.file) {
        formData.set("file", params.file);
    }

    return {
        formData: async () => formData,
    } as Request;
};

const entry = (name: string, content: string | Uint8Array): ZipEntry => ({
    entryName: name,
    isDirectory: false,
    getData: () =>
        typeof content === "string"
            ? Buffer.from(content, "utf-8")
            : Buffer.from(content),
});

const dirEntry = (name: string): ZipEntry => ({
    entryName: name,
    isDirectory: true,
    getData: () => Buffer.from([]),
});

describe("app/api/market/plugins/import POST", () => {
    beforeEach(() => {
        mocks.state.entries = [];
        mocks.state.accessExists = false;
        mocks.state.existingManifest = "";

        mocks.access.mockClear();
        mocks.mkdir.mockClear();
        mocks.readFile.mockClear();
        mocks.rm.mockClear();
        mocks.writeFile.mockClear();
    });

    test("returns 400 when file is missing", async () => {
        const response = await POST(createRequest({ file: null }));
        expect(response.status).toBe(400);
    });

    test("returns 400 when file is not zip", async () => {
        const file = new File([new Uint8Array([1])], "plugin.txt", {
            type: "text/plain",
        });

        const response = await POST(createRequest({ file }));
        expect(response.status).toBe(400);
    });

    test("returns 500 when zip has no manifest", async () => {
        mocks.state.entries = [entry("plugin-a/readme.md", "hello")];

        const response = await POST(createRequest({ file: makeZipFile() }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("manifest.ts");
    });

    test("returns 500 when manifest content is invalid", async () => {
        mocks.state.entries = [
            entry("plugin-a/manifest.ts", `export default { id: "plugin-a" };`),
        ];

        const response = await POST(createRequest({ file: makeZipFile() }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("解析失败");
    });

    test("returns 500 when plugin id is invalid", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "bad id", name: "Plugin A" };`,
            ),
        ];

        const response = await POST(createRequest({ file: makeZipFile() }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("id 不合法");
    });

    test("returns preview data for valid zip", async () => {
        // Step 1: 准备 zip 中的 manifest 与图标。
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A", description: "D", version: "1.0.0", icon: "icon.png", authors: ["Alice"] };`,
            ),
            entry("plugin-a/icon.png", new Uint8Array([137, 80, 78, 71])),
        ];

        // Step 2: 调用预览。
        const response = await POST(
            createRequest({ action: "preview", file: makeZipFile() }),
        );
        const body = await response.json();

        // Step 3: 断言预览阶段输出。
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.stage).toBe("preview");
        expect(body.plugin.id).toBe("plugin-a");
    });

    test("returns preview stage when action is omitted", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A", icon: "https://img/x.png" };`,
            ),
        ];

        const response = await POST(createRequest({ file: makeZipFile() }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.stage).toBe("preview");
        expect(body.plugin.previewIconUrl).toBe("https://img/x.png");
    });

    test("returns 409 when import conflicts without overwrite", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A" };`,
            ),
        ];
        mocks.state.accessExists = true;
        mocks.state.existingManifest =
            'export default { id: "plugin-a", name: "Old" };';

        const response = await POST(
            createRequest({
                action: "import",
                overwrite: false,
                file: makeZipFile(),
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.conflict).toBe(true);
    });

    test("imports files when conflict absent", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A", icon: "" };`,
            ),
            dirEntry("plugin-a/assets"),
            entry("plugin-a/readme.md", "hello"),
            entry("plugin-a/../evil.txt", "x"),
        ];

        const response = await POST(
            createRequest({
                action: "import",
                overwrite: false,
                file: makeZipFile(),
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.stage).toBe("import");
        expect(mocks.mkdir).toHaveBeenCalled();
        expect(mocks.writeFile).toHaveBeenCalled();
    });

    test("imports with overwrite and marks overwritten", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A" };`,
            ),
            entry("plugin-a/readme.md", "hello"),
        ];
        mocks.state.accessExists = true;

        const response = await POST(
            createRequest({ action: "import", overwrite: true, file: makeZipFile() }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.overwritten).toBe(true);
        expect(mocks.rm).toHaveBeenCalledTimes(1);
    });

    test("maps EEXIST mkdir error to 409", async () => {
        mocks.state.entries = [
            entry(
                "plugin-a/manifest.ts",
                `export default { id: "plugin-a", name: "Plugin A" };`,
            ),
        ];
        mocks.mkdir.mockRejectedValueOnce(new Error("EEXIST: file already exists"));

        const response = await POST(
            createRequest({ action: "import", overwrite: false, file: makeZipFile() }),
        );
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error).toContain("同名插件已存在");
    });
});
