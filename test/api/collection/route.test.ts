import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        insertShouldThrow: false,
        insertReturningRows: [{ id: 7, name: "New Collection" }],
        insertCalls: [] as Array<{ table: unknown; valuesArg: unknown }>,
        nowIso: "2026-01-01T00:00:00.000Z",
    };

    const dequeueSelect = () => {
        const item = state.selectQueue.shift();
        if (!item) {
            return [];
        }
        if (item instanceof Error) {
            throw item;
        }
        return item;
    };

    const select = vi.fn(() => {
        return {
            from: vi.fn(() => ({
                orderBy: vi.fn(async () => dequeueSelect()),
                where: vi.fn(() => ({
                    limit: vi.fn(async () => dequeueSelect()),
                })),
                innerJoin: vi.fn(() => ({
                    leftJoin: vi.fn(() => ({
                        orderBy: vi.fn(async () => dequeueSelect()),
                    })),
                })),
            })),
        };
    });

    const insert = vi.fn((table: unknown) => {
        return {
            values: vi.fn((valuesArg: unknown) => {
                state.insertCalls.push({ table, valuesArg });
                if (state.insertShouldThrow) {
                    throw new Error("insert failed");
                }
                return {
                    returning: vi.fn(async () => state.insertReturningRows),
                };
            }),
        };
    });

    return {
        state,
        db: { select, insert },
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("dayjs", () => ({
    default: vi.fn(() => ({
        toISOString: () => mocks.state.nowIso,
    })),
}));

import { GET, POST } from "@/app/api/collection/route";

const createRequest = (payload: unknown, rejectJson = false): NextRequest => {
    return {
        json: rejectJson
            ? async () => Promise.reject(new Error("invalid json"))
            : async () => payload,
    } as NextRequest;
};

describe("app/api/collection route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.insertShouldThrow = false;
        mocks.state.insertReturningRows = [{ id: 7, name: "New Collection" }];
        mocks.state.insertCalls = [];
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";

        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
    });

    test("GET returns empty list when no collections", async () => {
        mocks.state.selectQueue.push([]);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: [] });
        expect(mocks.db.select).toHaveBeenCalledTimes(1);
    });

    test("GET returns collections with grouped games and first cover", async () => {
        mocks.state.selectQueue.push(
            [
                {
                    id: 2,
                    name: "Favorites",
                    createdAt: "2025-01-01",
                    updatedAt: "2025-01-02",
                },
                {
                    id: 1,
                    name: "Backlog",
                    createdAt: "2024-01-01",
                    updatedAt: "2024-01-02",
                },
            ],
            [
                {
                    linkId: 11,
                    collectionId: 2,
                    gameId: 100,
                    gameName: "Game A",
                    gameCover: "cover-a.jpg",
                    gameIcon: "icon-a.png",
                    gameDate: "2025-06-01",
                    gameAddedAt: "2025-06-02",
                    gameLastRunAt: "2025-06-03",
                    gamePlayTime: 120,
                    gameRating: 9,
                },
                {
                    linkId: 12,
                    collectionId: 2,
                    gameId: 101,
                    gameName: "Game B",
                    gameCover: null,
                    gameIcon: null,
                    gameDate: null,
                    gameAddedAt: null,
                    gameLastRunAt: null,
                    gamePlayTime: null,
                    gameRating: null,
                },
            ],
        );

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.db.select).toHaveBeenCalledTimes(2);
        expect(body).toEqual({
            data: [
                {
                    id: 2,
                    name: "Favorites",
                    createdAt: "2025-01-01",
                    updatedAt: "2025-01-02",
                    games: [
                        {
                            linkId: 11,
                            id: 100,
                            name: "Game A",
                            cover: "cover-a.jpg",
                            icon: "icon-a.png",
                            date: "2025-06-01",
                            addedAt: "2025-06-02",
                            lastRunAt: "2025-06-03",
                            playTime: 120,
                            rating: 9,
                        },
                        {
                            linkId: 12,
                            id: 101,
                            name: "Game B",
                            cover: "",
                            icon: "",
                            date: "",
                            addedAt: "",
                            lastRunAt: "",
                            playTime: 0,
                            rating: 0,
                        },
                    ],
                    firstGameCover: "cover-a.jpg",
                },
                {
                    id: 1,
                    name: "Backlog",
                    createdAt: "2024-01-01",
                    updatedAt: "2024-01-02",
                    games: [],
                    firstGameCover: "",
                },
            ],
        });
    });

    test("GET returns 500 when select fails", async () => {
        mocks.state.selectQueue.push(new Error("select failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get collections" });
    });

    test("POST returns 400 when name is empty", async () => {
        const response = await POST(createRequest({ name: "   " }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "收藏夹名称不能为空" });
        expect(mocks.db.select).not.toHaveBeenCalled();
        expect(mocks.db.insert).not.toHaveBeenCalled();
    });

    test("POST returns existing collection when name already exists", async () => {
        mocks.state.selectQueue.push([{ id: 3, name: "Favorites" }]);

        const response = await POST(createRequest({ name: " Favorites " }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { id: 3, name: "Favorites" } });
        expect(mocks.db.insert).not.toHaveBeenCalled();
    });

    test("POST creates collection when name does not exist", async () => {
        mocks.state.selectQueue.push([]);
        mocks.state.insertReturningRows = [{ id: 8, name: "New Collection" }];
        mocks.state.nowIso = "2026-05-01T10:20:30.000Z";

        const response = await POST(
            createRequest({ name: " New Collection " }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { id: 8, name: "New Collection" } });
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
        expect(mocks.state.insertCalls).toHaveLength(1);
        expect(mocks.state.insertCalls[0]?.valuesArg).toEqual({
            name: "New Collection",
            createdAt: "2026-05-01T10:20:30.000Z",
            updatedAt: "2026-05-01T10:20:30.000Z",
        });
    });

    test("POST returns 500 when insert fails", async () => {
        mocks.state.selectQueue.push([]);
        mocks.state.insertShouldThrow = true;

        const response = await POST(createRequest({ name: "Any Name" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to create collection" });
    });

    test("POST handles invalid JSON body", async () => {
        const response = await POST(createRequest({}, true));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "收藏夹名称不能为空" });
    });
});
