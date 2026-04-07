import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const request = vi.fn(async (_config: unknown) => ({ data: {} }));

    return {
        VNDBClient: { request },
    };
});

vi.mock("@/lib/vndb-client", () => ({
    VNDBClient: mocks.VNDBClient,
}));

import { GET, POST } from "@/app/api/db/vndb/route";

const createPostRequest = (options: {
    keyword?: string;
    offset?: string;
    limit?: string;
}): NextRequest => {
    const url = new URL("http://localhost/api/db/vndb");
    if (options.offset !== undefined) {
        url.searchParams.set("offset", options.offset);
    }
    if (options.limit !== undefined) {
        url.searchParams.set("limit", options.limit);
    }

    return {
        json: async () => ({ keyword: options.keyword }),
        nextUrl: url,
    } as NextRequest;
};

const createGetRequest = (id?: string): NextRequest => {
    const url = new URL("http://localhost/api/db/vndb");
    if (id !== undefined) {
        url.searchParams.set("id", id);
    }
    return {
        nextUrl: url,
    } as NextRequest;
};

describe("app/api/db/vndb route", () => {
    beforeEach(() => {
        mocks.VNDBClient.request.mockClear();
    });

    test("POST returns empty result when keyword is empty", async () => {
        const response = await POST(createPostRequest({ keyword: "   " }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ results: [], count: 0, more: false });
        expect(mocks.VNDBClient.request).not.toHaveBeenCalled();
    });

    test("POST calls VNDB with normalized pagination", async () => {
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: { results: [{ id: "v1" }], count: 1, more: false },
        });

        const response = await POST(
            createPostRequest({
                keyword: " steins ",
                offset: "51",
                limit: "100",
            }),
        );
        const body = await response.json();

        // limit 会被夹到 50；page 由 offset/limit 计算。
        expect(response.status).toBe(200);
        expect(body).toEqual({
            results: [{ id: "v1" }],
            count: 1,
            more: false,
        });
        expect(mocks.VNDBClient.request).toHaveBeenCalledTimes(1);
        expect(mocks.VNDBClient.request.mock.calls[0]?.[0]).toMatchObject({
            method: "POST",
            url: "/vn",
            data: {
                filters: ["search", "=", "steins"],
                results: 50,
                page: 1,
                count: true,
            },
        });
    });

    test("GET returns 400 when id is invalid", async () => {
        const response = await GET(createGetRequest("bad-id"));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid id parameter" });
    });

    test("GET supports numeric id and returns item", async () => {
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: { results: [{ id: "v12", title: "VN" }] },
        });

        const response = await GET(createGetRequest("12"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ id: "v12", title: "VN" });
        expect(mocks.VNDBClient.request.mock.calls[0]?.[0]).toMatchObject({
            data: {
                filters: ["id", "=", "v12"],
                results: 1,
            },
        });
    });

    test("GET returns 404 when VNDB entry is missing", async () => {
        mocks.VNDBClient.request.mockResolvedValueOnce({
            data: { results: [] },
        });

        const response = await GET(createGetRequest("v3"));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "VNDB entry not found" });
    });
});
