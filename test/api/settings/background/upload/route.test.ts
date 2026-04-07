import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const fs = {
        mkdir: vi.fn(async () => undefined),
        writeFile: vi.fn(async () => undefined),
    };
    return { fs };
});

vi.mock("node:fs/promises", () => ({
    default: mocks.fs,
}));

import { POST } from "@/app/api/settings/background/upload/route";

const reqWithFormData = (
    formData: FormData,
): NextRequest => ({ formData: async () => formData } as NextRequest);

describe("app/api/settings/background/upload POST", () => {
    beforeEach(() => {
        mocks.fs.mkdir.mockClear();
        mocks.fs.writeFile.mockClear();
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    });

    test("returns 400 when file missing", async () => {
        const response = await POST(reqWithFormData(new FormData()));
        expect(response.status).toBe(400);
    });

    test("returns 400 for non-image file", async () => {
        const fd = new FormData();
        fd.set("file", new File(["abc"], "a.txt", { type: "text/plain" }));

        const response = await POST(reqWithFormData(fd));
        expect(response.status).toBe(400);
    });

    test("uploads image and returns public path", async () => {
        // Step 1: 构造图片文件上传请求。
        const fd = new FormData();
        fd.set(
            "file",
            new File([new Uint8Array([1, 2, 3])], "A B.png", {
                type: "image/png",
            }),
        );

        // Step 2: 调用上传接口。
        const response = await POST(reqWithFormData(fd));
        const body = await response.json();

        // Step 3: 校验落盘调用与返回路径。
        expect(response.status).toBe(200);
        expect(body.data.path).toContain("/assets/bg/custom/");
        expect(body.data.path).toContain("A_B_1700000000000.png");
        expect(mocks.fs.mkdir).toHaveBeenCalledTimes(1);
        expect(mocks.fs.writeFile).toHaveBeenCalledTimes(1);
    });
});
