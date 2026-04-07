import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type QueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        bindingQueue: [] as QueueItem[],
        characterQueue: [] as QueueItem[],
        selectFromCount: 0,
        deleteShouldThrow: false,
        deleteWhereCalls: [] as unknown[],
    };

    const dequeue = (queue: QueueItem[]) => {
        const item = queue.shift();
        if (!item) {
            return [];
        }
        if (item instanceof Error) {
            throw item;
        }
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => {
            const callIndex = state.selectFromCount;
            state.selectFromCount += 1;

            // 每次 GET 会发起两次 select：
            // 第 1 次查绑定（直接 where await），第 2 次查角色（where().orderBy()）。
            if (callIndex % 2 === 0) {
                return {
                    where: vi.fn(async () => dequeue(state.bindingQueue)),
                };
            }

            return {
                where: vi.fn(() => ({
                    orderBy: vi.fn(async () => dequeue(state.characterQueue)),
                })),
            };
        }),
    }));

    const del = vi.fn(() => ({
        where: vi.fn(async (arg: unknown) => {
            state.deleteWhereCalls.push(arg);
            if (state.deleteShouldThrow) {
                throw new Error("delete failed");
            }
            return undefined;
        }),
    }));

    const syncVndbCharactersByGameId = vi.fn(async () => ({
        synced: true,
    })) as unknown as ReturnType<typeof vi.fn>;
    const rm = vi.fn(async (_targetPath: string, _options?: unknown) =>
        undefined
    );

    return {
        state,
        db: {
            select,
            delete: del,
        },
        syncVndbCharactersByGameId,
        fsRm: rm,
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("@/lib/server/vndb-character-sync", () => ({
    syncVndbCharactersByGameId: mocks.syncVndbCharactersByGameId,
}));

vi.mock("node:fs/promises", () => ({
    default: {
        rm: mocks.fsRm,
    },
}));

import { DELETE, GET, POST } from "@/app/api/db/vndb/characters/route";

const createGetRequest = (gameId?: string): NextRequest => {
    const url = new URL("http://localhost/api/db/vndb/characters");
    if (gameId !== undefined) {
        url.searchParams.set("gameId", gameId);
    }
    return { nextUrl: url } as NextRequest;
};

const createPostRequest = (payload: unknown): NextRequest => {
    return {
        json: async () => payload,
        nextUrl: new URL("http://localhost/api/db/vndb/characters"),
    } as NextRequest;
};

describe("app/api/db/vndb/characters route", () => {
    beforeEach(() => {
        mocks.state.bindingQueue = [];
        mocks.state.characterQueue = [];
        mocks.state.selectFromCount = 0;
        mocks.state.deleteShouldThrow = false;
        mocks.state.deleteWhereCalls = [];

        mocks.db.select.mockClear();
        mocks.db.delete.mockClear();
        mocks.syncVndbCharactersByGameId.mockClear();
        mocks.fsRm.mockClear();
    });

    test("GET returns 400 when gameId is invalid", async () => {
        const response = await GET(createGetRequest("abc"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("GET returns bindings and cached characters from database", async () => {
        // Step 1: 准备绑定映射和缓存角色。
        mocks.state.bindingQueue.push([
            { provider: " vndb ", externalId: " 12 " },
            { provider: "bangumi", externalId: "https://bgm.tv/subject/3456" },
        ]);
        mocks.state.characterQueue.push([
            {
                id: "c1",
                name: "Alice",
                original: null,
                imageUrl: "",
            },
        ]);

        // Step 2: 调用 GET。
        const response = await GET(createGetRequest("77"));
        const body = await response.json();

        // Step 3: 校验绑定归一化和角色映射结构。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                vnId: "v12",
                bgmSubjectId: "3456",
                items: [
                    {
                        id: "c1",
                        name: "Alice",
                        original: "",
                        imageUrl: "",
                        role: "",
                    },
                ],
                source: "database",
            },
        });
    });

    test("GET returns 500 when select throws", async () => {
        mocks.state.bindingQueue.push(new Error("select failed"));

        const response = await GET(createGetRequest("77"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "select failed" });
    });

    test("POST returns 400 when gameId is invalid", async () => {
        const response = await POST(createPostRequest({ gameId: 0 }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("POST syncs characters with provided options", async () => {
        (mocks.syncVndbCharactersByGameId as any).mockResolvedValueOnce({
            gameId: 100,
            synced: true,
            count: 3,
        });

        const response = await POST(
            createPostRequest({
                gameId: 100,
                source: "both",
                mergeStrategy: "prefer_bangumi",
                saveImagesToLocal: true,
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.syncVndbCharactersByGameId).toHaveBeenCalledWith(100, {
            source: "both",
            mergeStrategy: "prefer_bangumi",
            saveImagesToLocal: true,
        });
        expect(body).toEqual({
            data: {
                gameId: 100,
                synced: true,
                count: 3,
            },
        });
    });

    test("POST returns 500 when sync throws", async () => {
        mocks.syncVndbCharactersByGameId.mockRejectedValueOnce(
            new Error("sync failed"),
        );

        const response = await POST(createPostRequest({ gameId: 1 }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "sync failed" });
    });

    test("DELETE returns 400 when gameId is invalid", async () => {
        const response = await DELETE(createGetRequest(""));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("DELETE clears db records and local character directory", async () => {
        const response = await DELETE(createGetRequest("88"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { gameId: 88, cleared: true } });
        expect(mocks.db.delete).toHaveBeenCalledTimes(1);
        expect(mocks.fsRm).toHaveBeenCalledTimes(1);
        const rmCalls = mocks.fsRm.mock.calls as Array<[string, unknown]>;
        expect(String(rmCalls[0]?.[0])).toContain("public");
        expect(String(rmCalls[0]?.[0])).toContain("characters");
        expect(String(rmCalls[0]?.[0])).toContain("88");
        expect(rmCalls[0]?.[1]).toEqual({
            recursive: true,
            force: true,
        });
    });

    test("DELETE returns 500 when delete fails", async () => {
        mocks.state.deleteShouldThrow = true;

        const response = await DELETE(createGetRequest("88"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "delete failed" });
    });
});
