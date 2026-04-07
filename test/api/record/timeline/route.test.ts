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

import { GET } from "@/app/api/record/timeline/route";

const createRequest = (range?: string, offset?: string): NextRequest => {
    const url = new URL("http://localhost/api/record/timeline");
    if (range) {
        url.searchParams.set("range", range);
    }
    if (offset) {
        url.searchParams.set("offset", offset);
    }
    return { nextUrl: url } as NextRequest;
};

describe("app/api/record/timeline GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns weekly timeline by default", async () => {
        const start = dayjs().startOf("week");
        const d1 = start.add(1, "day").format("YYYY-MM-DD");
        const d2 = start.add(2, "day").format("YYYY-MM-DD");

        // Step 1: 准备周内记录 + 一条无效记录。
        mocks.state.queue.push([
            { playDate: d1, playTime: 3600 },
            { playDate: d1, playTime: 1800 },
            { playDate: d2, playTime: 7200 },
            { playDate: "invalid", playTime: 123 },
        ]);

        // Step 2: 调用 GET（range 缺省 => week）。
        const response = await GET(createRequest());
        const body = await response.json();

        // Step 3: 校验时间线聚合。
        expect(response.status).toBe(200);
        expect(body.data.range).toBe("week");
        expect(body.data.points).toHaveLength(7);
        expect(body.data.totalSeconds).toBe(12600);
        expect(body.data.totalHours).toBe(3.5);
        expect(body.data.activeCount).toBe(2);
        expect(body.data.peakSeconds).toBe(7200);
    });

    test("returns yearly timeline with 12 points", async () => {
        const now = dayjs();
        const jan = now.startOf("year").add(10, "day").format("YYYY-MM-DD");
        const mar = now.startOf("year").add(2, "month").add(5, "day").format(
            "YYYY-MM-DD",
        );

        mocks.state.queue.push([
            { playDate: jan, playTime: 3600 },
            { playDate: mar, playTime: 1800 },
        ]);

        const response = await GET(createRequest("year", "0"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.range).toBe("year");
        expect(body.data.points).toHaveLength(12);
        expect(body.data.totalSeconds).toBe(5400);
    });

    test("returns 500 when query fails", async () => {
        mocks.state.queue.push(new Error("timeline failed"));

        const response = await GET(createRequest("month", "-1"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to fetch timeline" });
    });
});
