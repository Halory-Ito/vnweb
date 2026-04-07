import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const SGDBClient = {
        searchGame: vi.fn(async () =>
            [] as Array<{ id: number; name: string }>
        ),
        getGridsById: vi.fn(async () => [] as unknown[]),
        getHeroesById: vi.fn(async () => [] as unknown[]),
        getIconsById: vi.fn(async () => [] as unknown[]),
        getLogosById: vi.fn(async () => [] as unknown[]),
    };
    return { SGDBClient };
});

vi.mock("@/lib/vndb-client", () => ({ SGDBClient: mocks.SGDBClient }));

import { POST } from "@/app/api/game/image-search/route";

const createRequest = (payload: unknown): NextRequest => {
    return { json: async () => payload } as NextRequest;
};

describe("app/api/game/image-search POST", () => {
    beforeEach(() => {
        mocks.SGDBClient.searchGame.mockClear();
        mocks.SGDBClient.getGridsById.mockClear();
        mocks.SGDBClient.getHeroesById.mockClear();
        mocks.SGDBClient.getIconsById.mockClear();
        mocks.SGDBClient.getLogosById.mockClear();
    });

    test("returns 400 when keyword is empty", async () => {
        const response = await POST(createRequest({ keyword: "" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "请输入名称或 id" });
    });

    test("returns 400 for unsupported source", async () => {
        const response = await POST(
            createRequest({ source: "vndb", keyword: "game" }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("暂不支持的数据源");
    });

    test("searches by numeric keyword and returns normalized cover images", async () => {
        // Step 1: 数字关键字直接作为 game id，不走 searchGame。
        mocks.SGDBClient.getGridsById.mockResolvedValueOnce([
            {
                id: 1,
                url: "https://img/a.jpg",
                thumb: "https://img/a_t.jpg",
                width: 100,
                height: 50,
            },
            {
                id: 2,
                url: "https://img/b.jpg",
                thumb: "https://img/b_t.jpg",
                width: 120,
                height: 60,
            },
        ]);

        // Step 2: 调用图片搜索。
        const response = await POST(
            createRequest({
                source: "steamgriddb",
                keyword: "123",
                imageType: "cover",
            }),
        );
        const body = await response.json();

        // Step 3: 断言 game 与图片列表。
        expect(response.status).toBe(200);
        expect(mocks.SGDBClient.searchGame).not.toHaveBeenCalled();
        expect(mocks.SGDBClient.getGridsById).toHaveBeenCalledWith(123);
        expect(body.data.game).toEqual({ id: 123, name: "#123" });
        expect(body.data.items).toHaveLength(2);
    });

    test("returns empty list when keyword has no matched game", async () => {
        mocks.SGDBClient.searchGame.mockResolvedValueOnce([]);

        const response = await POST(
            createRequest({ source: "steamgriddb", keyword: "unknown" }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { game: null, items: [] } });
    });

    test("returns 500 when sgdb call throws", async () => {
        mocks.SGDBClient.searchGame.mockRejectedValueOnce(
            new Error("sgdb failed"),
        );

        const response = await POST(
            createRequest({ source: "steamgriddb", keyword: "x" }),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "sgdb failed" });
    });
});
