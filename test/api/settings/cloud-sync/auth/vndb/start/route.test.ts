import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    issueOAuthState: vi.fn(async () => "state-v"),
    getAppOrigin: vi.fn(() => "http://localhost:3000"),
}));

vi.mock("@/app/api/settings/cloud-sync/auth/_shared", () => ({
    issueOAuthState: mocks.issueOAuthState,
    getAppOrigin: mocks.getAppOrigin,
}));

import { GET } from "@/app/api/settings/cloud-sync/auth/vndb/start/route";

describe("settings/cloud-sync/auth/vndb/start GET", () => {
    const oldId = process.env.VNDB_OAUTH_CLIENT_ID;

    beforeEach(() => {
        mocks.issueOAuthState.mockClear();
        process.env.VNDB_OAUTH_CLIENT_ID = "vndb-client";
        delete process.env.VNDB_OAUTH_SCOPE;
    });

    test("returns 500 when missing client id", async () => {
        process.env.VNDB_OAUTH_CLIENT_ID = "";
        const response = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
        );
        expect(response.status).toBe(500);
    });

    test("redirects to authorize url", async () => {
        process.env.VNDB_OAUTH_SCOPE = "basic";
        const response = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
        );
        const location = response.headers.get("location") || "";

        expect(response.status).toBe(307);
        expect(location).toContain("vndb.org/oauth/authorize");
        expect(location).toContain("scope=basic");
    });

    afterAll(() => {
        process.env.VNDB_OAUTH_CLIENT_ID = oldId;
    });
});
