import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const fs = {
        mkdir: vi.fn(async () => undefined),
        writeFile: vi.fn(async () => undefined),
        readdir: vi.fn(async () => []),
        unlink: vi.fn(async () => undefined),
        stat: vi.fn(async () => ({ isFile: () => true })),
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
        mocks.fs.readdir.mockClear();
        mocks.fs.unlink.mockClear();
        mocks.fs.stat.mockClear();
        mocks.fs.readdir.mockResolvedValue([]);
        mocks.fs.stat.mockResolvedValue({ isFile: () => true });
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

    test("uploads image and returns public path with timestamp filename", async () => {
        // Step 1: 模拟时间戳。
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);

        // Step 2: 构造图片文件上传请求。
        const fd = new FormData();
        fd.set(
            "file",
            new File([new Uint8Array([1, 2, 3])], "A B.png", {
                type: "image/png",
            }),
        );

        // Step 3: 调用上传接口。
        const response = await POST(reqWithFormData(fd));
        const body = await response.json();

        // Step 4: 校验落盘调用与返回路径。
        expect(response.status).toBe(200);
        expect(body.data.path).toBe("/assets/bg/custom/1700000000000.png");
        expect(mocks.fs.mkdir).toHaveBeenCalledTimes(1);
        expect(mocks.fs.writeFile).toHaveBeenCalledTimes(1);
    });

    test("removes all old files before saving new one", async () => {
        // Step 1: 模拟时间戳和已存在旧的背景文件。
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);
        const mockStat = { isFile: () => true };
        mocks.fs.readdir.mockResolvedValue([
            "1700000000000.png",
            "1699999999999.jpg",
            "old-background.png",
            "sp0014a_1778208473177.png",
        ]);
        mocks.fs.stat.mockResolvedValue(mockStat);

        const fd = new FormData();
        fd.set(
            "file",
            new File([new Uint8Array([1, 2, 3])], "background.webp", {
                type: "image/webp",
            }),
        );

        // Step 2: 调用上传接口。
        const response = await POST(reqWithFormData(fd));
        const body = await response.json();

        // Step 3: 校验删除了所有旧文件并保存了新文件。
        expect(response.status).toBe(200);
        expect(body.data.path).toBe("/assets/bg/custom/1700000000000.webp");
        expect(mocks.fs.unlink).toHaveBeenCalledTimes(4);
        expect(mocks.fs.writeFile).toHaveBeenCalledTimes(1);
    });
});
