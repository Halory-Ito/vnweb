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
            where: vi.fn(() => ({
                limit: vi.fn(async () => take()),
                orderBy: vi.fn(async () => take()),
            })),
            orderBy: vi.fn(async () => take()),
        })),
    }));
    const insert = vi.fn(() => ({
        values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 1 }]) })),
    }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    return { state, db: { select, insert }, mkdir, writeFile };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({ default: { mkdir: mocks.mkdir, writeFile: mocks.writeFile } }),
);

import { GET, POST } from "@/app/api/game/[id]/memory/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const getReq = (url = "http://localhost") =>
    ({ nextUrl: new URL(url) }) as NextRequest;
const postReq = (formData: FormData) =>
    ({ formData: async () => formData }) as unknown as NextRequest;

describe("game/[id]/memory route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
        mocks.mkdir.mockClear();
        mocks.writeFile.mockClear();
    });

    test("GET returns 400 for invalid game id", async () => {
        const res = await GET(getReq(), ctx("0"));
        expect(res.status).toBe(400);
    });

    test("GET returns 404 when game not found", async () => {
        mocks.state.queue.push([]);

        const res = await GET(getReq(), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("GET returns memory list", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 11, title: "t" }]);

        const res = await GET(getReq("http://localhost?title=hello"), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.items).toHaveLength(1);
    });

    test("GET returns 500 when query fails", async () => {
        mocks.state.queue.push([{ id: 1 }], new Error("query failed"));

        const res = await GET(getReq(), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("query failed");
    });

    test("POST returns 400 when image file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const res = await POST(postReq(new FormData()), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toContain("截图");
    });

    test("POST returns 400 when uploaded file is not image", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("image", new File([new Uint8Array([1])], "a.txt", { type: "text/plain" }));

        const res = await POST(postReq(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("POST returns 400 when uploaded image is empty", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("image", new File([], "a.png", { type: "image/png" }));

        const res = await POST(postReq(fd), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("POST returns 404 when game not found", async () => {
        mocks.state.queue.push([]);

        const fd = new FormData();
        fd.set("image", new File([new Uint8Array([1])], "a.png", { type: "image/png" }));

        const res = await POST(postReq(fd), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("POST saves image and creates memory item", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set("title", "  Memory Title  ");
        fd.set("description", "  desc  ");
        fd.set("image", new File([new Uint8Array([1, 2, 3])], "memory", { type: "image/png" }));

        const res = await POST(postReq(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.item.id).toBe(1);
        expect(mocks.mkdir).toHaveBeenCalledTimes(1);
        expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    });

    test("POST returns 500 when writing image fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.writeFile.mockRejectedValueOnce(new Error("disk failed"));

        const fd = new FormData();
        fd.set("image", new File([new Uint8Array([1])], "a.png", { type: "image/png" }));

        const res = await POST(postReq(fd), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("disk failed");
    });
});
