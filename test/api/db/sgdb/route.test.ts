import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const searchGame = vi.fn(async (): Promise<unknown[]> => []);
    const getGameById = vi.fn(async () => ({}));
    const getGridsById = vi.fn(async (): Promise<unknown[]> => []);

    return {
        SGDBClient: {
            searchGame,
            getGameById,
            getGridsById,
        },
    };
});

vi.mock("@/lib/vndb-client", () => ({
    SGDBClient: mocks.SGDBClient,
}));

import { GET, POST } from "@/app/api/db/sgdb/route";

const createPostRequest = (
    payload: unknown,
    rejectJson = false,
): NextRequest => {
    return {
        json: rejectJson
            ? async () => Promise.reject(new Error("invalid json"))
            : async () => payload,
        nextUrl: new URL("http://localhost/api/db/sgdb"),
    } as NextRequest;
};

const createGetRequest = (id?: string): NextRequest => {
    const url = new URL("http://localhost/api/db/sgdb");
    if (id !== undefined) {
        url.searchParams.set("id", id);
    }
    return {
        nextUrl: url,
    } as NextRequest;
};

describe("app/api/db/sgdb route", () => {
    beforeEach(() => {
        mocks.SGDBClient.searchGame.mockClear();
        mocks.SGDBClient.getGameById.mockClear();
        mocks.SGDBClient.getGridsById.mockClear();
    });

    test("POST returns 400 when keyword is empty", async () => {
        const response = await POST(createPostRequest({ keyword: "   " }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Missing keyword parameter" });
        expect(mocks.SGDBClient.searchGame).not.toHaveBeenCalled();
    });

    test("POST searches game and returns total", async () => {
        // Step 1: 准备 SGDB 搜索结果。
        mocks.SGDBClient.searchGame.mockResolvedValueOnce([
            { id: 1, name: "Game A" },
            { id: 2, name: "Game B" },
        ]);

        // Step 2: 调用 POST。
        const response = await POST(createPostRequest({ keyword: "  game  " }));
        const body = await response.json();

        // Step 3: 断言关键字会 trim，并返回 total。
        expect(response.status).toBe(200);
        expect(mocks.SGDBClient.searchGame).toHaveBeenCalledWith("game");
        expect(body).toEqual({
            data: [
                { id: 1, name: "Game A" },
                { id: 2, name: "Game B" },
            ],
            total: 2,
        });
    });

    test("POST returns 500 when SGDB search throws", async () => {
        mocks.SGDBClient.searchGame.mockRejectedValueOnce(
            new Error("search failed"),
        );

        const response = await POST(createPostRequest({ keyword: "game" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "search failed" });
    });

    test("GET returns 400 when id is invalid", async () => {
        const response = await GET(createGetRequest("abc"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid id parameter" });
    });

    test("GET returns game detail with grids", async () => {
        mocks.SGDBClient.getGameById.mockResolvedValueOnce({
            id: 99,
            name: "Neko",
        });
        mocks.SGDBClient.getGridsById.mockResolvedValueOnce([{
            id: 1,
            score: 10,
        }]);

        const response = await GET(createGetRequest("99"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.SGDBClient.getGameById).toHaveBeenCalledWith(99);
        expect(mocks.SGDBClient.getGridsById).toHaveBeenCalledWith(99);
        expect(body).toEqual({
            data: {
                game: { id: 99, name: "Neko" },
                grids: [{ id: 1, score: 10 }],
            },
        });
    });

    test("GET returns 500 when SGDB detail query throws", async () => {
        mocks.SGDBClient.getGameById.mockRejectedValueOnce(
            new Error("detail failed"),
        );

        const response = await GET(createGetRequest("99"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "detail failed" });
    });
});
