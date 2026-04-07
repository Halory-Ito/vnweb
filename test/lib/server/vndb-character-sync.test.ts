import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = {
        providerQueue: [] as Array<unknown[]>,
    };

    const take = () => state.providerQueue.shift() ?? [];

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => {
                const rows = take();
                return Object.assign(Promise.resolve(rows), {
                    limit: vi.fn(async () => rows),
                });
            }),
        })),
    }));

    return {
        state,
        db: {
            select,
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            transaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
                const tx = {
                    insert: vi.fn(() => ({
                        values: vi.fn(async () => undefined),
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(async () => undefined),
                        })),
                    })),
                };
                await cb(tx);
            }),
        },
        VNDBClient: { request: vi.fn() },
        BGMClient: { request: vi.fn() },
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("@/lib/vndb-client", () => ({
    BGMClient: mocks.BGMClient,
    VNDBClient: mocks.VNDBClient,
}));

describe("lib/server/vndb-character-sync", () => {
    beforeEach(() => {
        mocks.state.providerQueue = [];
        mocks.db.select.mockClear();
        mocks.db.transaction.mockClear();
        mocks.VNDBClient.request.mockReset();
        mocks.BGMClient.request.mockReset();
    });

    test("returns empty result when vn id exists but vndb result is empty", async () => {
        // Step 1: vndb id 有值，bangumi 为空，角色列表为空。
        mocks.state.providerQueue = [
            [{ provider: "vndb", externalId: "123" }],
            [],
        ];
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: { results: [] },
        });

        // Step 2: 执行同步。
        const mod = await import("@/lib/server/vndb-character-sync");
        const result = await mod.syncVndbCharactersByGameId(1, {
            source: "vndb",
            saveImagesToLocal: false,
        });

        // Step 3: 断言 total 为 0 且保留 vnId。
        expect(result.total).toBe(0);
        expect(result.vnId).toBe("v123");
    });

    test("inserts and updates rows based on existing ids", async () => {
        // Step 1: vndb id 有值，返回两条角色，其中一条已存在。
        mocks.state.providerQueue = [
            [{ provider: "vndb", externalId: "123" }],
            [],
            [{ vndbId: "c1" }],
        ];
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: {
                results: [
                    { id: "c1", name: "A", original: "AO" },
                    { id: "c2", name: "B", original: "BO" },
                ],
            },
        });

        // Step 2: 执行同步。
        const mod = await import("@/lib/server/vndb-character-sync");
        const result = await mod.syncVndbCharactersByGameId(1, {
            source: "vndb",
            saveImagesToLocal: false,
        });

        // Step 3: 断言插入和更新计数。
        expect(result.total).toBe(2);
        expect(result.inserted).toBe(1);
        expect(result.updated).toBe(1);
        expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    });

    test("returns empty result when provider ids are missing", async () => {
        // Step 1: VNDB 与 Bangumi id 映射均查询不到。
        mocks.state.providerQueue = [[], []];

        // Step 2: 执行同步。
        const mod = await import("@/lib/server/vndb-character-sync");
        const result = await mod.syncVndbCharactersByGameId(1, {
            source: "both",
        });

        // Step 3: 断言早返回结果。
        expect(result).toEqual({
            gameId: 1,
            vnId: "",
            bgmSubjectId: "",
            total: 0,
            inserted: 0,
            updated: 0,
        });
    });

    test("exports sync function", async () => {
        const mod = await import("@/lib/server/vndb-character-sync");
        expect(typeof mod.syncVndbCharactersByGameId).toBe("function");
    });
});
