import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        insertShouldThrow: false,
        insertReturningRows: [{ id: 1, directory: "D:/Games" }] as unknown[],
        insertValuesArg: undefined as unknown,
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

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            orderBy: vi.fn(async () => dequeueSelect()),
            where: vi.fn(() => ({
                limit: vi.fn(async () => dequeueSelect()),
            })),
        })),
    }));

    const insert = vi.fn(() => ({
        values: vi.fn((valuesArg: unknown) => {
            state.insertValuesArg = valuesArg;
            if (state.insertShouldThrow) {
                throw new Error("insert failed");
            }
            return {
                returning: vi.fn(async () => state.insertReturningRows),
            };
        }),
    }));

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

import { GET, POST } from "@/app/api/scan/scanner/route";

const createRequest = (payload: unknown): NextRequest => ({
    json: async () => payload,
} as NextRequest);

describe("app/api/scan/scanner route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.insertShouldThrow = false;
        mocks.state.insertReturningRows = [{ id: 1, directory: "D:/Games" }];
        mocks.state.insertValuesArg = undefined;
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";

        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
    });

    test("GET returns scanner list", async () => {
        mocks.state.selectQueue.push([{ id: 1, directory: "D:/Games" }]);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: [{ id: 1, directory: "D:/Games" }] });
    });

    test("GET returns 500 when query fails", async () => {
        mocks.state.selectQueue.push(new Error("select failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to get scanner list" });
    });

    test("POST validates required fields", async () => {
        const response = await POST(
            createRequest({ provider: "bangumi", scanMode: 0 }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "扫描目录不能为空" });
    });

    test("POST validates provider/mode/level", async () => {
        const invalidProviderResp = await POST(
            createRequest({
                directory: "D:/Games",
                provider: "unknown",
                scanMode: 0,
                scanLevel: 0,
            }),
        );
        expect(invalidProviderResp.status).toBe(400);

        const invalidModeResp = await POST(
            createRequest({
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 3,
                scanLevel: 0,
            }),
        );
        expect(invalidModeResp.status).toBe(400);

        const invalidLevelResp = await POST(
            createRequest({
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: -1,
            }),
        );
        expect(invalidLevelResp.status).toBe(400);
    });

    test("POST returns 400 when directory already exists", async () => {
        mocks.state.selectQueue.push([{ id: 3 }]);

        const response = await POST(
            createRequest({
                directory: " D:/Games ",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 1,
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "该扫描目录已存在" });
        expect(mocks.db.insert).not.toHaveBeenCalled();
    });

    test("POST creates scanner and fills defaults", async () => {
        // Step 1: 不存在重复目录，允许插入。
        mocks.state.selectQueue.push([]);
        mocks.state.nowIso = "2026-04-07T12:00:00.000Z";
        mocks.state.insertReturningRows = [{
            id: 8,
            directory: "D:/Games",
            provider: "bangumi",
            progress: 0,
            gameCount: 0,
            scanMode: 0,
            scanLevel: 0,
            excludeDirs: "",
            createdAt: "2026-04-07T12:00:00.000Z",
            updatedAt: "2026-04-07T12:00:00.000Z",
        }];

        // Step 2: 调用 POST。
        const response = await POST(
            createRequest({
                directory: " D:/Games ",
                provider: "bangumi",
                scanMode: 0,
            }),
        );
        const body = await response.json();

        // Step 3: 校验写入 payload 与返回数据。
        expect(response.status).toBe(200);
        expect(mocks.state.insertValuesArg).toEqual({
            directory: "D:/Games",
            provider: "bangumi",
            scanMode: 0,
            scanLevel: 0,
            progress: 0,
            gameCount: 0,
            excludeDirs: "",
            createdAt: "2026-04-07T12:00:00.000Z",
            updatedAt: "2026-04-07T12:00:00.000Z",
        });
        expect(body.data.id).toBe(8);
    });

    test("POST returns 500 when insert throws", async () => {
        mocks.state.selectQueue.push([]);
        mocks.state.insertShouldThrow = true;

        const response = await POST(
            createRequest({
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to create scanner" });
    });
});
