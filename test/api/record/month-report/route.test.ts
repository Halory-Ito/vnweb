import type { NextRequest } from "next/server";
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

import { GET } from "@/app/api/record/month-report/route";

const createRequest = (offset?: string): NextRequest => {
    const url = new URL("http://localhost/api/record/month-report");
    if (offset !== undefined) {
        url.searchParams.set("offset", offset);
    }
    return { nextUrl: url } as NextRequest;
};

describe("app/api/record/month-report GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("builds monthly stats, frequency and rank", async () => {
        const now = dayjs();
        const inMonthA = now.startOf("month").add(1, "day").format(
            "YYYY-MM-DD",
        );
        const inMonthB = now.startOf("month").add(2, "day").format(
            "YYYY-MM-DD",
        );
        const outOfMonth = now.subtract(2, "month").format("YYYY-MM-DD");

        // Step 1: 准备游玩记录和游戏信息。
        mocks.state.queue.push(
            [
                { gameId: 1, playDate: inMonthA, playTime: 3600 },
                { gameId: 1, playDate: inMonthA, playTime: 1800 },
                { gameId: 2, playDate: inMonthB, playTime: 7200 },
                { gameId: 3, playDate: outOfMonth, playTime: 9999 },
            ],
            [
                { id: 1, name: "A", nameCn: "游戏A", cover: "a.jpg" },
                { id: 2, name: "B", nameCn: "", cover: "" },
            ],
        );

        // Step 2: 调用 GET（正 offset 会被归一化为 0）。
        const response = await GET(createRequest("2"));
        const body = await response.json();

        // Step 3: 校验核心统计。
        expect(response.status).toBe(200);
        expect(body.data.offset).toBe(0);
        expect(body.data.dailyStats.length).toBe(now.daysInMonth());
        expect(body.data.gameFrequency[0]).toEqual({
            key: "1",
            label: "游戏A",
            count: 2,
        });
        expect(body.data.playTimeRank[0]).toMatchObject({
            id: "2",
            title: "B",
            stat: 2,
        });
    });

    test("returns 500 when query fails", async () => {
        mocks.state.queue.push(new Error("records query failed"));

        const response = await GET(createRequest());
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to fetch month report" });
    });
});
