import { describe, expect, test, vi } from "vitest";

describe("lib/vndb-client", () => {
    test("creates axios and sgdb clients", async () => {
        vi.resetModules();
        const create = vi.fn(() => ({ axiosClient: true }));
        const SGDB = vi.fn(function (this: any, opts: unknown) {
            this.opts = opts;
        });

        vi.doMock("axios", () => ({ default: { create } }));
        vi.doMock("steamgriddb", () => ({ default: SGDB }));

        const mod = await import("@/lib/vndb-client");

        expect(mod.BGMClient).toEqual({ axiosClient: true });
        expect(mod.SteamClient).toEqual({ axiosClient: true });
        expect(mod.VNDBClient).toEqual({ axiosClient: true });
        expect(create).toHaveBeenCalledTimes(3);
        expect(SGDB).toHaveBeenCalledTimes(1);
    });
});
