import type { NextRequest } from "next/server";
import dayjs from "dayjs";
import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = { queue: [] as QueueItem[] };

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

import { GET } from "@/app/api/record/year-report/route";

const createRequest = (offset?: string): NextRequest => {
    const url = new URL("http://localhost/api/record/year-report");
    if (offset !== undefined) {
        url.searchParams.set("offset", offset);
    }
    return { nextUrl: url } as NextRequest;
};

describe("app/api/record/year-report GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns yearly monthly stats and distributions", async () => {
        const now = dayjs();
        const yJan = now.startOf("year").add(3, "day").format("YYYY-MM-DD");
        const yFeb = now.startOf("year").add(1, "month").add(2, "day").format(
            "YYYY-MM-DD",
        );

        // 顺序: records -> gameRows
        mocks.state.queue.push(
            [
                { gameId: 1, playDate: yJan, playTime: 3600 },
                { gameId: 1, playDate: yJan, playTime: 1800 },
                { gameId: 2, playDate: yFeb, playTime: 7200 },
            ],
            [
                {
                    id: 1,
                    name: "A",
                    nameCn: "游戏A",
                    cover: "a.jpg",
                    gameType: "VN",
                    publisher: "P1",
                },
                {
                    id: 2,
                    name: "B",
                    nameCn: "",
                    cover: "",
                    gameType: "RPG",
                    publisher: "P2",
                },
            ],
        );

        const response = await GET(createRequest("2"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.offset).toBe(0);
        expect(body.data.monthlyStats).toHaveLength(12);
        expect(body.data.distributionByType[0].key).toBe("RPG");
        expect(body.data.distributionByPublisher[0].key).toBe("P2");
        expect(body.data.gameRank[0]).toMatchObject({ id: "2", stat: 2 });
    });

    test("returns 500 when query fails", async () => {
        mocks.state.queue.push(new Error("year query failed"));

        const response = await GET(createRequest("-1"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to fetch year report" });
    });
});
