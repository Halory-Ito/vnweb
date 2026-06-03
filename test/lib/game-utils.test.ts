import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock("@/lib/request-utils", () => ({ api: mocks.api }));

import {
    addGameToCollection,
    batchUpdateGameMetadata,
    browseLocalFileByGameId,
    clearVndbCharactersByGameId,
    createCollection,
    createGameMemoryById,
    createGameOstById,
    createGamePvById,
    deleteGameById,
    deleteGameMemoryById,
    deleteGameOstById,
    deleteGamePvById,
    enqueueGameImageLocalizationById,
    getCollections,
    getGameById,
    getGameCardList,
    getGameMemoriesById,
    getGameOstsById,
    getGamePvsById,
    getGameRuntimeById,
    getGameSidebarData,
    getGameTimerRecordsById,
    getVndbCharacterById,
    getVndbCharactersByGameId,
    importLocalGameOstById,
    importLocalGamePvById,
    launchGameById,
    moveGameToCollection,
    removeGameFromCollection,
    searchGameImages,
    stopGameById,
    syncSteamPvsByGameId,
    syncVndbCharactersByGameId,
    updateGameInfoById,
    updateGameMemoryById,
    updateGameOstById,
    updateGamePlayStatusById,
    updateGamePvById,
    updateGameRatingById,
    updateGameSettingsById,
    updateGameTimerRecordsById,
    updateVndbCharacterById,
    uploadGameOstLyricById,
} from "@/lib/game/game-utils";

