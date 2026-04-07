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

describe("game/[id]/memory/[memoryId] route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.delete.mockClear();
    });

    test("PATCH returns 400 for invalid ids", async () => {
        const res = await PATCH(
            { formData: async () => new FormData() } as unknown as NextRequest,
            ctx("x", "1"),
        );
        expect(res.status).toBe(400);
    });

    test("PATCH returns 404 when memory item not found", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const res = await PATCH(
            { formData: async () => new FormData() } as unknown as NextRequest,
            ctx("1", "1"),
        );
        expect(res.status).toBe(404);
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
    });
});
