import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        updateShouldThrow: false,
        deleteShouldThrow: false,
        updateSetArg: undefined as unknown,
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
            where: vi.fn(() => ({
                limit: vi.fn(async () => dequeueSelect()),
            })),
        })),
    }));

    const update = vi.fn(() => ({
        set: vi.fn((setArg: unknown) => {
            state.updateSetArg = setArg;
            if (state.updateShouldThrow) {
                throw new Error("update failed");
            }
            return {
                where: vi.fn(() => ({
                    returning: vi.fn(
                        async () => [{ id: 1, directory: "D:/Games" }]
                    ),
                })),
            };
        }),
    }));

    const del = vi.fn(() => ({
        where: vi.fn(async () => {
            if (state.deleteShouldThrow) {
                throw new Error("delete failed");
            }
            return undefined;
        }),
    }));

    return {
        state,
        db: { select, update, delete: del },
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

import { DELETE, PATCH } from "@/app/api/scan/scanner/[id]/route";

const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
});

const createPatchRequest = (payload: unknown): NextRequest => ({
    json: async () => payload,
} as NextRequest);

describe("app/api/scan/scanner/[id] route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.updateShouldThrow = false;
        mocks.state.deleteShouldThrow = false;
        mocks.state.updateSetArg = undefined;
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";

        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.delete.mockClear();
    });

    test("PATCH returns 400 for invalid scanner id", async () => {
        const response = await PATCH(
            createPatchRequest({}),
            createContext("0"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid scanner id" });
    });

    test("PATCH validates payload fields", async () => {
        const response = await PATCH(
            createPatchRequest({
                directory: "",
                provider: "bad",
                scanMode: 3,
                scanLevel: -1,
            }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "扫描目录不能为空" });
    });

    test("PATCH returns 404 when scanner not exists", async () => {
        mocks.state.selectQueue.push([]);

        const response = await PATCH(
            createPatchRequest({
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
            }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "扫描目录不存在" });
    });

    test("PATCH updates scanner", async () => {
        // Step 1: 先返回存在记录，再执行更新。
        mocks.state.selectQueue.push([{ id: 1 }]);
        mocks.state.nowIso = "2026-04-07T08:00:00.000Z";

        // Step 2: 调用 PATCH。
        const response = await PATCH(
            createPatchRequest({
                directory: " D:/Games ",
                provider: "bangumi",
                scanMode: 1,
                scanLevel: 2,
            }),
            createContext("1"),
        );
        const body = await response.json();

        // Step 3: 断言更新字段和返回结构。
        expect(response.status).toBe(200);
        expect(mocks.state.updateSetArg).toEqual({
            directory: "D:/Games",
            provider: "bangumi",
            scanMode: 1,
            scanLevel: 2,
            updatedAt: "2026-04-07T08:00:00.000Z",
        });
        expect(body).toEqual({ data: { id: 1, directory: "D:/Games" } });
    });

    test("PATCH returns 500 when update fails", async () => {
        mocks.state.selectQueue.push([{ id: 1 }]);
        mocks.state.updateShouldThrow = true;

        const response = await PATCH(
            createPatchRequest({
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
            }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to update scanner" });
    });

    test("DELETE returns 400 for invalid scanner id", async () => {
        const response = await DELETE({} as NextRequest, createContext("-1"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid scanner id" });
    });

    test("DELETE deletes scanner", async () => {
        const response = await DELETE({} as NextRequest, createContext("7"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { deleted: true, id: 7 } });
        expect(mocks.db.delete).toHaveBeenCalledTimes(1);
    });

    test("DELETE returns 500 when delete fails", async () => {
        mocks.state.deleteShouldThrow = true;

        const response = await DELETE({} as NextRequest, createContext("7"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to delete scanner" });
    });
});
