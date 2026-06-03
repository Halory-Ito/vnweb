import { describe, expect, test, vi } from "vitest";

import { buildProxyUrl, normalizeProxySettings } from "@/lib/settings/proxy-settings";

describe("lib/proxy-settings", () => {
    test("normalize trims and validates fields", () => {
        const result = normalizeProxySettings({
            enabled: 1 as any,
            type: "bad" as any,
            host: " 127.0.0.1 ",
            port: 0,
            username: " u ",
            password: " p ",
        });

        expect(result.enabled).toBe(true);
        expect(result.type).toBe("http");
        expect(result.host).toBe("127.0.0.1");
        expect(result.port).toBe(7890);
        expect(result.username).toBe("u");
        expect(result.password).toBe("p");
    });

    test("buildProxyUrl returns null when disabled and url when enabled", () => {
        expect(
            buildProxyUrl({
                enabled: false,
                type: "http",
                host: "localhost",
                port: 7890,
                username: "",
                password: "",
            }),
        ).toBeNull();

        expect(
            buildProxyUrl({
                enabled: true,
                type: "http",
                host: "localhost",
                port: 7890,
                username: "user",
                password: "pass",
            }),
        ).toBe("http://user:pass@localhost:7890");

        expect(
            buildProxyUrl({
                enabled: true,
                type: "https",
                host: "localhost",
                port: 7890,
                username: "",
                password: "",
            }),
        ).toBe("https://localhost:7890");
    });

    test("getEnabledProxySettings returns null when no enabled record", async () => {
        vi.resetModules();
        vi.doMock("@/lib/drizzle", () => ({
            db: {
                select: vi.fn(() => ({
                    from: vi.fn(() => ({
                        where: vi.fn(() => ({ limit: vi.fn(async () => []) })),
                    })),
                })),
            },
        }));

        const mod = await import("@/lib/settings/proxy-settings");
        const result = await mod.getEnabledProxySettings();

        expect(result).toBeNull();
    });

    test("getEnabledProxySettings maps db row", async () => {
        vi.resetModules();
        vi.doMock("@/lib/drizzle", () => ({
            db: {
                select: vi.fn(() => ({
                    from: vi.fn(() => ({
                        where: vi.fn(() => ({
                            limit: vi.fn(async () => [{
                                type: "http",
                                host: "127.0.0.1",
                                port: 7890,
                                username: "u",
                                password: "p",
                            }]),
                        })),
                    })),
                })),
            },
        }));

        const mod = await import("@/lib/settings/proxy-settings");
        const result = await mod.getEnabledProxySettings();

        expect(result).toEqual({
            enabled: true,
            type: "http",
            host: "127.0.0.1",
            port: 7890,
            username: "u",
            password: "p",
        });
    });
});
