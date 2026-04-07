import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type RequestQueueItem =
    | { type: "resolve"; data: unknown }
    | { type: "reject"; error: unknown };

const mocks = vi.hoisted(() => {
    const state = {
        requestQueue: [] as RequestQueueItem[],
        requestConfigs: [] as unknown[],
    };

    const request = vi.fn(async (config: unknown) => {
        state.requestConfigs.push(config);
        const item = state.requestQueue.shift();
        if (!item) {
            return { data: {} };
        }
        if (item.type === "reject") {
            throw item.error;
        }
        return { data: item.data };
    });

    const getBoundThirdPartyAccount = vi.fn(async (): Promise<
        | { accessToken?: string }
        | null
    > => null);

    return {
        state,
        BGMClient: { request },
        getBoundThirdPartyAccount,
    };
});

vi.mock("@/lib/vndb-client", () => ({
    BGMClient: mocks.BGMClient,
}));

vi.mock("../../game/third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
}));

vi.mock("@/app/api/game/third-party-import/_shared", () => ({
    getBoundThirdPartyAccount: mocks.getBoundThirdPartyAccount,
}));

vi.mock("axios", () => ({
    default: {
        isAxiosError: (error: unknown) => {
            return Boolean(
                error &&
                    typeof error === "object" &&
                    "isAxiosError" in error &&
                    (error as { isAxiosError?: boolean }).isAxiosError,
            );
        },
    },
}));

import { GET, POST } from "@/app/api/db/bgm/route";

const createRequest = (options: {
    body?: unknown;
    id?: string;
    offset?: string;
    limit?: string;
}): NextRequest => {
    const url = new URL("http://localhost/api/db/bgm");
    if (options.id !== undefined) {
        url.searchParams.set("id", options.id);
    }
    if (options.offset !== undefined) {
        url.searchParams.set("offset", options.offset);
    }
    if (options.limit !== undefined) {
        url.searchParams.set("limit", options.limit);
    }

    return {
        json: async () => options.body,
        nextUrl: url,
    } as NextRequest;
};

describe("app/api/db/bgm route", () => {
    beforeEach(() => {
        mocks.state.requestQueue = [];
        mocks.state.requestConfigs = [];

        mocks.BGMClient.request.mockClear();
        mocks.getBoundThirdPartyAccount.mockClear();
    });

    test("POST forwards form data and pagination params", async () => {
        // Step 1: 准备 BGM 搜索接口返回值。
        mocks.state.requestQueue.push({
            type: "resolve",
            data: { results: [{ id: 1 }] },
        });

        // Step 2: 调用 POST 并附带 offset/limit。
        const response = await POST(
            createRequest({
                body: { keyword: "clannad" },
                offset: "20",
                limit: "5",
            }),
        );
        const body = await response.json();

        // Step 3: 校验返回数据与 BGMClient 调用参数。
        expect(response.status).toBe(200);
        expect(body).toEqual({ results: [{ id: 1 }] });
        expect(mocks.BGMClient.request).toHaveBeenCalledTimes(1);
        expect(mocks.state.requestConfigs[0]).toMatchObject({
            method: "POST",
            url: "/v0/search/subjects",
            data: { keyword: "clannad" },
            params: {
                offset: "20",
                limit: "5",
            },
        });
    });

    test("GET returns 400 when id is missing", async () => {
        const response = await GET(createRequest({}));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Missing id parameter" });
    });

    test("GET returns 400 when id is invalid", async () => {
        const response = await GET(createRequest({ id: "abc" }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid id parameter" });
    });

    test("GET returns subject when first request succeeds", async () => {
        mocks.state.requestQueue.push({
            type: "resolve",
            data: { id: 777, name: "Test Subject" },
        });

        const response = await GET(createRequest({ id: "777" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ id: 777, name: "Test Subject" });
        expect(mocks.BGMClient.request).toHaveBeenCalledTimes(1);
    });

    test("GET retries with bound bangumi token on 401 error", async () => {
        // Step 1: 第一次请求抛 401，第二次请求成功。
        const axios401 = {
            isAxiosError: true,
            response: { status: 401 },
        };
        mocks.state.requestQueue.push(
            { type: "reject", error: axios401 },
            { type: "resolve", data: { id: 12, name: "Fallback Subject" } },
        );
        mocks.getBoundThirdPartyAccount.mockResolvedValue({
            accessToken: "token-123",
        });

        // Step 2: 调用 GET。
        const response = await GET(createRequest({ id: "12" }));
        const body = await response.json();

        // Step 3: 校验二次请求带 Authorization 和 User-Agent。
        expect(response.status).toBe(200);
        expect(body).toEqual({ id: 12, name: "Fallback Subject" });
        expect(mocks.BGMClient.request).toHaveBeenCalledTimes(2);
        expect(mocks.getBoundThirdPartyAccount).toHaveBeenCalledWith("bangumi");
        expect(mocks.state.requestConfigs[1]).toMatchObject({
            method: "GET",
            url: "/v0/subjects/12",
            headers: {
                Authorization: "Bearer token-123",
            },
        });
    });

    test("GET throws when fallback account token is unavailable", async () => {
        const axios403 = {
            isAxiosError: true,
            response: { status: 403 },
        };
        mocks.state.requestQueue.push({ type: "reject", error: axios403 });
        mocks.getBoundThirdPartyAccount.mockResolvedValue(null);

        await expect(GET(createRequest({ id: "9" }))).rejects.toBe(axios403);
        expect(mocks.BGMClient.request).toHaveBeenCalledTimes(1);
    });
});
