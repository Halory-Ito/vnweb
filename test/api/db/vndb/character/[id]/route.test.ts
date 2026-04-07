import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SelectQueueItem = unknown[] | Error;

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as SelectQueueItem[],
        updateShouldThrow: false,
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
                where: vi.fn(async () => undefined),
            };
        }),
    }));

    const request = vi.fn(async (_config: unknown) => ({
        data: { results: [] as unknown[] },
    }));

    return {
        state,
        db: { select, update },
        VNDBClient: { request },
    };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("@/lib/vndb-client", () => ({
    VNDBClient: mocks.VNDBClient,
}));

vi.mock("dayjs", () => ({
    default: vi.fn(() => ({
        toISOString: () => mocks.state.nowIso,
    })),
}));

import { GET, PATCH } from "@/app/api/db/vndb/character/[id]/route";

const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
});

const createGetRequest = (gameId?: string): NextRequest => {
    const url = new URL("http://localhost/api/db/vndb/character/1");
    if (gameId !== undefined) {
        url.searchParams.set("gameId", gameId);
    }
    return { nextUrl: url } as NextRequest;
};

const createPatchRequest = (payload: unknown): NextRequest => {
    return {
        json: async () => payload,
        nextUrl: new URL("http://localhost/api/db/vndb/character/1"),
    } as NextRequest;
};

describe("app/api/db/vndb/character/[id] route", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.updateShouldThrow = false;
        mocks.state.updateSetArg = undefined;
        mocks.state.nowIso = "2026-01-01T00:00:00.000Z";

        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.VNDBClient.request.mockClear();
    });

    test("GET returns 400 for invalid character id", async () => {
        const response = await GET(createGetRequest("1"), createContext("bad"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid character id parameter" });
    });

    test("GET returns local character when gameId is provided", async () => {
        // Step 1: 本地数据库命中角色。
        mocks.state.selectQueue.push([
            {
                vndbId: "c12",
                name: "Kurisu",
                original: "牧濑红莉栖",
                description: "Genius",
                imageUrl: "https://img",
                bloodType: "A",
                height: 160,
                weight: 45,
                bust: 80,
                waist: 56,
                hips: 82,
                age: 18,
                birthdayMonth: 7,
                birthdayDay: 25,
                sex: JSON.stringify(["f", null]),
                gender: JSON.stringify(["female", null]),
            },
        ]);

        // Step 2: 调用 GET，期望直接走本地数据分支。
        const response = await GET(
            createGetRequest("100"),
            createContext("c12"),
        );
        const body = await response.json();

        // Step 3: 校验返回结构并确认未访问 VNDB 远端。
        expect(response.status).toBe(200);
        expect(body.data).toMatchObject({
            id: "c12",
            name: "Kurisu",
            cup: "",
            birthday: [7, 25],
            sex: ["f", null],
            gender: ["female", null],
        });
        expect(mocks.VNDBClient.request).not.toHaveBeenCalled();
    });

    test("GET returns 404 for non-c id when local record is missing", async () => {
        mocks.state.selectQueue.push([]);

        const response = await GET(
            createGetRequest("100"),
            createContext("bgm-123"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Character not found" });
        expect(mocks.VNDBClient.request).not.toHaveBeenCalled();
    });

    test("GET fetches remote VNDB character when local data is missing", async () => {
        mocks.state.selectQueue.push([]);
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: {
                results: [
                    {
                        id: "c88",
                        name: "Alice",
                        image: { url: "https://img/88" },
                    },
                ],
            },
        });

        const response = await GET(createGetRequest(), createContext("88"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            data: {
                id: "c88",
                name: "Alice",
                original: "",
                description: "",
                imageUrl: "https://img/88",
                bloodType: "",
                height: null,
                weight: null,
                bust: null,
                waist: null,
                hips: null,
                cup: "",
                age: null,
                birthday: null,
                sex: null,
                gender: null,
            },
        });
    });

    test("GET returns 404 when remote VNDB result is empty", async () => {
        mocks.state.selectQueue.push([]);
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: { results: [] },
        });

        const response = await GET(createGetRequest(), createContext("c8"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Character not found" });
    });

    test("PATCH returns 400 for invalid character id", async () => {
        const response = await PATCH(
            createPatchRequest({ gameId: 1 }),
            createContext("invalid-id"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid character id parameter" });
    });

    test("PATCH returns 400 for invalid game id", async () => {
        const response = await PATCH(
            createPatchRequest({ gameId: 0 }),
            createContext("c1"),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game id" });
    });

    test("PATCH returns 404 when character does not exist", async () => {
        mocks.state.selectQueue.push([]);

        const response = await PATCH(
            createPatchRequest({ gameId: 9 }),
            createContext("c12"),
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Character not found" });
    });

    test("PATCH updates character with normalized payload", async () => {
        mocks.state.nowIso = "2026-04-07T01:02:03.000Z";
        mocks.state.selectQueue.push([{ id: 1 }]);

        const response = await PATCH(
            createPatchRequest({
                gameId: 10,
                name: "  Alice  ",
                original: "  原名 ",
                description: "  desc ",
                imageUrl: "  https://img ",
                bloodType: "  B ",
                height: 172.8,
                weight: "49",
                bust: "80",
                waist: null,
                hips: undefined,
                age: "18.9",
                birthday: [7, 1],
                sex: ["f", null],
                gender: ["female", null],
            }),
            createContext("c55"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { updated: true } });
        expect(mocks.state.updateSetArg).toEqual({
            name: "Alice",
            original: "原名",
            description: "desc",
            imageUrl: "https://img",
            bloodType: "B",
            height: 172,
            weight: 49,
            bust: 80,
            waist: null,
            hips: null,
            age: 18,
            birthdayMonth: 7,
            birthdayDay: 1,
            sex: '["f",null]',
            gender: '["female",null]',
            updatedAt: "2026-04-07T01:02:03.000Z",
        });
    });

    test("PATCH returns 500 when update throws", async () => {
        mocks.state.selectQueue.push([{ id: 1 }]);
        mocks.state.updateShouldThrow = true;

        const response = await PATCH(
            createPatchRequest({ gameId: 10 }),
            createContext("c55"),
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "update failed" });
    });
});
