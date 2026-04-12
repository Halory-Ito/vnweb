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
    const createWhereResult = () => {
        const rows = take();
        return Object.assign(Promise.resolve(rows), {
            limit: vi.fn(async () => rows),
        });
    };
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => createWhereResult()),
        })),
    }));
    const del = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
    const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));
    const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
    }));

    return { state, db: { select, delete: del, insert, update } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET, PUT } from "@/app/api/game/[id]/records/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("game/[id]/records route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.delete.mockClear();
        mocks.db.insert.mockClear();
        mocks.db.update.mockClear();
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

    test("GET returns transformed records", async () => {
        // 顺序：game -> records
        mocks.state.queue.push([{ id: 1 }], [{
            id: 1,
            playDate: "2026-01-01T00:00:00.000Z",
            playTime: 60,
        }]);

        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.records[0].durationSeconds).toBe(60);
        expect(body.data.totalPlayTime).toBe(60);
    });

    test("GET falls back to epoch when record start date is invalid", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 1, playDate: "bad", playTime: 30 }]);

        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.records[0].startAt).toBe("1970-01-01T00:00:00.000Z");
        expect(body.data.records[0].durationSeconds).toBe(30);
    });

    test("GET returns 500 when query throws", async () => {
        mocks.state.queue.push(new Error("records failed"));

        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("Failed to query game records");
    });

    test("PUT returns 400 for invalid game id", async () => {
        const res = await PUT(req({ records: [] }), ctx("x"));
        expect(res.status).toBe(400);
    });

    test("PUT returns 404 when game not found", async () => {
        mocks.state.queue.push([]);

        const res = await PUT(req({ records: [] }), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("PUT returns 500 for invalid record range", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const res = await PUT(
            req({
                records: [{
                    startAt: "2026-01-02T00:00:00.000Z",
                    endAt: "2026-01-01T00:00:00.000Z",
                }],
            }),
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toContain("Invalid record");
    });

    test("PUT updates total play time on existing play row", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 10 }]);

        const res = await PUT(
            req({
                records: [{
                    startAt: "2026-01-01T00:00:00.000Z",
                    endAt: "2026-01-01T00:01:30.000Z",
                }],
            }),
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.totalPlayTime).toBe(90);
        expect(mocks.db.delete).toHaveBeenCalledTimes(1);
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
    });

    test("PUT creates play row when missing", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const res = await PUT(
            req({
                records: [{
                    startAt: "2026-01-01T00:00:00.000Z",
                    endAt: "2026-01-01T00:00:10.000Z",
                }],
            }),
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.totalPlayTime).toBe(10);
        expect(mocks.db.insert).toHaveBeenCalledTimes(2);
    });

    test("PUT returns 500 when delete old records fails", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        mocks.db.delete.mockImplementationOnce(() => ({
            where: vi.fn(async () => {
                throw new Error("delete failed");
            }),
        }));

        const res = await PUT(req({ records: [] }), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe("delete failed");
    });
});
