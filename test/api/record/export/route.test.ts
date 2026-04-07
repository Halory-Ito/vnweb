import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        playsQueue: [] as QueueItem[],
        gamesQueue: [] as QueueItem[],
        recordsQueue: [] as QueueItem[],
        selectCall: 0,
    };

    const dequeue = (queue: QueueItem[]) => {
        const item = queue.shift();
        if (!item) {
            return [];
        }
        if (item instanceof Error) {
            throw item;
        }
        return item;
    };

    const select = vi.fn(() => {
        state.selectCall += 1;
        const call = state.selectCall;

        // 第 1 次 select: GamePlay，链式到 orderBy。
        if (call === 1) {
            return {
                from: vi.fn(() => ({
                    orderBy: vi.fn(async () => dequeue(state.playsQueue)),
                })),
            };
        }

        // 第 2 次 select: GameInfo，直接 await from(...)。
        if (call === 2) {
            return {
                from: vi.fn(async () => dequeue(state.gamesQueue)),
            };
        }

        // 第 3 次 select: GameRecord，query 对象支持 where + await。
        return {
            from: vi.fn(() => {
                let query: Promise<unknown> & {
                    where: ReturnType<typeof vi.fn>;
                };
                query = Object.assign(
                    Promise.resolve(dequeue(state.recordsQueue)),
                    {
                        where: vi.fn(() => query),
                    },
                );
                return query;
            }),
        };
    });

    return {
        state,
        db: { select },
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/record/export/route";

const createRequest = (year?: string): NextRequest => {
    const url = new URL("http://localhost/api/record/export");
    if (year !== undefined) {
        url.searchParams.set("year", year);
    }
    return { nextUrl: url } as NextRequest;
};

describe("app/api/record/export GET", () => {
    beforeEach(() => {
        mocks.state.playsQueue = [];
        mocks.state.gamesQueue = [];
        mocks.state.recordsQueue = [];
        mocks.state.selectCall = 0;
        mocks.db.select.mockClear();
    });

    test("returns export data with entries and topGames", async () => {
        // Step 1: 准备播放、游戏、记录数据。
        mocks.state.playsQueue.push([
            {
                gameId: 1,
                totalPlayTime: 7200,
                rating: 8,
                lastLaunchedAt: "2026-03-01",
            },
            {
                gameId: 2,
                totalPlayTime: 3600,
                rating: 0,
                lastLaunchedAt: "2026-02-01",
            },
        ]);
        mocks.state.gamesQueue.push([
            {
                id: 1,
                name: "A",
                nameCn: "游戏A",
                cover: "a.jpg",
                tags: "tag1, tag2",
                date: "2024-01-01",
                platforms: "pc, switch",
                developer: "DevA",
                publisher: "PubA",
                gameType: "VN",
            },
            {
                id: 2,
                name: "B",
                nameCn: "",
                cover: "",
                tags: "",
                date: "",
                platforms: "",
                developer: "",
                publisher: "",
                gameType: "",
            },
        ]);
        mocks.state.recordsQueue.push([
            { gameId: 1, playDate: "2026-03-03", playTime: 3600 },
            { gameId: 1, playDate: "2026-03-04", playTime: 1800 },
            { gameId: 2, playDate: "2026-03-05", playTime: 0 },
        ]);

        // Step 2: 调用导出接口。
        const response = await GET(createRequest());
        const body = await response.json();

        // Step 3: 断言聚合结果。
        expect(response.status).toBe(200);
        expect(body.data.year).toBe(null);
        expect(body.data.totalPlaySeconds).toBe(5400);
        expect(body.data.totalPlayHours).toBe(1.5);
        expect(body.data.totalPlayCount).toBe(3);
        expect(body.data.averageRating).toBe(8);
        expect(body.data.lastPlayedDate).toBe("2026-03-05");
        expect(body.data.topGames[0]).toMatchObject({
            title: "游戏A",
            playtime: 1.5,
        });
        expect(body.data.entries).toHaveLength(1);
        expect(body.data.entries[0]).toMatchObject({
            id: "1",
            title: "游戏A",
            totalPlaySeconds: 5400,
            totalPlayHours: 1.5,
            tags: ["tag1", "tag2"],
            platforms: ["pc", "switch"],
            developer: "DevA",
            publisher: "PubA",
            gameType: "VN",
        });
    });

    test("supports year parameter output", async () => {
        mocks.state.playsQueue.push([{
            gameId: 1,
            totalPlayTime: 3600,
            rating: 7,
        }]);
        mocks.state.gamesQueue.push([
            {
                id: 1,
                name: "A",
                nameCn: "",
                cover: "",
                tags: "",
                date: "",
                platforms: "",
                developer: "",
                publisher: "",
                gameType: "",
            },
        ]);
        mocks.state.recordsQueue.push([{
            gameId: 1,
            playDate: "2025-01-01",
            playTime: 3600,
        }]);

        const response = await GET(createRequest("2025"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.year).toBe(2025);
        expect(body.data.yearLabel).toBe("2025年");
    });

    test("returns 500 when query fails", async () => {
        mocks.state.playsQueue.push(new Error("export failed"));

        const response = await GET(createRequest());
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to fetch export report" });
    });
});
