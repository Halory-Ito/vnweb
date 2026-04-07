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

    const whereResult = () => {
        const rows = take();
        return Object.assign(Promise.resolve(rows), {
            limit: vi.fn(async () => rows),
        });
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => whereResult()),
        })),
    }));

    const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
    }));

    const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));

    const dayObj = {
        toISOString: vi.fn(() => "2026-04-07T00:00:00.000Z"),
        subtract: vi.fn(() => ({
            toISOString: () => "2026-04-06T23:00:00.000Z",
        })),
    };

    const fetchOwnedGames = vi.fn(async () => []);
    const getSteamApiKey = vi.fn(() => "steam-key");

    return {
        state,
        db: { select, update, insert },
        dayObj,
        fetchOwnedGames,
        getSteamApiKey,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock("dayjs", () => ({ default: vi.fn(() => mocks.dayObj) }));
vi.mock("@/app/api/game/steam-import/_shared", () => ({
    fetchOwnedGames: mocks.fetchOwnedGames,
    getSteamApiKey: mocks.getSteamApiKey,
}));

import { POST } from "@/app/api/settings/cloud-sync/steam/sync-playtime/route";

const req = (payload: unknown): NextRequest => ({
    json: async () => payload,
} as NextRequest);

describe("settings/cloud-sync/steam/sync-playtime POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.insert.mockClear();
        mocks.fetchOwnedGames.mockReset();
        mocks.getSteamApiKey.mockReset();
        mocks.getSteamApiKey.mockReturnValue("steam-key");
    });

    test("returns 400 when steam account not bound", async () => {
        mocks.state.queue.push([]);
        const response = await POST(req({}));
        expect(response.status).toBe(400);
    });

    test("returns 500 when api key missing", async () => {
        mocks.state.queue.push([{ accountId: "76561198000000000" }]);
        mocks.getSteamApiKey.mockReturnValueOnce("");

        const response = await POST(req({}));
        expect(response.status).toBe(500);
    });

    test("syncs playtime successfully", async () => {
        // Step 1: 准备账号、映射、已有时长与计时记录查询队列。
        mocks.state.queue.push(
            [{ accountId: "76561198000000000" }],
            [{ gameId: 1, externalId: "10" }],
            [{ id: 11, totalPlayTime: 120 }],
            [{ id: 21 }],
        );
        mocks.fetchOwnedGames.mockResolvedValueOnce([
            { appid: 10, playtime_forever: 5 },
        ] as any);

        // Step 2: 执行同步。
        const response = await POST(req({ proxy: { enabled: true } }));
        const body = await response.json();

        // Step 3: 断言成功信息与写入动作。
        expect(response.status).toBe(200);
        expect(body.data.success).toBe(true);
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
    });
});
