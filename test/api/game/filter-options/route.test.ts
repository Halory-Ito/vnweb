import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = { queue: [] as QueueItem[] };

    const select = vi.fn(() => ({
        from: vi.fn(async () => {
            const item = state.queue.shift();
            if (!item) return [];
            if (item instanceof Error) throw item;
            return item;
        }),
    }));

    return { state, db: { select } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/game/filter-options/route";

describe("app/api/game/filter-options GET", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns normalized unique options", async () => {
        // 核心校验：csv 拆分、去重、排序。
        mocks.state.queue.push([
            {
                date: "2025-01-01",
                developer: " A社 ",
                publisher: "P1",
                category: "VN",
                platform: "pc, switch",
                tags: "tag1, tag2",
                originalPainter: "画师A",
                script: "脚本A",
                music: "音乐A",
                engine: "krkr",
                planning: "策划A",
            },
            {
                date: "2024-01-01",
                developer: "A社",
                publisher: "P2",
                category: "RPG",
                platform: "pc",
                tags: "tag2, tag3",
                originalPainter: "画师B",
                script: "脚本B",
                music: "音乐B",
                engine: "unity",
                planning: "策划B",
            },
        ]);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.releaseDates).toEqual(["2024-01-01", "2025-01-01"]);
        expect(body.data.platforms).toEqual(["pc", "switch"]);
        expect(body.data.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    test("returns 500 when db query fails", async () => {
        mocks.state.queue.push(new Error("db failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get filter options" });
    });
});
