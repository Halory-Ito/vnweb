import { describe, expect, test, vi } from "vitest";

describe("lib/drizzle", () => {
    test("initializes drizzle with DB_FILE_NAME env", async () => {
        vi.resetModules();
        process.env.DB_FILE_NAME = "file:./x.db";
        const drizzle = vi.fn(() => ({ mocked: true }));
        vi.doMock("drizzle-orm/libsql", () => ({ drizzle }));

        const mod = await import("@/lib/drizzle");

        expect(mod.db).toEqual({ mocked: true });
        expect(drizzle).toHaveBeenCalledWith({
            connection: { url: "file:./x.db" },
        });
    });
});
