import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    api: {
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@/lib/request-utils", () => ({ api: mocks.api }));

import {
    bindThirdPartyAccount,
    getThirdPartyAccounts,
    syncSteamPlaytime,
    unlinkThirdPartyAccount,
} from "@/lib/cloud-sync-utils";

describe("lib/cloud-sync-utils", () => {
    beforeEach(() => {
        mocks.api.post.mockReset();
        mocks.api.get.mockReset();
        mocks.api.delete.mockReset();
    });

    test("bindThirdPartyAccount returns data field", async () => {
        mocks.api.post.mockResolvedValueOnce({
            data: {
                data: { provider: "steam", accountId: "1", updatedAt: "t" },
            },
        });
        const data = await bindThirdPartyAccount({
            provider: "steam",
            accountId: "1",
        });
        expect(data.provider).toBe("steam");
    });

    test("get/unlink/sync delegates to api", async () => {
        mocks.api.get.mockResolvedValueOnce({ data: { data: { items: [] } } });
        mocks.api.delete.mockResolvedValueOnce({
            data: { data: { deleted: true, provider: "steam" } },
        });
        mocks.api.post.mockResolvedValueOnce({
            data: { data: { success: true } },
        });

        const a = await getThirdPartyAccounts();
        const b = await unlinkThirdPartyAccount("steam");
        const c = await syncSteamPlaytime();

        expect(a.items).toEqual([]);
        expect(b.deleted).toBe(true);
        expect(c.success).toBe(true);
    });
});
