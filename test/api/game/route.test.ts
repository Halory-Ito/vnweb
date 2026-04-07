import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// vi.hoisted ensures this factory runs before module imports/mocks are evaluated.
// We use it to share mutable mock state across all tests in this file.
const mocks = vi.hoisted(() => {
    // Shared test-controlled state used by mocked implementations.
    const state = {
        // Records every db.insert(...).values(...) payload so assertions can inspect writes.
        insertCalls: [] as Array<{ table: unknown; valuesArg: unknown }>,
        // Controls the game id returned by mocked DB returning().
        gameId: 101,
        // Forces first insert to throw when true, to test error handling path.
        failOnFirstInsert: false,
    };

    // vi.fn creates a spy/mock function. Here it returns proxy settings asynchronously.
    const getEnabledProxySettings = vi.fn(async () => ({
        mode: "http",
        host: "127.0.0.1",
        port: 7890,
    }));

    // Mocked Steam API call returning trailer metadata expected by route logic.
    const fetchSteamAppDetails = vi.fn(async () => ({
        movies: [
            {
                name: "Launch Trailer",
                hls_h264: "https://cdn.example.com/trailer.m3u8",
            },
        ],
    }));

    // Mocked VNDB sync side-effect.
    const syncVndbCharactersByGameId = vi.fn(async () => undefined);

    // Mocked drizzle insert chain: db.insert(...).values(...).returning()/onConflictDoNothing().
    const insert = vi.fn((table: unknown) => {
        // Simulate DB failure only on first insert when switch is enabled.
        if (state.failOnFirstInsert && state.insertCalls.length === 0) {
            throw new Error("db insert failed");
        }

        // Capture table + values payload for later assertions.
        const call = { table, valuesArg: undefined as unknown };
        state.insertCalls.push(call);

        return {
            values: vi.fn((valuesArg: unknown) => {
                call.valuesArg = valuesArg;

                return {
                    // Simulate insert returning the generated id.
                    returning: vi.fn(async () => [{ id: state.gameId }]),
                    // Simulate no-op conflict handler branch used by some inserts.
                    onConflictDoNothing: vi.fn(async () => undefined),
                };
            }),
        };
    });

    return {
        state,
        db: { insert },
        getEnabledProxySettings,
        fetchSteamAppDetails,
        syncVndbCharactersByGameId,
    };
});

// vi.mock replaces imported modules with test doubles before route module is loaded.
vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

vi.mock("@/lib/proxy-settings", () => ({
    getEnabledProxySettings: mocks.getEnabledProxySettings,
}));

vi.mock("@/lib/server/vndb-character-sync", () => ({
    syncVndbCharactersByGameId: mocks.syncVndbCharactersByGameId,
}));

vi.mock("@/app/api/game/steam-import/_shared", () => ({
    fetchSteamAppDetails: mocks.fetchSteamAppDetails,
}));

import { POST } from "@/app/api/game/route";

// Minimal NextRequest-like object for unit tests; only json() is required by POST handler.
const createRequest = (payload: unknown): NextRequest => {
    return {
        json: async () => payload,
    } as NextRequest;
};

