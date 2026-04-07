import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const axiosPost = vi.fn(async (): Promise<{
        data: { results: Array<Record<string, unknown>>; more: boolean };
    }> => ({ data: { results: [], more: false } }));
    const getBoundThirdPartyAccount = vi.fn(async () =>
        null as null | { accessToken?: string }
    );
    const getImportedExternalIdSet = vi.fn(async () => new Set<string>());

    return { axiosPost, getBoundThirdPartyAccount, getImportedExternalIdSet };
});

vi.mock("axios", () => ({ default: { post: mocks.axiosPost } }));
vi.mock("@/app/api/game/third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
    getImportedExternalIdSet: mocks.getImportedExternalIdSet,
}));
vi.mock("../../third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
    getImportedExternalIdSet: mocks.getImportedExternalIdSet,
}));

import { GET } from "@/app/api/game/vndb-import/search/route";

describe("app/api/game/vndb-import/search GET", () => {
    beforeEach(() => {
        Object.values(mocks).forEach((fn) => {
            if (typeof fn === "function" && "mockClear" in fn) {
                (fn as any).mockClear();
            }
        });
    });

    test("returns 400 when vndb account is not bound", async () => {
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce(null);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "请先绑定 VNDB 账号" });
    });

    test("returns normalized vndb list", async () => {
        // Step 1: 模拟账号、ulist 响应和导入集合。
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce({
            accessToken: "token",
        });
        mocks.getImportedExternalIdSet.mockResolvedValueOnce(new Set(["v1"]));
        mocks.axiosPost.mockResolvedValueOnce({
            data: {
                results: [
                    {
                        id: "v1",
                        labels: [{ label: "在玩" }],
                        vn: {
                            title: "VN 1",
                            alttitle: "中文名",
                            released: "2025-01-01",
                            image: { url: "https://img/v1.jpg" },
                        },
                    },
                ],
                more: false,
            },
        });

        // Step 2: 调用 GET。
        const response = await GET();
        const body = await response.json();

        // Step 3: 断言输出结构。
        expect(response.status).toBe(200);
        expect(body.data.total).toBe(1);
        expect(body.data.items[0]).toEqual({
            id: "v1",
            name: "中文名",
            date: "2025-01-01",
            coverUrl: "https://img/v1.jpg",
            note: "在玩",
            alreadyImported: true,
        });
    });

    test("returns 500 when vndb request fails", async () => {
        mocks.getBoundThirdPartyAccount.mockResolvedValueOnce({
            accessToken: "token",
        });
        mocks.axiosPost.mockRejectedValueOnce(new Error("vndb failed"));

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({ error: "vndb failed" });
    });
});
