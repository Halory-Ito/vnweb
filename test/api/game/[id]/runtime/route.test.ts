import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(
                    async () => [{ isRunning: 0, lastLaunchedAt: "" }]
                ),
            })),
        })),
    }));
    return { db: { select } };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));

import { GET } from "@/app/api/game/[id]/runtime/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/runtime GET", () => {
    beforeEach(() => {
        mocks.db.select.mockClear();
    });

    test("returns 400 for invalid game id", async () => {
        const res = await GET({} as NextRequest, ctx("0"));
        expect(res.status).toBe(400);
    });

    test("returns not running state by default", async () => {
        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({
            data: { isRunning: false, currentSessionSeconds: 0 },
        });
    });

    test("returns running runtime seconds", async () => {
        const startedAt = new Date(Date.now() - 5000).toISOString();
        mocks.db.select.mockImplementationOnce(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(
                        async () => [{
                            isRunning: 1,
                            lastLaunchedAt: startedAt,
                        }]
                    ),
                })),
            })),
        }));

        const res = await GET({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.isRunning).toBe(true);
        expect(body.data.currentSessionSeconds).toBeGreaterThanOrEqual(4);
    });
});
