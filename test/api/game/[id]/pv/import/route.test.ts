import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = { queue: [] as Array<unknown[] | Error> };
    const take = () => {
        const item = state.queue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({ limit: vi.fn(async () => take()) })),
        })),
    }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    return { state, db: { select }, mkdir, writeFile };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({ default: { mkdir: mocks.mkdir, writeFile: mocks.writeFile } }),
);

import { POST } from "@/app/api/game/[id]/pv/import/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (formData: FormData) =>
    ({ formData: async () => formData }) as unknown as NextRequest;

describe("game/[id]/pv/import POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.mkdir.mockClear();
        mocks.writeFile.mockClear();
    });

    test("returns 400 when game id is invalid", async () => {
        const res = await POST(req(new FormData()), ctx("x"));
        expect(res.status).toBe(400);
    });

    test("returns 404 when game not found", async () => {
        mocks.state.queue.push([]);

        const fd = new FormData();
        fd.set("file", new File([new Uint8Array([1])], "pv.mp4", { type: "video/mp4" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("returns 400 when upload file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const res = await POST(req(new FormData()), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when file is not video", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("file", new File(["x"], "a.txt", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when file size is zero", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("file", new File([], "a.mp4", { type: "video/mp4" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("imports pv video file", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set(
            "file",
            new File([new Uint8Array([1, 2])], "pv.mp4", { type: "video/mp4" }),
        );

        const res = await POST(req(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.name).toBe("pv");
    });

    test("uses fallback .mp4 extension when filename has no extension", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("file", new File([new Uint8Array([1])], "pv", { type: "video/mp4" }));

        const res = await POST(req(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(String(body.data.path)).toContain(".mp4");
    });

    test("returns 500 when writing file fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.writeFile.mockRejectedValueOnce(new Error("disk failed"));

        const fd = new FormData();
        fd.set("file", new File([new Uint8Array([1])], "a.mp4", { type: "video/mp4" }));

        const res = await POST(req(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("disk failed");
    });
});
