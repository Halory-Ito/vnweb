import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    class MockArchive {
        private handlers: Record<string, Array<(...args: any[]) => void>> = {};
        shouldError = false;
        append = vi.fn();
        directory = vi.fn();

        on = vi.fn((event: string, handler: (...args: any[]) => void) => {
            this.handlers[event] ||= [];
            this.handlers[event].push(handler);
            return this;
        });

        emit(event: string, ...args: any[]) {
            (this.handlers[event] || []).forEach((handler) => handler(...args));
        }

        finalize = vi.fn(() => {
            if (this.shouldError) {
                this.emit("error", new Error("archive failed"));
                return;
            }

            this.emit("data", new Uint8Array([1, 2, 3]));
            this.emit("end");
        });
    }

    const archive = new MockArchive();
    const archiverFactory = vi.fn(() => archive);
    const fs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => Buffer.from("db")),
    };

    return { archive, archiverFactory, fs };
});

vi.mock("archiver", () => ({
    default: mocks.archiverFactory,
}));

vi.mock("node:fs", () => ({
    default: mocks.fs,
}));

import { POST } from "@/app/api/settings/backup/export/route";

describe("app/api/settings/backup/export POST", () => {
    beforeEach(() => {
        mocks.archive.shouldError = false;
        mocks.archive.append.mockClear();
        mocks.archive.directory.mockClear();
        mocks.archive.finalize.mockClear();
        mocks.archiverFactory.mockClear();
        mocks.fs.existsSync.mockClear();
        mocks.fs.readFileSync.mockClear();
        mocks.fs.existsSync.mockReturnValue(true);
        mocks.fs.readFileSync.mockReturnValue(Buffer.from("db"));
    });

    test("returns zip response", async () => {
        // Step 1: 调用导出接口。
        const response = await POST({} as NextRequest);

        // Step 2: 校验压缩响应头。
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("application/zip");
        expect(response.headers.get("Content-Disposition")).toContain(
            "vnweb-backup-",
        );
    });

    test("returns 500 when archiver throws", async () => {
        mocks.archive.shouldError = true;

        const response = await POST({} as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("archive failed");
    });
});
