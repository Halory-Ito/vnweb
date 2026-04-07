import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type ZipEntry = {
    entryName: string;
    isDirectory: boolean;
    getData: () => Buffer;
};

const mocks = vi.hoisted(() => {
    const state = {
        entries: [] as ZipEntry[],
    };

    class MockZip {
        constructor(_buffer: Buffer) {}
        getEntries() {
            return state.entries;
        }
    }

    const fs = {
        existsSync: vi.fn((p: string) => {
            const value = String(p);
            if (value.includes("temp-backup") && value.includes("database")) {
                return true;
            }
            if (value.includes("temp-backup") && value.includes("assets")) {
                return true;
            }
            if (value.endsWith("local.db")) {
                return true;
            }
            if (value.includes("public") && value.includes("assets")) {
                return true;
            }
            return false;
        }),
        promises: {
            mkdir: vi.fn(async () => undefined),
            writeFile: vi.fn(async () => undefined),
            copyFile: vi.fn(async () => undefined),
            rm: vi.fn(async () => undefined),
            rename: vi.fn(async () => undefined),
            cp: vi.fn(async () => undefined),
        },
    };

    return { state, MockZip, fs };
});

vi.mock("adm-zip", () => ({
    default: mocks.MockZip,
}));

vi.mock("node:fs", () => ({
    default: mocks.fs,
}));

import { POST } from "@/app/api/settings/backup/import/route";

const zipEntry = (entryName: string, content: string): ZipEntry => ({
    entryName,
    isDirectory: false,
    getData: () => Buffer.from(content),
});

const requestWithFile = (file: File | null): NextRequest => {
    const form = new FormData();
    if (file) {
        form.set("file", file);
    }

    return {
        formData: async () => form,
    } as NextRequest;
};

describe("app/api/settings/backup/import POST", () => {
    beforeEach(() => {
        mocks.state.entries = [];
        mocks.fs.existsSync.mockClear();
        Object.values(mocks.fs.promises).forEach((fn) => fn.mockClear());
    });

    test("returns 400 when file is missing", async () => {
        const response = await POST(requestWithFile(null));
        expect(response.status).toBe(400);
    });

    test("returns 400 for non-zip file", async () => {
        const response = await POST(
            requestWithFile(
                new File(["x"], "backup.txt", { type: "text/plain" }),
            ),
        );
        expect(response.status).toBe(400);
    });

    test("imports backup zip successfully", async () => {
        // Step 1: 准备 zip 包内数据库与资源文件。
        mocks.state.entries = [
            zipEntry("database/local.db", "db"),
            zipEntry("assets/cover/a.jpg", "img"),
        ];

        // Step 2: 调用导入接口。
        const response = await POST(
            requestWithFile(
                new File([new Uint8Array([1, 2, 3])], "backup.zip", {
                    type: "application/zip",
                }),
            ),
        );
        const body = await response.json();

        // Step 3: 校验导入结果与关键文件操作调用。
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mocks.fs.promises.copyFile).toHaveBeenCalled();
        expect(mocks.fs.promises.cp).toHaveBeenCalled();
    });
});