// describe groups related test cases and gives the suite a readable name in reports.
describe("app/api/game POST", () => {
    // beforeEach runs before every test case to isolate state and avoid cross-test pollution.
    beforeEach(() => {
        // Reset shared mock state.
        mocks.state.insertCalls = [];
        mocks.state.gameId = 101;
        mocks.state.failOnFirstInsert = false;

        // mockClear resets call history/instances while keeping mock implementations.
        mocks.db.insert.mockClear();
        mocks.getEnabledProxySettings.mockClear();
        mocks.fetchSteamAppDetails.mockClear();
        mocks.syncVndbCharactersByGameId.mockClear();
    });

    // test defines one independent behavior scenario.
    test("returns 400 when payload has no game name", async () => {
        // Step 1: Send invalid payload (missing required name field).
        const response = await POST(createRequest({ summary: "missing name" }));
        // Step 2: Parse JSON body returned by API handler.
        const body = await response.json();

        // Step 3: Verify status code and error message.
        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid game info payload" });
        // Step 4: Ensure DB insert path is never reached for invalid input.
        expect(mocks.db.insert).not.toHaveBeenCalled();
    });

    test("creates game and related data for steam source", async () => {
        // Step 1: Send valid steam-sourced payload covering many normalization branches.
        const response = await POST(
            createRequest({
                name: "Test Game",
                nameCn: "Test Game CN",
                date: "2026-01-01",
                summary: "A test game",
                tags: [" galgame ", "adventure"],
                nsfw: true,
                ailases: [" alias-a "],
                platforms: ["pc"],
                gameType: "VN",
                gameEngine: "krkr",
                websites: [{ Official: " https://example.com " }],
                links: [{ Store: "https://store.example.com" }],
                sourceMap: {
                    provider: "steam",
                    externalId: "480",
                },
            }),
        );

        // Step 2: Parse response body.
        const body = await response.json();

        // Step 3: Assert success response and returned id.
        expect(response.status).toBe(200);
        expect(body).toEqual({ data: { id: 101 } });

        // Step 4: Assert steam import dependencies are called with normalized args.
        // toHaveBeenCalledTimes verifies exact invocation count.
        expect(mocks.getEnabledProxySettings).toHaveBeenCalledTimes(1);
        // toHaveBeenCalledWith verifies call arguments including number conversion ("480" -> 480).
        expect(mocks.fetchSteamAppDetails).toHaveBeenCalledWith(480, {
            mode: "http",
            host: "127.0.0.1",
            port: 7890,
        });

        // Step 5: Find captured insert payload for core game table row.
        const gameInsertCall = mocks.state.insertCalls.find((call) => {
            return (
                typeof call.valuesArg === "object" &&
                call.valuesArg !== null &&
                !Array.isArray(call.valuesArg) &&
                "summary" in call.valuesArg &&
                "gameEngine" in call.valuesArg
            );
        });

        // toBeDefined ensures a matching insert happened.
        expect(gameInsertCall).toBeDefined();
        // toMatchObject allows partial matching; ideal for checking normalized fields only.
        expect(gameInsertCall?.valuesArg).toMatchObject({
            name: "Test Game",
            tags: "galgame,adventure",
            nsfw: 1,
            ailases: "alias-a",
            platforms: "pc",
        });

        // Step 6: Find inserted PV rows (identified by createdAt + url fields).
        const pvInsertCall = mocks.state.insertCalls.find((call) => {
            return (
                Array.isArray(call.valuesArg) &&
                call.valuesArg.length > 0 &&
                typeof call.valuesArg[0] === "object" &&
                call.valuesArg[0] !== null &&
                "createdAt" in call.valuesArg[0] &&
                "url" in call.valuesArg[0]
            );
        });

        expect(pvInsertCall).toBeDefined();

        // Step 7: Find website/link rows (name + url, but no createdAt marker).
        const websiteInsertCall = mocks.state.insertCalls.find((call) => {
            return (
                Array.isArray(call.valuesArg) &&
                call.valuesArg.length > 0 &&
                typeof call.valuesArg[0] === "object" &&
                call.valuesArg[0] !== null &&
                "name" in call.valuesArg[0] &&
                "url" in call.valuesArg[0] &&
                !("createdAt" in call.valuesArg[0])
            );
        });

        // Step 8: Verify merged and trimmed website/link rows are written as expected.
        expect(websiteInsertCall).toBeDefined();
        expect(websiteInsertCall?.valuesArg).toEqual([
            { gameId: 101, name: "Official", url: "https://example.com" },
            { gameId: 101, name: "Store", url: "https://store.example.com" },
        ]);
    });

    test("syncs VNDB characters when source provider is vndb", async () => {
        // Step 1: Send payload with VNDB provider.
        const response = await POST(
            createRequest({
                name: "VNDB Game",
                sourceMap: {
                    provider: "vndb",
                    externalId: "v12345",
                },
            }),
        );

        // Step 2: Ensure request succeeds and VNDB sync side-effect runs.
        expect(response.status).toBe(200);
        expect(mocks.syncVndbCharactersByGameId).toHaveBeenCalledWith(101);
        // Step 3: Ensure steam-only branch is not executed.
        expect(mocks.fetchSteamAppDetails).not.toHaveBeenCalled();
    });

    test("returns 500 when database insert fails", async () => {
        // Step 1: Force mocked DB failure on first insert.
        mocks.state.failOnFirstInsert = true;

        // Step 2: Submit otherwise valid payload.
        const response = await POST(createRequest({ name: "Broken Game" }));
        // Step 3: Parse error response.
        const body = await response.json();

        // Step 4: Assert route returns generic server error contract.
        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "Failed to save game" });
    });
});
