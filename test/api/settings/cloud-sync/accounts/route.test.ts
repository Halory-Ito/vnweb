import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = {
        selectQueue: [] as Array<unknown[] | Error>,
        txInsertCalls: [] as unknown[],
    };

    const take = () => {
        const item = state.selectQueue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => take()),
    }));

    const del = vi.fn(() => ({ where: vi.fn(async () => undefined) }));

    const transaction = vi.fn(async (cb: (tx: any) => Promise<void>) => {
        const tx = {
            delete: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
            insert: vi.fn(() => ({
                values: vi.fn(async (v: unknown) => {
                    state.txInsertCalls.push(v);
                }),
            })),
        };
        await cb(tx);
    });

    const day = {
        toISOString: vi.fn(() => "2026-04-07T00:00:00.000Z"),
        add: vi.fn(() => ({ toISOString: () => "2026-04-07T01:00:00.000Z" })),
    };

    const axios = {
        get: vi.fn(),
        isAxiosError: vi.fn(() => false),
    };

    return {
        state,
        db: { select, delete: del, transaction },
        axios,
        day,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock("dayjs", () => ({ default: vi.fn(() => mocks.day) }));
vi.mock("axios", () => ({ default: mocks.axios }));

import {
    DELETE,
    GET,
    POST,
} from "@/app/api/settings/cloud-sync/accounts/route";

const req = (payload: unknown): NextRequest => ({
    json: async () => payload,
} as NextRequest);

describe("settings/cloud-sync/accounts route", () => {
    const envBackup = process.env.STEAM_API_KEY;

    beforeEach(() => {
        mocks.state.selectQueue = [];
        mocks.state.txInsertCalls = [];
        mocks.db.select.mockClear();
        mocks.db.delete.mockClear();
        mocks.db.transaction.mockClear();
        mocks.axios.get.mockReset();
        mocks.axios.isAxiosError.mockReset();
        process.env.STEAM_API_KEY = "steam-key";
    });

    test("GET returns account list with profile", async () => {
        // Step 1: 准备单条 Bangumi 账号数据。
        mocks.state.selectQueue.push([
            {
                id: 1,
                provider: "bangumi",
                accountId: "alice",
                accessToken: "token",
                expiresAt: "",
                updatedAt: "now",
            },
        ]);
        mocks.axios.get.mockResolvedValueOnce({
            data: {
                username: "alice",
                nickname: "Alice",
                avatar: { large: "a.jpg" },
            },
        });

        // Step 2: 调用 GET。
        const response = await GET();
        const body = await response.json();

        // Step 3: 断言返回结构。
        expect(response.status).toBe(200);
        expect(body.data.items[0].profile.displayName).toBe("Alice");
    });

    test("POST validates provider", async () => {
        const response = await POST(req({ provider: "x" }));
        expect(response.status).toBe(400);
    });

    test("POST handles steam login by uid", async () => {
        mocks.axios.get.mockResolvedValueOnce({
            data: { response: { players: [{ steamid: "76561198000000000" }] } },
        });

        const response = await POST(
            req({ provider: "steam", accountId: "76561198000000000" }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.provider).toBe("steam");
        expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    });

    test("POST maps axios 401 to 401 response", async () => {
        const err = { response: { status: 401 } };
        mocks.axios.get.mockRejectedValueOnce(err);
        mocks.axios.isAxiosError.mockReturnValueOnce(true);

        const response = await POST(
            req({ provider: "bangumi", accessToken: "bad" }),
        );
        expect(response.status).toBe(401);
    });

    test("DELETE validates provider and deletes", async () => {
        const invalid = await DELETE({
            nextUrl: new URL("http://localhost/api?provider=bad"),
        } as NextRequest);
        expect(invalid.status).toBe(400);

        const ok = await DELETE({
            nextUrl: new URL("http://localhost/api?provider=steam"),
        } as NextRequest);
        const body = await ok.json();

        expect(ok.status).toBe(200);
        expect(body.data.deleted).toBe(true);
    });

    afterAll(() => {
        process.env.STEAM_API_KEY = envBackup;
    });
});
