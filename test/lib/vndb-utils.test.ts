import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    api: {
        request: vi.fn(),
    },
}));

vi.mock("@/lib/request-utils", () => ({ api: mocks.api }));

import {
    createGameInfoApi,
    getBGMSubjectByIdApi,
    getGameInfoByIdApi,
    getSGDBGameByIdApi,
    mapBGMSubjectToGameInfo,
    searchBGMSubjectsApi,
    searchGameByNameApi,
    searchSGDBGamesApi,
} from "@/lib/vndb-utils";

describe("lib/vndb-utils", () => {
    beforeEach(() => {
        mocks.api.request.mockReset();
    });

    test("mapBGMSubjectToGameInfo maps key fields", () => {
        const result = mapBGMSubjectToGameInfo({
            date: "2026-01-01",
            name: "Original",
            name_cn: "中文名",
            tags: [{ name: "tag1" }],
            infobox: [
                { key: "开发", value: "Dev" },
                { key: "平台", value: "PC" },
            ],
        } as any);

        expect(result.name).toBe("Original");
        expect(result.nameCn).toBe("中文名");
        expect(result.tags).toEqual(["tag1"]);
        expect(result.developer).toBe("Dev");
        expect(result.platforms).toContain("PC");
    });

    test("search wrappers map response payloads", async () => {
        // Step 1: mock BGM/SGDB 查询与详情响应。
        mocks.api.request
            .mockResolvedValueOnce({
                data: {
                    total: 1,
                    data: [{
                        id: 1,
                        name: "A",
                        infobox: [{ key: "开发", value: "Dev" }],
                    }],
                },
            })
            .mockResolvedValueOnce({ data: { id: 1, name: "A" } })
            .mockResolvedValueOnce({
                data: {
                    total: 1,
                    data: [{ id: 10, name: "SG", release_date: 1700000000 }],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        game: { name: "SG", release_date: 1700000000 },
                        grids: [{ url: "https://img" }],
                    },
                },
            });

        // Step 2: 调用并断言映射结果。
        expect((await searchBGMSubjectsApi("a")).items[0].id).toBe("1");
        expect((await getBGMSubjectByIdApi("1")).id).toBe(1);
        expect((await searchSGDBGamesApi("a")).items[0].name).toBe("SG");
        expect((await getSGDBGameByIdApi("10")).cover).toBe("https://img");
    });

    test("getGameInfoByIdApi handles provider branches", async () => {
        // Step 1: mock bangumi/vndb/steam/steamgriddb 分支响应。
        mocks.api.request
            .mockResolvedValueOnce({
                data: {
                    id: 1,
                    name: "BGM",
                    infobox: [],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    title: "VN",
                    alttitle: "VN-CN",
                    image: { url: "cover.jpg" },
                    developers: [{ name: "DevA" }],
                    tags: [{ name: "tag1" }],
                    aliases: ["alias"],
                    platforms: ["win"],
                    extlinks: [{
                        label: "Official",
                        url: "https://example.com",
                    }],
                },
            })
            .mockResolvedValueOnce({ data: { data: { name: "Steam" } } })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        game: { name: "SG", release_date: 1700000000 },
                        grids: [{ url: "sg.jpg" }],
                    },
                },
            });

        // Step 2: 调用各 provider。
        const bgm = await getGameInfoByIdApi("1", "bangumi");
        const vndb = await getGameInfoByIdApi("v1", "vndb");
        const steam = await getGameInfoByIdApi("10", "steam");
        const sgdb = await getGameInfoByIdApi("20", "steamgriddb");
        const unknown = await getGameInfoByIdApi("x", "unknown");

        // Step 3: 断言分支结果。
        expect(bgm?.name).toBe("BGM");
        expect(vndb?.name).toBe("VN");
        expect(vndb?.websites[0]).toEqual({ Official: "https://example.com" });
        expect((steam as any).name).toBe("Steam");
        expect(sgdb?.cover).toBe("sg.jpg");
        expect(unknown).toBeNull();
    });

    test("searchGameByNameApi handles all providers and fallback", async () => {
        // Step 1: 按调用顺序 mock bangumi/vndb/steamgriddb/steam。
        mocks.api.request
            .mockResolvedValueOnce({
                data: { total: 1, data: [{ id: 1, name: "B", infobox: [] }] },
            })
            .mockResolvedValueOnce({
                data: {
                    count: 1,
                    results: [{
                        id: "v1",
                        title: "VN",
                        developers: [{ name: "Dev" }],
                        released: "2024-01-01",
                    }],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    total: 2,
                    data: [
                        { id: 1, name: "SG-1", release_date: 1700000000 },
                        { id: 2, name: "SG-2", release_date: 1700000100 },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: { total: 1, items: [{ id: "s1", name: "Steam" }] },
                },
            });

        // Step 2: 执行搜索。
        const bgm = await searchGameByNameApi("k", "bangumi");
        const vndb = await searchGameByNameApi("k", "vndb");
        const sgdb = await searchGameByNameApi("k", "steamgriddb", 1, 1);
        const steam = await searchGameByNameApi("k", "steam");
        const unknown = await searchGameByNameApi("k", "igdb");

        // Step 3: 断言分支结果。
        expect(bgm.total).toBe(1);
        expect(vndb.items[0].id).toBe("v1");
        expect(sgdb.items).toHaveLength(1);
        expect(sgdb.items[0].name).toBe("SG-2");
        expect(steam.items[0].name).toBe("Steam");
        expect(unknown.items).toEqual([]);
    });

    test("createGameInfoApi forwards payload", async () => {
        mocks.api.request.mockResolvedValueOnce({ data: { data: { id: 99 } } });

        const result = await createGameInfoApi({ name: "G" } as any, {
            provider: "steam",
            externalId: "10",
        });

        expect(result.data.id).toBe(99);
        expect(mocks.api.request).toHaveBeenCalledWith(
            expect.objectContaining({ method: "POST", url: "/game" }),
        );
    });
});
