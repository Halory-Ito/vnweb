import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        updateCalls: [] as unknown[],
        insertCalls: [] as unknown[],
        txDeleteCount: 0,
    };

    const take = () => {
        const item = state.selectQueue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const makeWhereQuery = (rows: unknown[]) => {
        let query: Promise<unknown[]> & {
            limit: ReturnType<typeof vi.fn>;
            orderBy: ReturnType<typeof vi.fn>;
        };
        query = Object.assign(Promise.resolve(rows), {
            limit: vi.fn(async () => rows),
            orderBy: vi.fn(async () => rows),
        });
        return query;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => makeWhereQuery(take() as unknown[])),
        })),
    }));

    const update = vi.fn(() => ({
        set: vi.fn((setArg: unknown) => {
            state.updateCalls.push(setArg);
            return {
                where: vi.fn(async () => undefined),
            };
        }),
    }));

    const insert = vi.fn(() => ({
        values: vi.fn((valuesArg: unknown) => {
            state.insertCalls.push(valuesArg);
            return Promise.resolve(undefined);
        }),
    }));

    const transaction = vi.fn(async (cb: (tx: any) => Promise<void>) => {
        const tx = {
            delete: vi.fn(() => ({
                where: vi.fn(async () => {
                    state.txDeleteCount += 1;
                }),
            })),
            insert: vi.fn(() => ({
                values: vi.fn(async () => undefined),
                onConflictDoNothing: vi.fn(async () => undefined),
            })),
            update: vi.fn(() => ({
                set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
            })),
        };
        await cb(tx);
    });

    const localizeGameImageFieldsInBackground = vi.fn(() => ({}));
    const syncVndbCharactersByGameId = vi.fn(async () => undefined);

    return {
        state,
        db: { select, update, insert, transaction },
        localizeGameImageFieldsInBackground,
        syncVndbCharactersByGameId,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock("@/lib/server/game-image-storage", () => ({
    localizeGameImageFieldsInBackground:
        mocks.localizeGameImageFieldsInBackground,
}));
vi.mock("@/lib/server/vndb-character-sync", () => ({
    syncVndbCharactersByGameId: mocks.syncVndbCharactersByGameId,
}));

import { DELETE, GET, PATCH } from "@/app/api/game/[id]/route";

const createContext = (id: string) => ({ params: Promise.resolve({ id }) });
const createPatchRequest = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("app/api/game/[id] route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.updateCalls = [];
        mocks.state.insertCalls = [];
        mocks.state.txDeleteCount = 0;

        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.insert.mockClear();
        mocks.db.transaction.mockClear();
    });

    test("GET returns 400 for invalid game id", async () => {
        const response = await GET({} as NextRequest, createContext("0"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("GET returns 404 when game not found", async () => {
        mocks.state.selectQueue.push([]);

        const response = await GET({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Game not found" });
    });

    test("GET returns game detail payload", async () => {
        // 顺序：game -> websites -> playRows -> idMapRows
        mocks.state.selectQueue.push(
            [{
                id: 1,
                date: "",
                cover: "",
                icon: "",
                logo: "",
                bg: "",
                summary: "s",
                name: "n",
                nameCn: "cn",
                tags: "a,b",
                nsfw: 1,
                ailases: "x",
                platforms: "pc",
                gameType: "VN",
                gameEngine: "",
                music: "",
                script: "",
                graphic: "",
                originalPainter: "",
                animationProduction: "",
                developer: "",
                publisher: "",
                programmer: "",
                createdAt: "c",
                updatedAt: "u",
            }],
            [{ id: 1, name: "Steam", url: "https://store" }],
            [{
                id: 9,
                totalPlayTime: 100,
                playCount: 2,
                rating: 7,
                lastLaunchedAt: "2026",
                status: 1,
                isRunning: 0,
                exePath: "C\\a.exe",
            }],
            [{ provider: "steam", externalId: "10" }],
        );

        const response = await GET({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.id).toBe(1);
        expect(body.data.nsfw).toBe(true);
        expect(body.data.externalSourceIds).toBe("steam:10");
    });

    test("PATCH returns 400 for invalid externalSourceIds format", async () => {
        mocks.state.selectQueue.push([{
            id: 1,
            name: "n",
            nameCn: "",
            date: "",
            cover: "",
            bg: "",
            icon: "",
            logo: "",
        }]);

        const response = await PATCH(
            createPatchRequest({ externalSourceIds: "broken-format" }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("外部数据源id格式错误");
    });

    test("PATCH validates rating range", async () => {
        mocks.state.selectQueue.push([{
            id: 1,
            name: "n",
            nameCn: "",
            date: "",
            cover: "",
            bg: "",
            icon: "",
            logo: "",
        }]);

        const response = await PATCH(
            createPatchRequest({ rating: 11 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid rating" });
    });

    test("PATCH updates status", async () => {
        // 顺序：gameRows -> playRows
        mocks.state.selectQueue.push(
            [{
                id: 1,
                name: "n",
                nameCn: "",
                date: "",
                cover: "",
                bg: "",
                icon: "",
                logo: "",
            }],
            [{ id: 99 }],
        );

        const response = await PATCH(
            createPatchRequest({ status: 2 }),
            createContext("1"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { status: 2 } });
    });

    test("DELETE returns 400 for invalid id", async () => {
        const response = await DELETE({} as NextRequest, createContext("-1"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("DELETE returns 404 when game not found", async () => {
        mocks.state.selectQueue.push([]);

        const response = await DELETE({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Game not found" });
    });

    test("DELETE removes game related records in transaction", async () => {
        mocks.state.selectQueue.push([{ id: 1 }]);

        const response = await DELETE({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { deleted: true, id: 1 } });
        expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
        expect(mocks.state.txDeleteCount).toBeGreaterThan(0);
    });
});
