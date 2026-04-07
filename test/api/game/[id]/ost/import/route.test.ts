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

import { POST } from "@/app/api/game/[id]/ost/import/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/ost/import POST", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
    });

    test("returns 400 when upload file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const req = {
            formData: async () => new FormData(),
        } as unknown as NextRequest;

        const res = await POST(req, ctx("1"));
        expect(res.status).toBe(400);
    });

    test("imports ost audio file", async () => {
        mocks.state.queue.push([{ id: 1 }]);

        const fd = new FormData();
        fd.set(
            "file",
            new File([new Uint8Array([1, 2])], "song.mp3", {
                type: "audio/mpeg",
            }),
        );
        const req = { formData: async () => fd } as unknown as NextRequest;

        const res = await POST(req, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.name).toBe("song");
    });
});
