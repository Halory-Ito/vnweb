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
const req = (payload: unknown): NextRequest =>
    ({
        json: async () => payload,
        nextUrl: new URL("http://localhost?itemId=1"),
    }) as NextRequest;

describe("game/[id]/pv route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
        mocks.db.update.mockClear();
        mocks.db.delete.mockClear();
    });

    test("GET returns 400 for invalid game id", async () => {
        const res = await GET({} as NextRequest, ctx("x"));
        expect(res.status).toBe(400);
    });

    test("GET returns 404 when game not found", async () => {
        mocks.state.queue.push([]);
        const res = await GET({} as NextRequest, ctx("1"));
        expect(res.status).toBe(404);
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

    test("GET returns 500 when query fails", async () => {
        mocks.state.queue.push([{ id: 1 }], new Error("pv list failed"));
        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("pv list failed");
    });

    test("POST validates payload", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await POST(req({}), ctx("1"));
        expect(res.status).toBe(400);
    });

    test("POST returns 404 when game not found", async () => {
        mocks.state.queue.push([]);
        const res = await POST(req({ name: "n", url: "u" }), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("POST returns 500 when insertion fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.insert.mockImplementationOnce(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(async () => {
                    throw new Error("insert failed");
                }),
            })),
        }));

        const res = await POST(req({ name: "n", url: "u" }), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("insert failed");
    });

    test("PATCH updates item", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await PATCH(
            req({ itemId: 1, name: "n", url: "u" }),
            ctx("1"),
        );
        expect(res.status).toBe(200);
    });

    test("PATCH returns 404 when item does not exist", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.update.mockImplementationOnce(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(async () => []),
                })),
            })),
        }));

        const res = await PATCH(
            req({ itemId: 1, name: "n", url: "u" }),
            ctx("1"),
        );
        expect(res.status).toBe(404);
    });

    test("PATCH returns 500 when update fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.update.mockImplementationOnce(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(async () => {
                        throw new Error("update failed");
                    }),
                })),
            })),
        }));

        const res = await PATCH(
            req({ itemId: 1, name: "n", url: "u" }),
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("update failed");
    });

    test("DELETE deletes item", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await DELETE(
            { nextUrl: new URL("http://localhost?itemId=1") } as NextRequest,
            ctx("1"),
        );
        expect(res.status).toBe(200);
    });

    test("DELETE returns 400 when itemId is invalid", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const res = await DELETE(
            { nextUrl: new URL("http://localhost?itemId=abc") } as NextRequest,
            ctx("1"),
        );
        expect(res.status).toBe(400);
    });

    test("DELETE returns 404 when item does not exist", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.delete.mockImplementationOnce(() => ({
            where: vi.fn(() => ({ returning: vi.fn(async () => []) })),
        }));

        const res = await DELETE(
            { nextUrl: new URL("http://localhost?itemId=1") } as NextRequest,
            ctx("1"),
        );
        expect(res.status).toBe(404);
    });

    test("DELETE returns 500 when deletion fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.delete.mockImplementationOnce(() => ({
            where: vi.fn(() => ({
                returning: vi.fn(async () => {
                    throw new Error("delete failed");
                }),
            })),
        }));

        const res = await DELETE(
            { nextUrl: new URL("http://localhost?itemId=1") } as NextRequest,
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("delete failed");
    });
});
