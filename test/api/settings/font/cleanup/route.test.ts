import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fs: { unlink: vi.fn(async () => undefined) },
}));

vi.mock("node:fs/promises", () => ({ default: mocks.fs }));

import { POST } from "@/app/api/settings/font/cleanup/route";

const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("settings/font/cleanup POST", () => {
    beforeEach(() => {
        mocks.fs.unlink.mockClear();
    });

    test("returns empty deleted list when no valid path", async () => {
        const response = await POST(req({ paths: ["../x"] }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.deleted).toEqual([]);
    });

    test("deletes valid font paths", async () => {
        // Step 1: 传入重复和非法路径，应该仅清理合法唯一项。
        const response = await POST(
            req({
                paths: [
                    "/fonts/a.ttf",
                    "/fonts/a.ttf",
                    "/bad/a.ttf",
                    "/fonts/b.woff2",
                ],
            }),
        );
        const body = await response.json();

        // Step 2: 断言删除列表与 unlink 次数。
        expect(response.status).toBe(200);
        expect(body.data.deleted).toEqual(["/fonts/a.ttf", "/fonts/b.woff2"]);
        expect(mocks.fs.unlink).toHaveBeenCalledTimes(2);
    });
});
