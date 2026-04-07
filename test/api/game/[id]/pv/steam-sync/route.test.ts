import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = {
        queue: [] as Array<unknown[] | Error>,
        insertCalls: [] as unknown[],
    };
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
    const insert = vi.fn(() => ({
        values: vi.fn(async (v: unknown) => {
            state.insertCalls.push(v);
        }),
    }));
    const del = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
    const fetchSteamAppDetails = vi.fn(async () => ({
        movies: [{ name: "PV1", hls_h264: "https://pv/1.m3u8" }],
    }));
    const getEnabledProxySettings = vi.fn(async () => null);

    return {
        state,
        db: { select, insert, delete: del },
        fetchSteamAppDetails,
        getEnabledProxySettings,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "@/app/api/game/steam-import/_shared",
    () => ({ fetchSteamAppDetails: mocks.fetchSteamAppDetails }),
);
vi.mock(
    "@/lib/proxy-settings",
    () => ({ getEnabledProxySettings: mocks.getEnabledProxySettings }),
);

import { POST } from "@/app/api/game/[id]/pv/steam-sync/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("game/[id]/pv/steam-sync POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.state.insertCalls = [];
        mocks.db.select.mockClear();
    });

    test("returns 400 for invalid game id", async () => {
        const res = await POST(req({}), ctx("0"));
        expect(res.status).toBe(400);
    });

    test("returns 404 when game not found", async () => {
        mocks.state.queue.push([]);
        const res = await POST(req({ steamAppId: 10 }), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("syncs steam pvs successfully", async () => {
        // 顺序：ensure game exists -> existing pvs
        mocks.state.queue.push([{ id: 1 }], []);

        const res = await POST(req({ steamAppId: 10 }), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.inserted).toBe(1);
    });
});
