import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const axiosGet = vi.fn(async (): Promise<{
        data: { total: number; items: Array<{ id?: number; name?: string }> };
    }> => ({ data: { total: 0, items: [] } }));
    const fetchSteamAppDetails = vi.fn(async (): Promise<
        Record<string, unknown> | null
    > => null);
    const toSteamStoreUrl = vi.fn((appid: number) =>
        `https://store.steampowered.com/app/${appid}`
    );
    const getEnabledProxySettings = vi.fn(async () => null);

    return {
        axiosGet,
        fetchSteamAppDetails,
        toSteamStoreUrl,
        getEnabledProxySettings,
    };
});

vi.mock("axios", () => ({ default: { get: mocks.axiosGet } }));
vi.mock(
    "@/lib/proxy-settings",
    () => ({ getEnabledProxySettings: mocks.getEnabledProxySettings }),
);
vi.mock("@/app/api/game/steam-import/_shared", () => ({
    fetchSteamAppDetails: mocks.fetchSteamAppDetails,
    toSteamStoreUrl: mocks.toSteamStoreUrl,
}));
vi.mock("../_shared", () => ({
    fetchSteamAppDetails: mocks.fetchSteamAppDetails,
    toSteamStoreUrl: mocks.toSteamStoreUrl,
}));

import { GET, POST } from "@/app/api/game/steam-import/name-search/route";

const createPostRequest = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);
const createGetRequest = (id?: string): NextRequest => {
    const url = new URL("http://localhost/api/game/steam-import/name-search");
    if (id !== undefined) url.searchParams.set("id", id);
    return { nextUrl: url } as NextRequest;
};

describe("app/api/game/steam-import/name-search route", () => {
    beforeEach(() => {
        Object.values(mocks).forEach((fn) => {
            if (typeof fn === "function" && "mockClear" in fn) {
                (fn as any).mockClear();
            }
        });
    });

    test("POST returns empty result when keyword is blank", async () => {
        const response = await POST(createPostRequest({ keyword: " " }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { total: 0, items: [] } });
        expect(mocks.axiosGet).not.toHaveBeenCalled();
    });

    test("POST searches by name and slices by offset/limit", async () => {
        // Step 1: 模拟 Steam 商店搜索返回。
        mocks.axiosGet.mockResolvedValueOnce({
            data: {
                total: 3,
                items: [
                    { id: 11, name: "A" },
                    { id: 12, name: "B" },
                    { id: 13, name: "C" },
                ],
            },
        });

        // Step 2: 调用搜索接口。
        const response = await POST(
            createPostRequest({ keyword: "abc", offset: 1, limit: 2 }),
        );
        const body = await response.json();

        // Step 3: 断言分页切片结果。
        expect(response.status).toBe(200);
        expect(body.data.total).toBe(3);
        expect(body.data.items).toHaveLength(2);
        expect(body.data.items[0]).toMatchObject({ id: "12", name: "B" });
    });

    test("GET returns 400 for invalid appid", async () => {
        const response = await GET(createGetRequest("x"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "无效的 appid" });
    });

    test("GET returns 404 when details are not found", async () => {
        mocks.fetchSteamAppDetails.mockResolvedValueOnce(null);

        const response = await GET(createGetRequest("10"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "未找到 Steam 游戏详情" });
    });

    test("GET returns normalized steam game metadata", async () => {
        mocks.fetchSteamAppDetails.mockResolvedValueOnce({
            name: "Steam Game",
            short_description: "desc",
            header_image: "cover.jpg",
            release_date: { date: "2025-01-01" },
            platforms: { windows: true, mac: true, linux: false },
            developers: ["Dev"],
            publishers: ["Pub"],
        });

        const response = await GET(createGetRequest("10"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.name).toBe("Steam Game");
        expect(body.data.platforms).toEqual(["Windows", "macOS"]);
        expect(body.data.websites).toEqual([{
            Steam: "https://store.steampowered.com/app/10",
        }]);
    });
});
