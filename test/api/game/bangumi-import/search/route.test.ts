import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const axiosGet = vi.fn(async () => ({ data: {} }));
    const getBoundThirdPartyAccount = vi.fn(async (): Promise<
        | { accessToken?: string }
        | null
    > => null);
    const getImportedExternalIdSet = vi.fn(async () => new Set<string>());

    return {
        axiosGet,
        getBoundThirdPartyAccount,
        getImportedExternalIdSet,
    };
});

vi.mock("axios", () => ({
    default: {
        get: mocks.axiosGet,
    },
}));

vi.mock("@/app/api/game/third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
    getImportedExternalIdSet: mocks.getImportedExternalIdSet,
}));

vi.mock("../../third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
    getImportedExternalIdSet: mocks.getImportedExternalIdSet,
}));

import { GET } from "@/app/api/game/bangumi-import/search/route";

describe("app/api/game/bangumi-import/search GET", () => {
    beforeEach(() => {
        mocks.axiosGet.mockClear();
        mocks.getBoundThirdPartyAccount.mockClear();
        mocks.getImportedExternalIdSet.mockClear();
    });

    test("returns 400 when bangumi account is not bound", async () => {
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce(null);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "请先绑定 Bangumi 账号" });
    });

    test("returns collected game list with imported flag", async () => {
        // Step 1: 模拟账号、用户名、收藏页和导入 id 集合。
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce({
            accessToken: "token",
        });
        mocks.getImportedExternalIdSet.mockResolvedValueOnce(new Set(["101"]));
        mocks.axiosGet
            .mockResolvedValueOnce({ data: { username: "alice" } })
            .mockResolvedValueOnce({
                data: [
                    {
                        subject_id: 101,
                        updated_at: "2026-01-01",
                        subject: {
                            id: 101,
                            name: "A",
                            name_cn: "游戏A",
                            date: "2025-02-02",
                            images: { large: "https://img/a.jpg" },
                        },
                    },
                ],
            });

        // Step 2: 执行 GET。
        const response = await GET();
        const body = await response.json();

        // Step 3: 断言格式化结果。
        expect(response.status).toBe(200);
        expect(body.data.total).toBe(1);
        expect(body.data.items[0]).toEqual({
            id: "101",
            name: "游戏A",
            date: "2025-02-02",
            coverUrl: "https://img/a.jpg",
            note: "2026-01-01",
            alreadyImported: true,
        });
    });

    test("returns 500 when username fetch fails", async () => {
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce({
            accessToken: "token",
        });
        mocks.axiosGet.mockResolvedValueOnce({ data: { username: "" } });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("无法获取 Bangumi 用户名");
    });
});
