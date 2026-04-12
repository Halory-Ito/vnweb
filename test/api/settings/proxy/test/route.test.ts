import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const get = vi.fn();
    const axiosInstance = { defaults: {}, get };
    const create = vi.fn(() => axiosInstance);
    const axios = { create };
    const HttpsProxyAgent = vi.fn(
        function (this: { proxy: string }, url: string) {
            this.proxy = url;
        },
    );

    return { axios, create, get, axiosInstance, HttpsProxyAgent };
});

vi.mock("axios", () => ({ default: mocks.axios }));
vi.mock(
    "https-proxy-agent",
    () => ({ HttpsProxyAgent: mocks.HttpsProxyAgent }),
);

import { GET } from "@/app/api/settings/proxy/test/route";

const req = (
    url: string,
): NextRequest => ({ nextUrl: new URL(url) } as NextRequest);

describe("settings/proxy/test GET", () => {
    beforeEach(() => {
        mocks.create.mockClear();
        mocks.get.mockReset();
        mocks.HttpsProxyAgent.mockClear();
    });

    test("returns 400 when url missing", async () => {
        const response = await GET(req("http://localhost/test"));
        expect(response.status).toBe(400);
    });

    test("tests direct request successfully", async () => {
        mocks.get.mockResolvedValueOnce({ status: 200, statusText: "OK" });

        const response = await GET(
            req("http://localhost/test?url=https://example.com"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.message).toContain("直连");
    });

    test("uses proxy agent when proxy param provided", async () => {
        // Step 1: 代理模式请求。
        mocks.get.mockResolvedValueOnce({ status: 302, statusText: "Found" });

        // Step 2: 调用接口。
        const response = await GET(
            req("http://localhost/test?url=https://example.com&proxy=http://127.0.0.1:7890"),
        );
        const body = await response.json();

        // Step 3: 断言代理分支。
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mocks.HttpsProxyAgent).toHaveBeenCalledTimes(1);
    });

    test("marks non-2xx/3xx responses as failed", async () => {
        mocks.get.mockResolvedValueOnce({ status: 500, statusText: "ERR" });

        const response = await GET(
            req("http://localhost/test?url=https://example.com"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(false);
        expect(body.status).toBe(500);
    });

    test("maps timeout error message", async () => {
        mocks.get.mockRejectedValueOnce(new Error("ETIMEDOUT"));

        const response = await GET(
            req("http://localhost/test?url=https://example.com"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(false);
        expect(body.error).toContain("连接超时");
    });

    test("maps ENOTFOUND error message", async () => {
        mocks.get.mockRejectedValueOnce(new Error("ENOTFOUND"));

        const response = await GET(
            req("http://localhost/test?url=https://example.com"),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(false);
        expect(body.error).toContain("无法解析");
    });
});
