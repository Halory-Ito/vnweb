import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        queue: [] as QueueItem[],
        call: 0,
    };

    const nextResult = () => {
        const item = state.queue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => {
        state.call += 1;
        const call = state.call;

        if (call === 1) {
            return {
                from: vi.fn(() => ({
                    leftJoin: vi.fn(() => ({
                        orderBy: vi.fn(async () => nextResult()),
                    })),
                })),
            };
        }

        if (call === 2) {
            return {
                from: vi.fn(() => ({
                    orderBy: vi.fn(async () => nextResult()),
                })),
            };
        }

        if (call === 3) {
            return {
                from: vi.fn(() => ({
                    innerJoin: vi.fn(() => ({
                        orderBy: vi.fn(async () => nextResult()),
                    })),
                })),
            };
        }

        return {
            from: vi.fn(() => ({
                innerJoin: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => ({
                            limit: vi.fn(async () => nextResult()),
                        })),
                    })),
                })),
            })),
        };
    });

    return { state, db: { select } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/game/sidebar/route";

const createRequest = (query?: Record<string, string>): NextRequest => {
    const url = new URL("http://localhost/api/game/sidebar");
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            url.searchParams.set(k, v);
        }
    }
    return { nextUrl: url } as NextRequest;
};

describe("app/api/game/sidebar GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.state.call = 0;
        mocks.db.select.mockClear();
    });

    test("returns search mode when search param is provided", async () => {
        // 只需要第 1 次查询结果（allGames），函数会提前返回。
        mocks.state.queue.push([
            {
                id: 1,
                name: "Clannad",
                nameCn: "团子大家族",
                icon: "",
                date: "2020-01-01",
                developer: "Key",
                publisher: "P",
                gameType: "VN",
                platforms: "pc",
                tags: "tag1",
                originalPainter: "x",
                script: "y",
                music: "z",
                gameEngine: "krkr",
                programmer: "p",
                playStatus: 1,
            },
        ]);

        const response = await GET(createRequest({ search: "团子" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.mode).toBe("search");
        expect(body.data.items[0].id).toBe("search-results");
        expect(body.data.items[0].items[0]).toEqual({
            id: "1",
            title: "团子大家族",
            icon: "/file.svg",
        });
    });

    test("returns default mode with recent/all/collections", async () => {
        // 顺序: allGames -> collections -> collectionGameRows -> recentGameRows
        mocks.state.queue.push(
            [
                {
                    id: 1,
                    name: "A",
                    nameCn: "游戏A",
                    icon: "",
                    date: "2020-01-01",
                    developer: "dev",
                    publisher: "pub",
                    gameType: "VN",
                    platforms: "pc",
                    tags: "tag1",
                    originalPainter: "",
                    script: "",
                    music: "",
                    gameEngine: "",
                    programmer: "",
                    playStatus: 1,
                },
            ],
            [{ id: 7, name: "收藏夹A" }],
            [
                {
                    collectionId: 7,
                    gameId: 1,
                    gameName: "A",
                    gameNameCn: "游戏A",
                    gameIcon: "",
                },
            ],
            [
                {
                    gameId: 1,
                    lastLaunchedAt: "2026-01-01",
                    gameName: "A",
                    gameNameCn: "游戏A",
                    gameIcon: "",
                },
            ],
        );

        const response = await GET(createRequest());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.mode).toBe("default");
        expect(body.data.items[0].id).toBe("recent");
        expect(body.data.items[1].id).toBe("all");
        expect(body.data.items[2].id).toBe("collection-7");
        expect(body.data.items[2].items).toHaveLength(1);
    });

    test("returns 500 when query fails", async () => {
        mocks.state.queue.push(new Error("sidebar failed"));

        const response = await GET(createRequest());
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get sidebar data" });
    });
});
