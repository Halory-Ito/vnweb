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
            where: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 1 }]) })),
        })),
    }));
    const del = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);
    const unlink = vi.fn(async () => undefined);

    return {
        state,
        db: { select, update, delete: del },
        mkdir,
        writeFile,
        unlink,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({
        default: {
            mkdir: mocks.mkdir,
            writeFile: mocks.writeFile,
            unlink: mocks.unlink,
        },
    }),
);

import { DELETE, PATCH } from "@/app/api/game/[id]/memory/[memoryId]/route";

const ctx = (id: string, memoryId: string) => ({
    params: Promise.resolve({ id, memoryId }),
});
const patchReq = (formData: FormData) =>
    ({ formData: async () => formData }) as unknown as NextRequest;

describe("game/[id]/memory/[memoryId] route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.delete.mockClear();
        mocks.mkdir.mockClear();
        mocks.writeFile.mockClear();
        mocks.unlink.mockClear();
    });

    test("PATCH returns 400 for invalid ids", async () => {
        const res = await PATCH(patchReq(new FormData()), ctx("x", "1"));
        expect(res.status).toBe(400);
    });

    test("PATCH returns 404 when game not found", async () => {
        mocks.state.queue.push([]);

        const res = await PATCH(patchReq(new FormData()), ctx("1", "1"));
        expect(res.status).toBe(404);
    });

    test("PATCH returns 404 when memory item not found", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const res = await PATCH(patchReq(new FormData()), ctx("1", "1"));
        expect(res.status).toBe(404);
    });

    test("PATCH returns 400 when uploaded file is not image", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, imageUrl: "/assets/memory/1/a.png" }]);

        const fd = new FormData();
        fd.set("image", new File([new Uint8Array([1])], "a.txt", { type: "text/plain" }));

        const res = await PATCH(patchReq(fd), ctx("1", "1"));
        expect(res.status).toBe(400);
    });

    test("PATCH updates metadata without image", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, imageUrl: "/assets/memory/1/a.png" }]);

        const fd = new FormData();
        fd.set("title", "  New title  ");
        fd.set("description", "  New desc  ");

        const res = await PATCH(patchReq(fd), ctx("1", "1"));
        expect(res.status).toBe(200);
        expect(mocks.writeFile).not.toHaveBeenCalled();
    });

    test("PATCH uploads new image and unlinks old file", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, imageUrl: "/assets/memory/1/old.png" }]);

        const fd = new FormData();
        fd.set("image", new File([new Uint8Array([1, 2])], "new.png", { type: "image/png" }));

        const res = await PATCH(patchReq(fd), ctx("1", "1"));
        expect(res.status).toBe(200);
        expect(mocks.mkdir).toHaveBeenCalledTimes(1);
        expect(mocks.writeFile).toHaveBeenCalledTimes(1);
        expect(mocks.unlink).toHaveBeenCalledTimes(1);
    });

    test("PATCH returns 500 when update fails", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, imageUrl: "/assets/memory/1/old.png" }]);
        mocks.db.update.mockImplementationOnce(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(async () => {
                        throw new Error("update failed");
                    }),
                })),
            })),
        }));

        const res = await PATCH(patchReq(new FormData()), ctx("1", "1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("update failed");
    });

    test("DELETE deletes memory item", async () => {
        mocks.state.queue.push([{ id: 1 }], [{
            id: 99,
            imageUrl: "/assets/memory/1/a.png",
        }]);

        const res = await DELETE({} as NextRequest, ctx("1", "99"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ data: { deleted: true, id: 99 } });
        expect(mocks.unlink).toHaveBeenCalledTimes(1);
    });

    test("DELETE returns 404 when memory item not found", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const res = await DELETE({} as NextRequest, ctx("1", "99"));
        expect(res.status).toBe(404);
    });

    test("DELETE returns 500 when query fails", async () => {
        mocks.state.queue.push(new Error("select failed"));

        const res = await DELETE({} as NextRequest, ctx("1", "99"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("select failed");
    });
});
