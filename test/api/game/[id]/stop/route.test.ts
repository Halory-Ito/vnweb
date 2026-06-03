import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(async () => [{ isRunning: 1 }]),
            })),
        })),
    }));
    const finalizeGameSession = vi.fn(async () => undefined);
    return { db: { select }, finalizeGameSession };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "@/lib/game/game-session-utils",
    () => ({ finalizeGameSession: mocks.finalizeGameSession }),
);

import { POST } from "@/app/api/game/[id]/stop/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/stop POST", () => {
    beforeEach(() => {
        mocks.db.select.mockClear();
        mocks.finalizeGameSession.mockClear();
    });

    test("returns 400 for invalid game id", async () => {
        const res = await POST({} as NextRequest, ctx("-1"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when game is not running", async () => {
        mocks.db.select.mockImplementationOnce(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(async () => [{ isRunning: 0 }]),
                })),
            })),
        }));

        const res = await POST({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body).toEqual({ error: "游戏未在运行" });
    });

    test("stops running game", async () => {
        // Step: 命中运行状态后调用 finalizeGameSession。
        const res = await POST({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(mocks.finalizeGameSession).toHaveBeenCalledWith(1);
        expect(body).toEqual({ data: { stopped: true } });
    });
});
