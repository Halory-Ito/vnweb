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
    const update = vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn(() => ({})),
        })),
    }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    return { state, db: { select, update }, mkdir, writeFile };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({ default: { mkdir: mocks.mkdir, writeFile: mocks.writeFile } }),
);

import { POST } from "@/app/api/game/[id]/ost/lyric/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (formData: FormData) =>
    ({ formData: async () => formData }) as unknown as NextRequest;

describe("game/[id]/ost/lyric POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.mkdir.mockClear();
        mocks.writeFile.mockClear();
    });

    test("returns 400 when game id is invalid", async () => {
        const res = await POST(req(new FormData()), ctx("x"));
        expect(res.status).toBe(400);
    });

    test("returns 404 when game does not exist", async () => {
        mocks.state.queue.push([]);
        const res = await POST(req(new FormData()), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("returns 400 when file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const res = await POST(req(new FormData()), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when itemId is invalid", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("itemId", "x");
        fd.set("file", new File(["a"], "a.lrc", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when extension is not lrc", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["a"], "a.txt", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 404 when ost item not found", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["[00:01]a"], "a.lrc", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("returns 400 when ost item is not local asset", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, url: "https://remote/audio.mp3" }]);

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["[00:01]a"], "a.lrc", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("uploads lyric file successfully", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, ostId: 1, url: "/assets/ost/1/a.mp3", name: "song" }]);

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["[00:01]a"], "song.lrc", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.itemId).toBe(1);
        expect(mocks.mkdir).toHaveBeenCalledTimes(1);
        expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    });

    test("returns 500 when writing lyric fails", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, ostId: 1, url: "/assets/ost/1/a.mp3", name: "song" }]);
        mocks.writeFile.mockRejectedValueOnce(new Error("write failed"));

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["[00:01]a"], "song.lrc", { type: "text/plain" }));

        const res = await POST(req(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("write failed");
    });
});
