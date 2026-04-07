import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        nowIso: "2026-01-01T00:00:00.000Z",
        insertShouldThrow: false,
        updateShouldThrow: false,
        deleteShouldThrow: false,
        insertCalls: [] as Array<{ table: unknown; valuesArg: unknown }>,
        updateCalls: [] as Array<{ table: unknown; setArg: unknown }>,
        deleteCalls: [] as Array<{ table: unknown; whereArg: unknown }>,
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

    const insert = vi.fn((table: unknown) => ({
        values: vi.fn(async (valuesArg: unknown) => {
            state.insertCalls.push({ table, valuesArg });
            if (state.insertShouldThrow) {
                throw new Error("insert failed");
            }
            return undefined;
        }),
    }));

    const update = vi.fn((table: unknown) => ({
        set: vi.fn((setArg: unknown) => {
            state.updateCalls.push({ table, setArg });
            if (state.updateShouldThrow) {
                throw new Error("update failed");
            }
            return {
                where: vi.fn(async () => undefined),
            };
        }),
    }));

    const del = vi.fn((table: unknown) => ({
        where: vi.fn(async (whereArg: unknown) => {
            state.deleteCalls.push({ table, whereArg });
            if (state.deleteShouldThrow) {
                throw new Error("delete failed");
            }
            return undefined;
        }),
    }));

    return {
        state,
        db: {
            select,
            insert,
            update,
            delete: del,
        },
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

import { DELETE, PATCH, POST } from "@/app/api/collection/[id]/game/route";

const createRequest = (payload: unknown, rejectJson = false): NextRequest => {
    return {
        json: rejectJson
            ? async () => Promise.reject(new Error("invalid json"))
            : async () => payload,
    } as NextRequest;
};

const createDeleteRequest = (queryValue: string): NextRequest => {
    return {
        nextUrl: new URL(
            `http://localhost/api/collection/1/game?gameId=${queryValue}`,
        ),
    } as NextRequest;
};

const createContext = (id: string) => {
    return {
        params: Promise.resolve({ id }),
    };
};

describe("app/api/collection/[id]/game route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";
        mocks.state.insertShouldThrow = false;
        mocks.state.updateShouldThrow = false;
        mocks.state.deleteShouldThrow = false;
        mocks.state.insertCalls = [];
        mocks.state.updateCalls = [];
        mocks.state.deleteCalls = [];

        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
        mocks.db.update.mockClear();
        mocks.db.delete.mockClear();
    });

    test("POST returns 400 for invalid collection id", async () => {
        const response = await POST(
            createRequest({ gameId: 1 }),
            createContext("0"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "无效的收藏夹 id" });
    });

    test("POST returns 400 for invalid game id", async () => {
        const response = await POST(
            createRequest({ gameId: "x" }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "无效的游戏 id" });
    });

    test("POST returns 404 when collection does not exist", async () => {
        mocks.state.selectQueue.push([]);

        const response = await POST(
            createRequest({ gameId: 1 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "收藏夹不存在" });
    });

    test("POST returns 404 when game does not exist", async () => {
        mocks.state.selectQueue.push([{ id: 1 }], []);

        const response = await POST(
            createRequest({ gameId: 9 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "游戏不存在" });
    });

    test("POST inserts relation when not exists and updates collection", async () => {
        mocks.state.nowIso = "2026-05-01T10:20:30.000Z";
        mocks.state.selectQueue.push([{ id: 1 }], [{ id: 2 }], []);

        const response = await POST(
            createRequest({ gameId: 2 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                collectionId: 1,
                gameId: 2,
                added: true,
            },
        });
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
        expect(mocks.state.insertCalls[0]?.valuesArg).toEqual({
            collectionId: 1,
            gameId: 2,
        });
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
        expect(mocks.state.updateCalls[0]?.setArg).toEqual({
            updatedAt: "2026-05-01T10:20:30.000Z",
        });
    });

    test("POST skips insert when relation already exists", async () => {
        mocks.state.selectQueue.push([{ id: 1 }], [{ id: 2 }], [{ id: 99 }]);

        const response = await POST(
            createRequest({ gameId: 2 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                collectionId: 1,
                gameId: 2,
                added: true,
            },
        });
        expect(mocks.db.insert).not.toHaveBeenCalled();
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
    });

    test("DELETE removes relation and updates collection", async () => {
        mocks.state.nowIso = "2026-06-01T08:00:00.000Z";

        const response = await DELETE(
            createDeleteRequest("9"),
            createContext("3"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                collectionId: 3,
                gameId: 9,
                removed: true,
            },
        });
        expect(mocks.db.delete).toHaveBeenCalledTimes(1);
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
        expect(mocks.state.updateCalls[0]?.setArg).toEqual({
            updatedAt: "2026-06-01T08:00:00.000Z",
        });
    });

    test("DELETE returns 400 for invalid game id", async () => {
        const response = await DELETE(
            createDeleteRequest("abc"),
            createContext("2"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "无效的游戏 id" });
    });

    test("PATCH returns 400 when source and target are same", async () => {
        const response = await PATCH(
            createRequest({ gameId: 2, targetCollectionId: 1 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "目标收藏夹不能与来源一致" });
    });

    test("PATCH returns 404 when target collection does not exist", async () => {
        mocks.state.selectQueue.push([]);

        const response = await PATCH(
            createRequest({ gameId: 2, targetCollectionId: 9 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "目标收藏夹不存在" });
    });

    test("PATCH moves game and updates both collections", async () => {
        mocks.state.nowIso = "2026-07-01T12:00:00.000Z";
        mocks.state.selectQueue.push([{ id: 9 }], []);

        const response = await PATCH(
            createRequest({ gameId: 8, targetCollectionId: 9 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                gameId: 8,
                sourceCollectionId: 1,
                targetCollectionId: 9,
                moved: true,
            },
        });
        expect(mocks.db.delete).toHaveBeenCalledTimes(1);
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
        expect(mocks.state.insertCalls[0]?.valuesArg).toEqual({
            collectionId: 9,
            gameId: 8,
        });
        expect(mocks.db.update).toHaveBeenCalledTimes(2);
        expect(mocks.state.updateCalls[0]?.setArg).toEqual({
            updatedAt: "2026-07-01T12:00:00.000Z",
        });
        expect(mocks.state.updateCalls[1]?.setArg).toEqual({
            updatedAt: "2026-07-01T12:00:00.000Z",
        });
    });

    test("PATCH skips insert when game already exists in target", async () => {
        mocks.state.selectQueue.push([{ id: 9 }], [{ id: 88 }]);

        const response = await PATCH(
            createRequest({ gameId: 8, targetCollectionId: 9 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.moved).toBe(true);
        expect(mocks.db.insert).not.toHaveBeenCalled();
    });

    test("PATCH returns 500 when delete throws", async () => {
        mocks.state.selectQueue.push([{ id: 9 }]);
        mocks.state.deleteShouldThrow = true;

        const response = await PATCH(
            createRequest({ gameId: 8, targetCollectionId: 9 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Failed to move game to other collection",
        });
    });
});
