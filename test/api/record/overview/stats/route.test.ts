import dayjs from "dayjs";
import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        queue: [] as QueueItem[],
    };

    const select = vi.fn(() => ({
        from: vi.fn(async () => {
            const item = state.queue.shift();
            if (!item) {
                return [];
            }
            if (item instanceof Error) {
                throw item;
            }
            return item;
        }),
    }));

    return { state, db: { select } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/record/overview/stats/route";

describe("app/api/record/overview/stats GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns aggregated overview stats", async () => {
        const now = dayjs();
        const thisYearDate = now.startOf("year").add(1, "month").format(
            "YYYY-MM-DD HH:mm:ss",
        );

        // 调用顺序: games -> plays -> records -> gameRows
        mocks.state.queue.push(
            [{ id: 1 }, { id: 2 }],
            [
                { gameId: 1, totalPlayTime: 7200, playCount: 3, rating: 8.5 },
                { gameId: 2, totalPlayTime: 3600, playCount: 1, rating: 0 },
            ],
            [
                { playDate: thisYearDate, playTime: 3600 },
                { playDate: thisYearDate, playTime: 1800 },
            ],
            [
                { id: 1, name: "A", nameCn: "游戏A", cover: "a.jpg" },
                { id: 2, name: "B", nameCn: "", cover: "" },
            ],
        );

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.totalGames).toBe(2);
        expect(body.data.totalPlayTime).toBe(3);
        expect(body.data.totalPlayCount).toBe(4);
        expect(body.data.totalDays).toBe(1);
        expect(body.data.playTimeRank[0]).toMatchObject({ id: "1", stat: 2 });
        expect(body.data.ratingRank[0]).toMatchObject({ id: "1", stat: 8.5 });
        expect(body.data.monthlyDurationDistribution).toHaveLength(12);
        expect(body.data.hourlyTimeDistribution).toHaveLength(24);
    });

    test("returns 500 when any query fails", async () => {
        mocks.state.queue.push(new Error("db crashed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to fetch overview stats" });
    });
});
