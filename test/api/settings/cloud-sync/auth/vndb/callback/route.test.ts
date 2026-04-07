import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    validateOAuthState: vi.fn(async () => true),
    saveThirdPartyAccount: vi.fn(async () => undefined),
    getAppOrigin: vi.fn(() => "http://localhost:3000"),
    axios: { post: vi.fn(), get: vi.fn() },
    day: {
        add: vi.fn(() => ({ toISOString: () => "2026-04-07T01:00:00.000Z" })),
    },
}));

vi.mock("axios", () => ({ default: mocks.axios }));
vi.mock("dayjs", () => ({ default: vi.fn(() => mocks.day) }));
vi.mock("@/app/api/settings/cloud-sync/auth/_shared", () => ({
    validateOAuthState: mocks.validateOAuthState,
    saveThirdPartyAccount: mocks.saveThirdPartyAccount,
    getAppOrigin: mocks.getAppOrigin,
}));

import { GET } from "@/app/api/settings/cloud-sync/auth/vndb/callback/route";

const req = (
    url: string,
): NextRequest => ({ nextUrl: new URL(url) } as NextRequest);

describe("settings/cloud-sync/auth/vndb/callback GET", () => {
    const oldId = process.env.VNDB_OAUTH_CLIENT_ID;
    const oldSecret = process.env.VNDB_OAUTH_CLIENT_SECRET;

    beforeEach(() => {
        process.env.VNDB_OAUTH_CLIENT_ID = "cid";
        process.env.VNDB_OAUTH_CLIENT_SECRET = "sec";
        mocks.validateOAuthState.mockReset();
        mocks.saveThirdPartyAccount.mockReset();
        mocks.axios.post.mockReset();
        mocks.axios.get.mockReset();
        mocks.validateOAuthState.mockResolvedValue(true);
    });

    test("redirects failed when missing code", async () => {
        const response = await GET(req("http://localhost/callback?state=s"));
        expect(response.headers.get("location")).toContain("missing_code");
    });

    test("redirects failed when invalid state", async () => {
        mocks.validateOAuthState.mockResolvedValueOnce(false);
        const response = await GET(
            req("http://localhost/callback?code=c&state=s"),
        );
        expect(response.headers.get("location")).toContain("invalid_state");
    });

    test("redirects success and saves account", async () => {
        // Step 1: 模拟 token + 用户信息。
        mocks.axios.post.mockResolvedValueOnce({
            data: { access_token: "at", refresh_token: "rt", expires_in: 100 },
        });
        mocks.axios.get
            .mockRejectedValueOnce(new Error("bearer fail"))
            .mockResolvedValueOnce({ data: { id: "u1" } });

        // Step 2: 执行回调。
        const response = await GET(
            req("http://localhost/callback?code=c&state=s"),
        );

        // Step 3: 断言成功跳转与保存调用。
        expect(response.headers.get("location")).toContain("status=success");
        expect(mocks.saveThirdPartyAccount).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
        process.env.VNDB_OAUTH_CLIENT_ID = oldId;
        process.env.VNDB_OAUTH_CLIENT_SECRET = oldSecret;
    });
});
