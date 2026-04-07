import { describe, expect, test, vi } from "vitest";

describe("lib/request-utils", () => {
    test("creates axios instance with default baseURL", async () => {
        vi.resetModules();
        const create = vi.fn(() => ({ instance: true }));
        vi.doMock("axios", () => ({ default: { create } }));

        const mod = await import("@/lib/request-utils");

        expect(mod.api).toEqual({ instance: true });
        expect(create).toHaveBeenCalledTimes(1);
        const firstCall = create.mock.calls[0] as unknown[];
        const config = firstCall[0] as { baseURL: string; proxy: boolean };
        expect(config.baseURL).toContain("/api");
        expect(config.proxy).toBe(false);
    });
});
