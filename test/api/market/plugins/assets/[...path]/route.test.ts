import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const readFile = vi.fn();
    return { readFile };
});

vi.mock("fs/promises", () => ({
    readFile: mocks.readFile,
}));

import { GET } from "@/app/api/market/plugins/assets/[...path]/route";

describe("app/api/market/plugins/assets/[...path] GET", () => {
    beforeEach(() => {
        mocks.readFile.mockReset();
    });

    test("returns 404 when path is empty", async () => {
        const response = await GET({} as Request, {
            params: Promise.resolve({ path: [] }),
        });
        expect(response.status).toBe(404);
    });

    test("returns 400 for unsafe relative path", async () => {
        const response = await GET({} as Request, {
            params: Promise.resolve({ path: ["..", "secret.png"] }),
        });
        expect(response.status).toBe(400);
    });

    test("returns file content with mime type", async () => {
        // Step 1: 模拟读取图片成功。
        mocks.readFile.mockResolvedValueOnce(Buffer.from([1, 2, 3]));

        // Step 2: 请求插件图标。
        const response = await GET({} as Request, {
            params: Promise.resolve({ path: ["plugin-a", "icon.png"] }),
        });

        // Step 3: 校验响应状态和 Content-Type。
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("image/png");
    });
});
