import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

type InsertCall = {
    table: unknown;
    valuesArg: unknown;
};

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        updateSetCalls: [] as unknown[],
        insertCalls: [] as InsertCall[],
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
            state.updateSetCalls.push(setArg);
            return {
                where: vi.fn(async () => undefined),
            };
        }),
    }));

    const insert = vi.fn((table: unknown) => ({
        values: vi.fn(async (valuesArg: unknown) => {
            state.insertCalls.push({ table, valuesArg });
            return {
                returning: vi.fn(async () => [{ id: 99 }]),
                onConflictDoNothing: vi.fn(async () => undefined),
            };
        }),
    }));

    const access = vi.fn(async () => undefined);
    const readdir = vi.fn(async () => [] as any[]);
    const bgmRequest = vi.fn(async () => ({ data: { data: [] } }));
    const searchGame = vi.fn(async () => [] as unknown[]);
    const getGameById = vi.fn(async () => ({}));
    const getGridsById = vi.fn(async () => [] as unknown[]);
    const localizeGameImageFields = vi.fn(async () => ({ cover: "" }));
    const mapBGMSubjectToGameInfo = vi.fn(() => ({
        date: "",
        cover: "",
        summary: "",
        name: "",
        nameCn: "",
        tags: [],
        nsfw: false,
        ailases: [],
        platforms: [],
        gameType: "",
        gameEngine: "",
        websites: [],
        links: [],
        music: "",
        script: "",
        graphic: "",
        originalPainter: "",
        animationProduction: "",
        developer: "",
        publisher: "",
        programmer: "",
    }));

    return {
        state,
        db: { select, update, insert },
        fs: { access, readdir },
        BGMClient: { request: bgmRequest },
        SGDBClient: { searchGame, getGameById, getGridsById },
        localizeGameImageFields,
        mapBGMSubjectToGameInfo,
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("node:fs/promises", () => ({
    default: mocks.fs,
}));

vi.mock("dayjs", () => ({
    default: vi.fn(() => ({
        toISOString: () => mocks.state.nowIso,
    })),
}));

vi.mock("@/lib/vndb-client", () => ({
    BGMClient: mocks.BGMClient,
    SGDBClient: mocks.SGDBClient,
}));

vi.mock("@/lib/server/game-image-storage", () => ({
    localizeGameImageFields: mocks.localizeGameImageFields,
}));

vi.mock("@/lib/vndb-utils", () => ({
    mapBGMSubjectToGameInfo: mocks.mapBGMSubjectToGameInfo,
}));

import { POST } from "@/app/api/scan/scanner/[id]/start/route";

const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
});

describe("app/api/scan/scanner/[id]/start POST", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.updateSetCalls = [];
        mocks.state.insertCalls = [];
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";

        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.insert.mockClear();
        mocks.fs.access.mockClear();
        mocks.fs.readdir.mockClear();
        mocks.BGMClient.request.mockClear();
        mocks.SGDBClient.searchGame.mockClear();
    });

    test("returns 400 for invalid scanner id", async () => {
        const response = await POST({} as NextRequest, createContext("0"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid scanner id" });
    });

    test("returns 404 when scanner does not exist", async () => {
        mocks.state.selectQueue.push([]);

        const response = await POST({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "扫描目录不存在" });
    });

    test("returns 400 when provider is not supported", async () => {
        mocks.state.selectQueue.push([
            {
                id: 1,
                directory: "D:/Games",
                provider: "vndb",
                scanMode: 0,
                scanLevel: 0,
                excludeDirs: "",
            },
        ]);

        const response = await POST({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("当前暂不支持数据源 vndb 的自动扫描");
    });

    test("returns 500 when directory access fails", async () => {
        mocks.state.selectQueue.push([
            {
                id: 1,
                directory: "D:/missing",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
                excludeDirs: "",
            },
        ]);
        mocks.fs.access.mockRejectedValueOnce(new Error("ENOENT"));

        const response = await POST({} as NextRequest, createContext("1"));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "ENOENT" });
    });

    test("returns success when no candidates are found", async () => {
        // Step 1: scanMode=0，根目录无子目录，候选集为空。
        mocks.state.selectQueue.push([
            {
                id: 2,
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
                excludeDirs: "",
            },
        ]);
        mocks.fs.readdir.mockResolvedValueOnce([]);

        // Step 2: 调用 start。
        const response = await POST({} as NextRequest, createContext("2"));
        const body = await response.json();

        // Step 3: 断言扫描统计和进度更新。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                scannerId: 2,
                scannedCount: 0,
                matchedCount: 0,
                addedCount: 0,
            },
        });
        expect(mocks.db.update).toHaveBeenCalled();
        expect(mocks.BGMClient.request).not.toHaveBeenCalled();
    });

    test("scans level directories and performs bangumi search", async () => {
        const asDirentDir = (name: string) => ({
            name,
            isDirectory: () => true,
            isFile: () => false,
        });

        mocks.state.selectQueue.push([
            {
                id: 3,
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
                excludeDirs: "",
            },
        ]);
        mocks.fs.readdir.mockResolvedValueOnce([asDirentDir("GameA")]);
        mocks.BGMClient.request.mockResolvedValueOnce({ data: { data: [] } });

        const response = await POST({} as NextRequest, createContext("3"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.scannedCount).toBe(1);
        expect(body.data.matchedCount).toBe(0);
        expect(body.data.addedCount).toBe(0);
        expect(mocks.BGMClient.request).toHaveBeenCalledTimes(1);
    });

    test("records scan error when provider search throws", async () => {
        const asDirentDir = (name: string) => ({
            name,
            isDirectory: () => true,
            isFile: () => false,
        });

        mocks.state.selectQueue.push([
            {
                id: 4,
                directory: "D:/Games",
                provider: "bangumi",
                scanMode: 0,
                scanLevel: 0,
                excludeDirs: "",
            },
        ]);
        mocks.fs.readdir.mockResolvedValueOnce([asDirentDir("GameB")]);
        mocks.BGMClient.request.mockRejectedValueOnce(
            new Error("network fail"),
        );

        const response = await POST({} as NextRequest, createContext("4"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.scannedCount).toBe(1);
        expect(mocks.db.insert).toHaveBeenCalled();
        expect(mocks.state.insertCalls[0]?.valuesArg).toMatchObject({
            error: "GameB: network fail",
            status: 0,
        });
    });
});
