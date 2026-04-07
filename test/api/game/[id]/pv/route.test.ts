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
    const update = vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 1 }]) })),
        })),
    }));
    const del = vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 1 }]) })),
    }));

    return { state, db: { select, insert, update, delete: del } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { DELETE, GET, PATCH, POST } from "@/app/api/game/[id]/pv/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (
    payload: unknown,
): NextRequest => ({
    json: async () => payload,
    nextUrl: new URL("http://localhost?itemId=1"),
} as NextRequest);

describe("game/[id]/pv route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("GET returns list", async () => {
        mocks.state.queue.push([{ id: 1 }], [{
            id: 1,
            name: "pv",
            url: "/a.mp4",
        }]);
        const res = await GET({} as NextRequest, ctx("1"));
        expect(res.status).toBe(200);
    });

    test("POST validates payload", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await POST(req({}), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("PATCH updates item", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await PATCH(
            req({ itemId: 1, name: "n", url: "u" }),
            ctx("1"),
        );
        expect(res.status).toBe(200);
    });

    test("DELETE deletes item", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await DELETE(
            { nextUrl: new URL("http://localhost?itemId=1") } as NextRequest,
            ctx("1"),
        );
        expect(res.status).toBe(200);
    });
});
