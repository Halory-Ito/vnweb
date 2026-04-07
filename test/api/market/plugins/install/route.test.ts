import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const readFile = vi.fn();
    const writeFile = vi.fn();
    return { readFile, writeFile };
});

vi.mock("fs/promises", () => ({
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
}));

import { POST } from "@/app/api/market/plugins/install/route";

const req = (
    payload: unknown,
): Request => ({ json: async () => payload } as Request);

describe("app/api/market/plugins/install POST", () => {
    beforeEach(() => {
        mocks.readFile.mockReset();
        mocks.writeFile.mockReset();
    });

    test("returns 400 for invalid id", async () => {
        const response = await POST(req({ id: "../bad" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid plugin id" });
    });

    test("updates manifest installed=true", async () => {
        // Step 1: 准备 manifest 原文。
        mocks.readFile.mockResolvedValueOnce(
            'export default {\n  id: "a",\n  installed: false,\n};\n',
        );

        // Step 2: 发起安装请求。
        const response = await POST(req({ id: "plugin-a" }));
        const body = await response.json();

        // Step 3: 断言写入动作与返回值。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            id: "plugin-a",
            installed: true,
        });
        expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    });

    test("returns 500 when read fails", async () => {
        mocks.readFile.mockRejectedValueOnce(new Error("missing"));

        const response = await POST(req({ id: "plugin-a" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("Failed to install plugin");
    });
});
