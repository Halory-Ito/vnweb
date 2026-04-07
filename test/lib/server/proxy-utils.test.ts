import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    HttpsProxyAgent: vi.fn(function (this: any, url: string) {
        this.url = url;
    }),
    SocksProxyAgent: vi.fn(function (this: any, url: string) {
        this.url = url;
    }),
}));

vi.mock(
    "https-proxy-agent",
    () => ({ HttpsProxyAgent: mocks.HttpsProxyAgent }),
);
vi.mock(
    "socks-proxy-agent",
    () => ({ SocksProxyAgent: mocks.SocksProxyAgent }),
);

import { buildProxyAgentUrl, createProxyAgent } from "@/lib/server/proxy-utils";

describe("lib/server/proxy-utils", () => {
    test("buildProxyAgentUrl handles enabled/auth", () => {
        expect(
            buildProxyAgentUrl({
                enabled: true,
                type: "http",
                host: "localhost",
                port: 7890,
                username: "u",
                password: "p",
            }),
        ).toBe("http://u:p@localhost:7890");
    });

    test("createProxyAgent selects implementation by type", () => {
        const a = createProxyAgent({
            enabled: true,
            type: "http",
            host: "h",
            port: 1,
            username: "",
            password: "",
        });
        const b = createProxyAgent({
            enabled: true,
            type: "socks5",
            host: "h",
            port: 1,
            username: "",
            password: "",
        });

        expect(a).toBeTruthy();
        expect(b).toBeTruthy();
        expect(mocks.HttpsProxyAgent).toHaveBeenCalledTimes(1);
        expect(mocks.SocksProxyAgent).toHaveBeenCalledTimes(1);
    });
});
