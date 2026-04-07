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
            where: vi.fn(() => ({
                limit: vi.fn(async () => take()),
                orderBy: vi.fn(async () => take()),
            })),
            orderBy: vi.fn(async () => take()),
        })),
    }));
    const insert = vi.fn(() => ({
        values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 1 }]) })),
    }));
    const mkdir = vi.fn(async () => undefined);
    const writeFile = vi.fn(async () => undefined);

    return { state, db: { select, insert }, mkdir, writeFile };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs/promises",
    () => ({ default: { mkdir: mocks.mkdir, writeFile: mocks.writeFile } }),
);

import { GET, POST } from "@/app/api/game/[id]/memory/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/memory route", () => {
    beforeEach(() => {
        mocks.state.queue = [];
        mocks.db.select.mockClear();
        mocks.db.insert.mockClear();
    });

    test("GET returns 400 for invalid game id", async () => {
        const res = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
            ctx("0"),
        );
        expect(res.status).toBe(400);
    });

    test("GET returns memory list", async () => {
        mocks.state.queue.push([{ id: 1 }], [{ id: 11, title: "t" }]);

        const res = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.items).toHaveLength(1);
    });

    test("POST returns 400 when image file missing", async () => {
        mocks.state.queue.push([{ id: 1 }]);
        const req = {
            formData: async () => new FormData(),
        } as unknown as NextRequest;

        const res = await POST(req, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toContain("截图");
    });
});
