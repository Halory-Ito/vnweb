import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        txInsertCalls: [] as unknown[],
    };

    const take = () => {
        const item = state.selectQueue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(async () => take()),
            })),
        })),
    }));

    const makeTx = () => ({
        insert: vi.fn(() => ({
            values: vi.fn((valuesArg: unknown) => {
                state.txInsertCalls.push(valuesArg);
                return {
                    returning: vi.fn(async () => [{ id: 100 }]),
                    onConflictDoNothing: vi.fn(async () => undefined),
                };
            }),
        })),
    });

    const transaction = vi.fn(async (cb: (tx: any) => Promise<void>) => {
        const tx = makeTx();
        await cb(tx);
    });

    const normalizeSteamId = vi.fn((v: unknown) => String(v ?? "").trim());
    const isValidSteamUid = vi.fn(() => true);
    const getSteamApiKey = vi.fn(() => "steam-key");
    const getCachedOwnedGame = vi.fn(() => null);
    const fetchOwnedGames = vi.fn(async () => [] as any[]);
    const fetchSteamAppDetails = vi.fn(async () => ({
        name: "Steam Game",
        short_description: "desc",
        release_date: { date: "2025-01-01" },
        header_image: "cover.jpg",
        developers: ["Dev"],
        publishers: ["Pub"],
        website: "https://official.example.com",
        movies: [{ name: "PV1", hls_h264: "https://pv/1.m3u8" }],
        platforms: { windows: true, mac: false, linux: true },
    }));
    const toSteamCoverUrl = vi.fn((appid: number) => `cover-${appid}`);
    const toSteamIconUrl = vi.fn((appid: number, hash?: string) =>
        `icon-${appid}-${hash || ""}`
    );
    const toSteamLogoUrl = vi.fn((appid: number, hash?: string) =>
        `logo-${appid}-${hash || ""}`
    );
    const toSteamStoreUrl = vi.fn((appid: number) =>
        `https://store.steampowered.com/app/${appid}`
    );
    const getEnabledProxySettings = vi.fn(async () => null);

    return {
        state,
        db: { select, transaction },
        normalizeSteamId,
        isValidSteamUid,
        getSteamApiKey,
        getCachedOwnedGame,
        fetchOwnedGames,
        fetchSteamAppDetails,
        toSteamCoverUrl,
        toSteamIconUrl,
        toSteamLogoUrl,
        toSteamStoreUrl,
        getEnabledProxySettings,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "@/lib/settings/proxy-settings",
    () => ({ getEnabledProxySettings: mocks.getEnabledProxySettings }),
);
vi.mock("@/app/api/game/steam-import/_shared", () => ({
    normalizeSteamId: mocks.normalizeSteamId,
    isValidSteamUid: mocks.isValidSteamUid,
    getSteamApiKey: mocks.getSteamApiKey,
    getCachedOwnedGame: mocks.getCachedOwnedGame,
    fetchOwnedGames: mocks.fetchOwnedGames,
    fetchSteamAppDetails: mocks.fetchSteamAppDetails,
    toSteamCoverUrl: mocks.toSteamCoverUrl,
    toSteamIconUrl: mocks.toSteamIconUrl,
    toSteamLogoUrl: mocks.toSteamLogoUrl,
    toSteamStoreUrl: mocks.toSteamStoreUrl,
}));
vi.mock("./_shared", () => ({
    normalizeSteamId: mocks.normalizeSteamId,
    isValidSteamUid: mocks.isValidSteamUid,
    getSteamApiKey: mocks.getSteamApiKey,
    getCachedOwnedGame: mocks.getCachedOwnedGame,
    fetchOwnedGames: mocks.fetchOwnedGames,
    fetchSteamAppDetails: mocks.fetchSteamAppDetails,
    toSteamCoverUrl: mocks.toSteamCoverUrl,
    toSteamIconUrl: mocks.toSteamIconUrl,
    toSteamLogoUrl: mocks.toSteamLogoUrl,
    toSteamStoreUrl: mocks.toSteamStoreUrl,
}));

import { POST } from "@/app/api/game/steam-import/route";

const createRequest = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("app/api/game/steam-import POST", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.txInsertCalls = [];

        Object.values(mocks).forEach((fn) => {
            if (typeof fn === "function" && "mockClear" in fn) {
                (fn as any).mockClear();
            }
        });
    });

    test("returns 400 for invalid steam uid", async () => {
        mocks.isValidSteamUid.mockReturnValueOnce(false);

        const response = await POST(
            createRequest({ steamId: "bad", appid: 10 }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("Steam UID");
    });

    test("returns 400 for invalid appid", async () => {
        const response = await POST(
            createRequest({ steamId: "123", appid: 0 }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "无效的 appid" });
    });

    test("returns 500 when steam api key is missing", async () => {
        mocks.getSteamApiKey.mockReturnValueOnce("");

        const response = await POST(
            createRequest({ steamId: "123", appid: 10 }),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("STEAM_API_KEY");
    });

    test("skips when game already exists by website", async () => {
        mocks.state.selectQueue.push([{ id: 1 }]);

        const response = await POST(
            createRequest({ steamId: "123", appid: 10 }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.status).toBe("skipped");
    });

    test("imports steam game successfully", async () => {
        // Step 1: 网站不存在，继续导入。
        mocks.state.selectQueue.push([]);
        mocks.fetchOwnedGames.mockResolvedValueOnce([
            { appid: 10, img_icon_url: "iconhash", img_logo_url: "logohash" },
        ]);

        // Step 2: 调用导入。
        const response = await POST(
            createRequest({ steamId: "123", appid: 10, playtimeMinutes: 12 }),
        );
        const body = await response.json();

        // Step 3: 断言导入成功和核心写入调用。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: { appid: 10, status: "imported", playtimeSeconds: 720 },
        });
        expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
        expect(mocks.state.txInsertCalls.length).toBeGreaterThan(0);
    });
});
