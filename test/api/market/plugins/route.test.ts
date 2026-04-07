import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const readdir = vi.fn();
    const readFile = vi.fn();
    return { readdir, readFile };
});

vi.mock("fs/promises", () => ({
    readdir: mocks.readdir,
    readFile: mocks.readFile,
}));

import { GET } from "@/app/api/market/plugins/route";

const dir = (name: string, isDirectory: boolean) => ({
    name,
    isDirectory: () => isDirectory,
});

describe("app/api/market/plugins GET", () => {
    beforeEach(() => {
        mocks.readdir.mockReset();
        mocks.readFile.mockReset();
    });

    test("returns parsed plugins and normalizes local icon url", async () => {
        // Step 1: 准备目录与 manifest 内容。
        mocks.readdir.mockResolvedValueOnce([
            dir("plugin-a", true),
            dir("README.md", false),
        ]);
        mocks.readFile.mockResolvedValueOnce(`
            export default {
                id: "plugin-a",
                name: "Plugin A",
                description: "desc",
                version: "1.2.3",
                icon: "./icons/a b.png",
                authors: ["Alice", "Bob"],
                installed: true,
            };
        `);

        // Step 2: 调用路由。
        const response = await GET();
        const body = await response.json();

        // Step 3: 断言解析结果与 icon URL 编码。
        expect(response.status).toBe(200);
        expect(body).toEqual([
            {
                id: "plugin-a",
                name: "Plugin A",
                description: "desc",
                version: "1.2.3",
                icon: "/api/market/plugins/assets/plugin-a/icons/a%20b.png",
                authors: ["Alice", "Bob"],
                installed: true,
            },
        ]);
    });

    test("keeps remote icon url unchanged", async () => {
        mocks.readdir.mockResolvedValueOnce([dir("plugin-b", true)]);
        mocks.readFile.mockResolvedValueOnce(`
            export default {
                id: "plugin-b",
                name: "Plugin B",
                icon: "https://example.com/icon.png",
            };
        `);

        const response = await GET();
        const body = await response.json();

        expect(body[0].icon).toBe("https://example.com/icon.png");
    });

    test("returns empty list when root read fails", async () => {
        mocks.readdir.mockRejectedValueOnce(new Error("boom"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual([]);
    });
});
