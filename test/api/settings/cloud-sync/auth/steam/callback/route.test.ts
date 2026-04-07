import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const axios = { post: vi.fn() };
    const day = { toISOString: vi.fn(() => "2026-04-07T00:00:00.000Z") };
    const transaction = vi.fn(async (cb: (tx: any) => Promise<void>) => {
        const tx = {
            delete: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
            insert: vi.fn(() => ({ values: vi.fn(async () => undefined) })),
        };
        await cb(tx);
    });
    return { axios, day, db: { transaction } };
});

vi.mock("axios", () => ({ default: mocks.axios }));
vi.mock("dayjs", () => ({ default: vi.fn(() => mocks.day) }));
vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/settings/cloud-sync/auth/steam/callback/route";

describe("settings/cloud-sync/auth/steam/callback GET", () => {
    beforeEach(() => {
        mocks.axios.post.mockReset();
        mocks.db.transaction.mockClear();
    });

    test("redirects failed when claimed_id missing", async () => {
        const response = await GET({
            nextUrl: new URL("http://localhost/callback"),
        } as NextRequest);
        expect(response.headers.get("location")).toContain("status=failed");
    });

    test("redirects failed when openid verification invalid", async () => {
        mocks.axios.post.mockResolvedValueOnce({ data: "is_valid:false" });
        const response = await GET({
            nextUrl: new URL(
                "http://localhost/callback?openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000",
            ),
        } as NextRequest);

        expect(response.headers.get("location")).toContain("status=failed");
    });

    test("redirects success and writes steam account", async () => {
        // Step 1: 验证接口返回有效。
        mocks.axios.post.mockResolvedValueOnce({ data: "is_valid:true" });

        // Step 2: 调用 callback。
        const response = await GET({
            nextUrl: new URL(
                "http://localhost/callback?openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000&openid.ns=x",
            ),
        } as NextRequest);

        // Step 3: 断言成功和事务写入。
        expect(response.headers.get("location")).toContain("status=success");
        expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    });
});
