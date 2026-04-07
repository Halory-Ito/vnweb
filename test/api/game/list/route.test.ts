import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        gameQueue: [] as QueueItem[],
        playQueue: [] as QueueItem[],
        selectCount: 0,
    };

    const take = (queue: QueueItem[]) => {
        const item = queue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => {
        state.selectCount += 1;
        if (state.selectCount === 1) {
            return {
                from: vi.fn(() => ({
                    orderBy: vi.fn(async () => take(state.gameQueue)),
                })),
            };
        }
        return {
            from: vi.fn(async () => take(state.playQueue)),
        };
    });

    return { state, db: { select } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/game/list/route";

describe("app/api/game/list GET", () => {
    beforeEach(() => {
        mocks.state.gameQueue = [];
        mocks.state.playQueue = [];
        mocks.state.selectCount = 0;
        mocks.db.select.mockClear();
    });

    test("returns merged game card list", async () => {
        mocks.state.gameQueue.push([
            {
                id: 1,
                name: "A",
                nameCn: "游戏A",
                cover: "a.jpg",
                date: "2025-01-01",
                createdAt: "2026-01-01",
            },
            {
                id: 2,
                name: "B",
                nameCn: "",
                cover: "",
                date: "",
                createdAt: "2026-01-02",
            },
        ]);
        mocks.state.playQueue.push([
            {
                gameId: 1,
                totalPlayTime: 3600,
                rating: 8,
                lastLaunchedAt: "2026-03-01",
            },
        ]);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toEqual([
            {
                id: "1",
                title: "游戏A",
                cover: "a.jpg",
                publishAt: "2025-01-01",
                lastRunAt: "2026-03-01",
                addedAt: "2026-01-01",
                playTime: 3600,
                rating: 8,
            },
            {
                id: "2",
                title: "B",
                cover: "/cover/wa2.jpg",
                publishAt: "",
                lastRunAt: "",
                addedAt: "2026-01-02",
                playTime: 0,
                rating: 0,
            },
        ]);
    });

    test("returns 500 when query fails", async () => {
        mocks.state.gameQueue.push(new Error("list failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get game card list" });
    });
});
