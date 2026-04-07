import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fs: {
        access: vi.fn(async () => undefined),
        mkdir: vi.fn(async () => undefined),
        copyFile: vi.fn(async () => undefined),
    },
}));

vi.mock("node:fs/promises", () => ({ default: mocks.fs }));

import { POST } from "@/app/api/settings/font/import/route";

const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("settings/font/import POST", () => {
    const nowSpy = vi.spyOn(Date, "now");

    beforeEach(() => {
        nowSpy.mockReturnValue(1700000000000);
        mocks.fs.access.mockClear();
        mocks.fs.mkdir.mockClear();
        mocks.fs.copyFile.mockClear();
    });

    test("returns 400 when sourcePath missing", async () => {
        const response = await POST(req({}));
        expect(response.status).toBe(400);
    });

    test("returns 400 for unsupported extension", async () => {
        const response = await POST(
            req({ sourcePath: "C:/Windows/Fonts/a.txt" }),
        );
        expect(response.status).toBe(400);
    });

    test("imports allowed font file", async () => {
        // Step 1: 提供系统字体目录路径。
        const response = await POST(
            req({ sourcePath: "C:/Windows/Fonts/Arial.ttf" }),
        );
        const body = await response.json();

        // Step 2: 断言导入结果。
        expect(response.status).toBe(200);
        expect(body.data.path).toContain("/fonts/Arial_1700000000000.ttf");
        expect(mocks.fs.copyFile).toHaveBeenCalledTimes(1);
    });
});
