import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = { queue: [] as Array<unknown[] | Error> };
    const take = () => {
        const item = state.queue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({ limit: vi.fn(async () => take()) })),
        })),
    }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    return { state, db: { select }, mkdir, writeFile };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({ default: { mkdir: mocks.mkdir, writeFile: mocks.writeFile } }),
);

import { POST } from "@/app/api/game/[id]/ost/lyric/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/ost/lyric POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns 400 when file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const req = {
            formData: async () => new FormData(),
        } as unknown as NextRequest;

        const res = await POST(req, ctx("1"));
        expect(res.status).toBe(400);
    });

    test("returns 404 when ost item not found", async () => {
        mocks.state.queue.push([{ id: 1 }], []);

        const fd = new FormData();
        fd.set("itemId", "1");
        fd.set("file", new File(["[00:01]a"], "a.lrc", { type: "text/plain" }));
        const req = { formData: async () => fd } as unknown as NextRequest;

        const res = await POST(req, ctx("1"));
        expect(res.status).toBe(404);
    });
});
