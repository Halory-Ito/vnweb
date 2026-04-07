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
});
