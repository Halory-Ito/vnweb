import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const fs = {
        readFile: vi.fn(),
        writeFile: vi.fn(),
    };
    return { fs };
});

vi.mock("node:fs/promises", () => ({
    default: mocks.fs,
}));

import { GET, PUT } from "@/app/api/settings/theme-css/route";

const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("app/api/settings/theme-css route", () => {
    beforeEach(() => {
        mocks.fs.readFile.mockReset();
        mocks.fs.writeFile.mockReset();
    });

    test("GET returns empty content on ENOENT", async () => {
        const err = Object.assign(new Error("not found"), { code: "ENOENT" });
        mocks.fs.readFile.mockRejectedValueOnce(err);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { content: "" } });
    });

    test("GET returns css content", async () => {
        mocks.fs.readFile.mockResolvedValueOnce("body { color: red; }");

        const response = await GET();
        const body = await response.json();

        expect(body.data.content).toContain("color: red");
    });

    test("PUT validates payload type", async () => {
        const response = await PUT(req({ content: 123 } as unknown));
        expect(response.status).toBe(400);
    });

    test("PUT saves content", async () => {
        // Step 1: 准备合法主题内容。
        const response = await PUT(req({ content: "h1 { color: blue; }" }));
        const body = await response.json();

        // Step 2: 断言保存调用与返回值。
        expect(response.status).toBe(200);
        expect(body.data.saved).toBe(true);
        expect(mocks.fs.writeFile).toHaveBeenCalledTimes(1);
    });
});
