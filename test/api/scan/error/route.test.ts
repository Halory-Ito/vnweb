import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            orderBy: vi.fn(async () => {
                const item = state.selectQueue.shift();
                if (!item) {
                    return [];
                }
                if (item instanceof Error) {
                    throw item;
                }
                return item;
            }),
        })),
    }));

    return {
        state,
        db: { select },
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

import { GET } from "@/app/api/scan/error/route";

describe("app/api/scan/error GET", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.db.select.mockClear();
    });

    test("returns scan errors list", async () => {
        // Step 1: 准备数据库返回结果。
        mocks.state.selectQueue.push([
            { id: 2, directory: "D:/a", error: "x", status: 0 },
            { id: 1, directory: "D:/b", error: "y", status: 1 },
        ]);

        // Step 2: 调用 GET 并断言响应结构。
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: [
                { id: 2, directory: "D:/a", error: "x", status: 0 },
                { id: 1, directory: "D:/b", error: "y", status: 1 },
            ],
        });
    });

    test("returns 500 when select fails", async () => {
        mocks.state.selectQueue.push(new Error("db failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get scan errors" });
    });
});