describe("lib/game-utils", () => {
    beforeEach(() => {
        mocks.api.get.mockReset();
        mocks.api.post.mockReset();
        mocks.api.delete.mockReset();
        mocks.api.patch.mockReset();
        mocks.api.put.mockReset();
    });

    test("maps basic game api wrappers", async () => {
        mocks.api.get
            .mockResolvedValueOnce({ data: { data: { id: 1, name: "G" } } })
            .mockResolvedValueOnce({
                data: { data: { isRunning: true, currentSessionSeconds: 1 } },
            })
            .mockResolvedValueOnce({
                data: { data: { vnId: "v1", bgmSubjectId: "b1", items: [] } },
            });

        expect((await getGameById("1")).id).toBe(1);
        expect((await getGameRuntimeById(1)).isRunning).toBe(true);
        expect((await getVndbCharactersByGameId(1)).vnId).toBe("v1");
    });

    test("maps runtime helper apis", async () => {
        // Step 1: 准备各接口返回。
        mocks.api.get
            .mockResolvedValueOnce({
                data: { data: { records: [], totalPlayTime: 0 } },
            })
            .mockResolvedValueOnce({ data: { data: { items: [] } } });
        mocks.api.post
            .mockResolvedValueOnce({
                data: { data: { exePath: "a.exe", iconPath: "a.ico" } },
            })
            .mockResolvedValueOnce({ data: { data: { stopped: true } } });
        mocks.api.patch
            .mockResolvedValueOnce({ data: { data: { status: 1 } } })
            .mockResolvedValueOnce({ data: { data: { rating: 9 } } });
        mocks.api.put.mockResolvedValueOnce({
            data: { data: { updated: true, totalPlayTime: 10 } },
        });

        // Step 2: 调用并断言。
        expect((await getGameTimerRecordsById(1)).totalPlayTime).toBe(0);
        expect((await getGamePvsById(1)).items).toEqual([]);
        expect((await launchGameById(1)).data.exePath).toBe("a.exe");
        expect((await stopGameById(1)).data.stopped).toBe(true);
        expect((await updateGamePlayStatusById(1, 1)).data.status).toBe(1);
        expect((await updateGameRatingById(1, 9)).data.rating).toBe(9);
        expect((await updateGameTimerRecordsById(1, { records: [] })).updated)
            .toBe(true);
    });

    test("covers media/memory/collection/sidebar wrappers", async () => {
        // Step 1: mock responses for get/post/patch/delete/put.
        mocks.api.get
            .mockResolvedValueOnce({ data: { data: { id: "c1" } } })
            .mockResolvedValueOnce({ data: { data: { items: [] } } })
            .mockResolvedValueOnce({ data: { data: { items: [] } } })
            .mockResolvedValueOnce({ data: { data: [{ id: 1 }] } })
            .mockResolvedValueOnce({ data: { data: [{ id: "g1" }] } })
            .mockResolvedValueOnce({
                data: { data: { mode: "search", items: [] } },
            });

        mocks.api.post
            .mockResolvedValueOnce({
                data: {
                    data: {
                        gameId: 1,
                        vnId: "v1",
                        bgmSubjectId: "b1",
                        total: 1,
                        inserted: 1,
                        updated: 0,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        gameId: 1,
                        steamAppId: 10,
                        total: 1,
                        inserted: 1,
                        skipped: 0,
                    },
                },
            })
            .mockResolvedValueOnce({ data: { data: { item: { id: 1 } } } })
            .mockResolvedValueOnce({
                data: { data: { name: "pv", path: "/pv.mp4" } },
            })
            .mockResolvedValueOnce({ data: { data: { item: { id: 2 } } } })
            .mockResolvedValueOnce({
                data: { data: { name: "ost", path: "/ost.mp3" } },
            })
            .mockResolvedValueOnce({
                data: { data: { itemId: 2, path: "/lyric.lrc" } },
            })
            .mockResolvedValueOnce({ data: { data: { item: { id: 3 } } } })
            .mockResolvedValueOnce({
                data: { data: { path: "/assets/cover/x.jpg" } },
            })
            .mockResolvedValueOnce({
                data: { data: { opened: true, exePath: "a.exe" } },
            })
            .mockResolvedValueOnce({
                data: { data: { game: null, items: [] } },
            })
            .mockResolvedValueOnce({ data: { data: { id: 11, name: "new" } } })
            .mockResolvedValueOnce({
                data: { data: { collectionId: 11, gameId: 1, added: true } },
            })
            .mockResolvedValueOnce({
                data: {
                    data: { updatedCount: 1, skippedCount: 0, failedCount: 0 },
                },
            });

        mocks.api.patch
            .mockResolvedValueOnce({ data: { data: { updated: true } } })
            .mockResolvedValueOnce({ data: { data: { item: { id: 1 } } } })
            .mockResolvedValueOnce({ data: { data: { item: { id: 2 } } } })
            .mockResolvedValueOnce({ data: { data: { item: { id: 3 } } } })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        gameId: 1,
                        sourceCollectionId: 11,
                        targetCollectionId: 12,
                        moved: true,
                    },
                },
            })
            .mockResolvedValueOnce({ data: { data: { updated: true } } })
            .mockResolvedValueOnce({ data: { data: { updated: true } } });

        mocks.api.delete
            .mockResolvedValueOnce({
                data: { data: { gameId: 1, cleared: true } },
            })
            .mockResolvedValueOnce({
                data: { data: { deleted: true, itemId: 1 } },
            })
            .mockResolvedValueOnce({
                data: { data: { deleted: true, itemId: 2 } },
            })
            .mockResolvedValueOnce({ data: { data: { deleted: true, id: 3 } } })
            .mockResolvedValueOnce({ data: { data: { deleted: true, id: 1 } } })
            .mockResolvedValueOnce({
                data: { data: { collectionId: 11, gameId: 1, removed: true } },
            });

        // Step 2: 调用分支函数。
        expect((await clearVndbCharactersByGameId(1)).cleared).toBe(true);
        expect((await getVndbCharacterById("c1")).id).toBe("c1");
        expect((await updateVndbCharacterById("c1", {} as any)).updated).toBe(
            true,
        );
        expect((await syncVndbCharactersByGameId(1)).inserted).toBe(1);

        expect((await syncSteamPvsByGameId(1)).inserted).toBe(1);
        expect((await createGamePvById(1, { name: "n", url: "u" })).item.id)
            .toBe(1);
        expect(
            (await updateGamePvById(1, { itemId: 1, name: "n", url: "u" })).item
                .id,
        ).toBe(1);
        expect((await deleteGamePvById(1, 1)).deleted).toBe(true);
        expect((await importLocalGamePvById(1, new File(["a"], "a.mp4"))).path)
            .toBe("/pv.mp4");

        expect((await getGameOstsById(1)).items).toEqual([]);
        expect((await createGameOstById(1, { name: "n", url: "u" })).item.id)
            .toBe(2);
        expect(
            (await updateGameOstById(1, { itemId: 2, name: "n", url: "u" }))
                .item.id,
        ).toBe(2);
        expect((await deleteGameOstById(1, 2)).deleted).toBe(true);
        expect((await importLocalGameOstById(1, new File(["a"], "a.mp3"))).path)
            .toBe("/ost.mp3");
        expect(
            (await uploadGameOstLyricById(1, {
                itemId: 2,
                file: new File(["a"], "a.lrc"),
            })).itemId,
        ).toBe(2);

        expect((await getGameMemoriesById(1)).items).toEqual([]);
        expect(
            (await createGameMemoryById(1, {
                image: new File(["a"], "a.png"),
                title: "t",
                description: "d",
            })).item.id,
        ).toBe(3);
        expect(
            (await updateGameMemoryById(1, 3, {
                title: "t",
                description: "d",
                image: new File(["a"], "a.png"),
            })).item.id,
        ).toBe(3);
        expect((await deleteGameMemoryById(1, 3)).data.deleted).toBe(true);

        expect(
            (await enqueueGameImageLocalizationById(1, {
                imageType: "cover",
                sourceUrl: "http://x",
            })).data.path,
        ).toContain("/assets/");
        expect((await browseLocalFileByGameId(1)).data.opened).toBe(true);
        expect(
            (await searchGameImages({
                source: "sgdb",
                keyword: "k",
                imageType: "cover",
            })).data.items,
        ).toEqual([]);
        expect((await deleteGameById(1)).data.deleted).toBe(true);

        expect((await getCollections())[0].id).toBe(1);
        expect((await createCollection("new")).id).toBe(11);
        expect((await addGameToCollection(11, 1)).data.added).toBe(true);
        expect((await removeGameFromCollection(11, 1)).data.removed).toBe(true);
        expect((await moveGameToCollection(11, 1, 12)).data.moved).toBe(true);
        expect((await getGameCardList())[0].id).toBe("g1");
        expect(
            (await batchUpdateGameMetadata({
                gameIds: [1],
                provider: "bangumi",
                fields: ["name"],
                strategy: "replace",
            })).data.updatedCount,
        ).toBe(1);

        expect(
            (await updateGameSettingsById(1, {
                exePath: "a.exe",
                cover: "",
                bg: "",
                icon: "",
                logo: "",
            })).data.updated,
        ).toBe(true);
        expect((await updateGameInfoById(1, { name: "X" })).data.updated).toBe(
            true,
        );
        expect(
            (await getGameSidebarData({
                search: "x",
                filter: {
                    releaseDateFrom: "",
                    releaseDateTo: "",
                    playStatus: "all",
                    developer: "",
                    publisher: "",
                    category: "",
                    platform: "",
                    tags: "",
                    originalPainter: "",
                    script: "",
                    music: "",
                    engine: "",
                    planning: "",
                } as any,
            })).mode,
        ).toBe("search");
    });
});
