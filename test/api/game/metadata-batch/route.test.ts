import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        updateSetArgs: [] as unknown[],
    };

    const take = () => {
        const item = state.selectQueue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(async () => take()),
            })),
        })),
    }));

    const update = vi.fn(() => ({
        set: vi.fn((setArg: unknown) => {
            state.updateSetArgs.push(setArg);
            return {
                where: vi.fn(async () => undefined),
            };
        }),
    }));

    const BGMClient = {
        request: vi.fn(async () => ({ data: { id: 123 } })),
    };

    const SGDBClient = {
        searchGame: vi.fn(async () => [] as unknown[]),
        getGameById: vi.fn(async () => ({})),
        getGridsById: vi.fn(async () => [] as unknown[]),
        getIconsById: vi.fn(async () => [] as unknown[]),
        getLogosById: vi.fn(async () => [] as unknown[]),
        getHeroesById: vi.fn(async () => [] as unknown[]),
    };

    const mapBGMSubjectToGameInfo = vi.fn(() => ({
        date: "2026-01-01",
        cover: "https://img/cover.jpg",
        icon: "",
        logo: "",
        bg: "",
        summary: "new summary",
        name: "name-en",
        nameCn: "新名字",
        tags: ["tag1", "tag2"],
        nsfw: false,
        ailases: ["a1"],
        platforms: ["pc"],
        gameType: "VN",
        gameEngine: "krkr",
        websites: [],
        links: [],
        music: "m",
        script: "s",
        graphic: "g",
        originalPainter: "p",
        animationProduction: "ap",
        developer: "dev",
        publisher: "pub",
        programmer: "prog",
    }));

    const localizeGameImageFields = vi.fn(async () => ({
        cover: "https://local/cover.jpg",
        icon: "",
        logo: "",
        bg: "",
    }));

    return {
        state,
        db: { select, update },
        BGMClient,
        SGDBClient,
        mapBGMSubjectToGameInfo,
        localizeGameImageFields,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock("@/lib/vndb-client", () => ({
    BGMClient: mocks.BGMClient,
    SGDBClient: mocks.SGDBClient,
}));
vi.mock(
    "@/lib/vndb-utils",
    () => ({ mapBGMSubjectToGameInfo: mocks.mapBGMSubjectToGameInfo }),
);
vi.mock(
    "@/lib/server/game-image-storage",
    () => ({ localizeGameImageFields: mocks.localizeGameImageFields }),
);

import { POST } from "@/app/api/game/metadata-batch/route";

const createRequest = (payload: unknown): NextRequest => {
    return { json: async () => payload } as NextRequest;
};

describe("app/api/game/metadata-batch POST", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.updateSetArgs = [];

        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.BGMClient.request.mockClear();
        mocks.mapBGMSubjectToGameInfo.mockClear();
        mocks.localizeGameImageFields.mockClear();
    });

    test("returns 400 for invalid provider", async () => {
        const response = await POST(createRequest({ provider: "x" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid provider" });
    });

    test("returns 400 for invalid strategy", async () => {
        const response = await POST(
            createRequest({ provider: "bangumi", strategy: "bad" }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid strategy" });
    });

    test("returns 400 when required arrays are empty", async () => {
        const response = await POST(
            createRequest({
                provider: "bangumi",
                strategy: "replace",
                gameIds: [],
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "No game ids" });
    });

    test("updates one game successfully", async () => {
        // Step 1: 准备当前游戏快照。
        mocks.state.selectQueue.push([
            {
                id: 1,
                date: "2025-01-01",
                cover: "old-cover",
                icon: "",
                logo: "",
                bg: "",
                summary: "old summary",
                name: "old",
                nameCn: "旧名字",
                tags: "oldTag",
                nsfw: 0,
                ailases: "oldAlias",
                platforms: "pc",
                gameType: "",
                gameEngine: "",
                music: "",
                script: "",
                graphic: "",
                originalPainter: "",
                animationProduction: "",
                developer: "",
                publisher: "",
                programmer: "",
            },
        ]);

        // Step 2: 执行批量更新。
        const response = await POST(
            createRequest({
                gameIds: [1],
                provider: "bangumi",
                strategy: "replace",
                query: "123",
                fields: ["nameCn", "summary", "cover", "tags"],
            }),
        );
        const body = await response.json();

        // Step 3: 断言统计和 patch 内容。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: { updatedCount: 1, skippedCount: 0, failedCount: 0 },
        });
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
        expect(mocks.state.updateSetArgs[0]).toMatchObject({
            nameCn: "新名字",
            summary: "new summary",
            cover: "https://local/cover.jpg",
            tags: "tag1,tag2",
        });
    });

    test("counts skipped and failed items", async () => {
        mocks.state.selectQueue.push([], new Error("select failed"));

        const response = await POST(
            createRequest({
                gameIds: [1, 2],
                provider: "bangumi",
                strategy: "replace",
                query: "123",
                fields: ["nameCn"],
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: { updatedCount: 0, skippedCount: 1, failedCount: 1 },
        });
    });
});
