import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = {
        allRows: [{ id: 1, name: "p1" }],
        returningRows: [{ id: 2, name: "p2" }],
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({ all: vi.fn(async () => state.allRows) })),
    }));
    const insert = vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn(async () => state.returningRows),
        })),
    }));
    const update = vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn(() => ({
                returning: vi.fn(async () => state.returningRows),
            })),
        })),
    }));
    const del = vi.fn(() => ({ where: vi.fn(async () => undefined) }));

    return { db: { select, insert, update, delete: del } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { DELETE, GET, POST, PUT } from "@/app/api/settings/proxy/route";

const req = (payload: unknown): NextRequest => ({
    json: async () => payload,
} as NextRequest);

describe("settings/proxy route", () => {
    beforeEach(() => {
        Object.values(mocks.db).forEach((fn) => {
            if (typeof fn === "function" && "mockClear" in fn) {
                (fn as any).mockClear();
            }
        });
    });

    test("GET returns proxy list", async () => {
        const response = await GET();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data[0].id).toBe(1);
    });

    test("POST validates required fields", async () => {
        const response = await POST(req({ name: "a" }));
        expect(response.status).toBe(400);
    });

    test("POST creates proxy", async () => {
        const response = await POST(
            req({
                name: "p",
                type: "http",
                host: "127.0.0.1",
                port: 7890,
                enabled: true,
            }),
        );
        expect(response.status).toBe(200);
    });

    test("PUT validates id", async () => {
        const response = await PUT(req({}));
        expect(response.status).toBe(400);
    });

    test("DELETE validates id and deletes", async () => {
        const bad = await DELETE(
            { url: "http://localhost/api/settings/proxy" } as NextRequest,
        );
        expect(bad.status).toBe(400);

        const ok = await DELETE(
            { url: "http://localhost/api/settings/proxy?id=1" } as NextRequest,
        );
        expect(ok.status).toBe(200);
    });
});
