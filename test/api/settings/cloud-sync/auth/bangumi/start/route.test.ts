import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    issueOAuthState: vi.fn(async () => "state123"),
    getAppOrigin: vi.fn(() => "http://localhost:3000"),
}));

vi.mock("@/app/api/settings/cloud-sync/auth/_shared", () => ({
    issueOAuthState: mocks.issueOAuthState,
    getAppOrigin: mocks.getAppOrigin,
}));

vi.mock("@/app/config", () => ({
    BANGUMI_OAUTH_CLIENT_ID: "",
}));

import { GET } from "@/app/api/settings/cloud-sync/auth/bangumi/start/route";

describe("settings/cloud-sync/auth/bangumi/start GET", () => {
    const oldId = process.env.BANGUMI_OAUTH_CLIENT_ID;

    beforeEach(() => {
        mocks.issueOAuthState.mockClear();
        mocks.getAppOrigin.mockClear();
        process.env.BANGUMI_OAUTH_CLIENT_ID = "cid";
    });

    test("returns 500 when missing client id", async () => {
        process.env.BANGUMI_OAUTH_CLIENT_ID = "";
        const response = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
        );
        expect(response.status).toBe(500);
    });

    test("redirects to authorize url", async () => {
        const response = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
        );
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain(
            "bgm.tv/oauth/authorize",
        );
    });

    afterAll(() => {
        process.env.BANGUMI_OAUTH_CLIENT_ID = oldId;
    });
});
