import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const extractIconFromExe = vi.fn(async () => "C:/out/icon.png");
    return { extractIconFromExe };
});

vi.mock("@/win/extract-icon", () => ({
    default: mocks.extractIconFromExe,
}));

import { POST } from "@/app/api/game/extract-icon/route";

const createRequest = (payload: unknown): NextRequest => {
    return { json: async () => payload } as NextRequest;
};

describe("app/api/game/extract-icon POST", () => {
    beforeEach(() => {
        mocks.extractIconFromExe.mockClear();
    });

    test("returns 400 when required fields are missing", async () => {
        const response = await POST(createRequest({ exePath: "" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "exePath 和 iconSavePath 为必填项" });
    });

    test("extracts icon successfully", async () => {
        const response = await POST(
            createRequest({
                exePath: "C:/a.exe",
                iconSavePath: "C:/out",
                timeoutMs: 5000,
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.extractIconFromExe).toHaveBeenCalledWith(
            "C:/a.exe",
            "C:/out",
            5000,
        );
        expect(body).toEqual({ data: { iconPath: "C:/out/icon.png" } });
    });

    test("returns 500 when extraction throws", async () => {
        mocks.extractIconFromExe.mockRejectedValueOnce(
            new Error("extract failed"),
        );

        const response = await POST(
            createRequest({ exePath: "C:/a.exe", iconSavePath: "C:/out" }),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "extract failed" });
    });
});
