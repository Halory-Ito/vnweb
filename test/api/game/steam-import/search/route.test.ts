import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const normalizeSteamId = vi.fn((v: unknown) => String(v ?? "").trim());
    const isValidSteamUid = vi.fn(() => true);
    const getSteamApiKey = vi.fn(() => "steam-key");
    const fetchOwnedGames = vi.fn(async () => [] as any[]);
    const getImportedSteamAppIdSet = vi.fn(async () => new Set<number>());
    const toSteamCoverUrl = vi.fn((appid: number) => `cover-${appid}`);
    const toSteamIconUrl = vi.fn((appid: number, hash?: string) =>
        `icon-${appid}-${hash || ""}`
    );
    const toSteamLogoUrl = vi.fn((appid: number, hash?: string) =>
        `logo-${appid}-${hash || ""}`
    );
    const getEnabledProxySettings = vi.fn(async () => null);

    return {
        normalizeSteamId,
        isValidSteamUid,
        getSteamApiKey,
        fetchOwnedGames,
        getImportedSteamAppIdSet,
        toSteamCoverUrl,
        toSteamIconUrl,
        toSteamLogoUrl,
        getEnabledProxySettings,
    };
});

vi.mock("@/app/api/game/steam-import/_shared", () => ({
    normalizeSteamId: mocks.normalizeSteamId,
    isValidSteamUid: mocks.isValidSteamUid,
    getSteamApiKey: mocks.getSteamApiKey,
    fetchOwnedGames: mocks.fetchOwnedGames,
    getImportedSteamAppIdSet: mocks.getImportedSteamAppIdSet,
    toSteamCoverUrl: mocks.toSteamCoverUrl,
    toSteamIconUrl: mocks.toSteamIconUrl,
    toSteamLogoUrl: mocks.toSteamLogoUrl,
}));

vi.mock("../_shared", () => ({
    normalizeSteamId: mocks.normalizeSteamId,
    isValidSteamUid: mocks.isValidSteamUid,
    getSteamApiKey: mocks.getSteamApiKey,
    fetchOwnedGames: mocks.fetchOwnedGames,
    getImportedSteamAppIdSet: mocks.getImportedSteamAppIdSet,
    toSteamCoverUrl: mocks.toSteamCoverUrl,
    toSteamIconUrl: mocks.toSteamIconUrl,
    toSteamLogoUrl: mocks.toSteamLogoUrl,
}));

vi.mock("@/lib/settings/proxy-settings", () => ({
    getEnabledProxySettings: mocks.getEnabledProxySettings,
}));

import { POST } from "@/app/api/game/steam-import/search/route";

const createRequest = (payload: unknown): NextRequest => {
    return { json: async () => payload } as NextRequest;
};

describe("app/api/game/steam-import/search POST", () => {
    beforeEach(() => {
        Object.values(mocks).forEach((fn) => {
            if (typeof fn === "function" && "mockClear" in fn) {
                (fn as any).mockClear();
            }
        });
    });

    test("returns 400 for invalid steam uid", async () => {
        mocks.isValidSteamUid.mockReturnValueOnce(false);

        const response = await POST(createRequest({ steamId: "bad" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("Steam UID");
    });

    test("returns 500 when api key missing", async () => {
        mocks.getSteamApiKey.mockReturnValueOnce("");

        const response = await POST(createRequest({ steamId: "123" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("STEAM_API_KEY");
    });

    test("returns normalized owned game list", async () => {
        // Step 1: 准备 Steam 库与已导入集合。
        mocks.fetchOwnedGames.mockResolvedValueOnce([
            {
                appid: 10,
                name: " Game A ",
                playtime_forever: 12,
                img_icon_url: "i",
                img_logo_url: "l",
            },
            { appid: -1, name: "bad" },
        ]);
        mocks.getImportedSteamAppIdSet.mockResolvedValueOnce(new Set([10]));

        // Step 2: 调用接口。
        const response = await POST(createRequest({ steamId: "123" }));
        const body = await response.json();

        // Step 3: 断言过滤与格式化。
        expect(response.status).toBe(200);
        expect(body.data.total).toBe(1);
        expect(body.data.items[0]).toEqual({
            appid: 10,
            name: "Game A",
            playtimeMinutes: 12,
            coverUrl: "cover-10",
            iconUrl: "icon-10-i",
            logoUrl: "logo-10-l",
            alreadyImported: true,
        });
    });

    test("returns 500 when fetch owned games fails", async () => {
        mocks.fetchOwnedGames.mockRejectedValueOnce(new Error("steam failed"));

        const response = await POST(createRequest({ steamId: "123" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "steam failed" });
    });
});
