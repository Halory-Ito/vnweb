import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(async () => [{ exePath: "C:/Games/a.exe" }]),
            })),
        })),
    }));
    const access = vi.fn(async () => undefined);
    const unref = vi.fn(() => undefined);
    const spawn = vi.fn(() => ({ unref }));
    return { db: { select }, access, spawn, unref };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs",
    () => ({
        default: { promises: { access: mocks.access }, constants: { F_OK: 0 } },
    }),
);
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

import { POST } from "@/app/api/game/[id]/browse-local/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("game/[id]/browse-local POST", () => {
    beforeEach(() => {
        mocks.db.select.mockClear();
        mocks.access.mockClear();
        mocks.spawn.mockClear();
        mocks.unref.mockClear();
    });

    test("returns 400 for invalid game id", async () => {
        const res = await POST({} as NextRequest, ctx("0"));
        expect(res.status).toBe(400);
    });

    test("returns 400 when exe path is missing", async () => {
        mocks.db.select.mockImplementationOnce(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(async () => [{ exePath: "" }]),
                })),
            })),
        }));

        const res = await POST({} as NextRequest, ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.requireExePath).toBe(true);
    });

    test("opens local file successfully", async () => {
        // Step 1: 模拟路径存在并成功调用 explorer。
        const res = await POST({} as NextRequest, ctx("1"));
        const body = await res.json();

        // Step 2: 断言返回与子进程调用。
        expect(res.status).toBe(200);
        expect(body.data.opened).toBe(true);
        expect(mocks.spawn).toHaveBeenCalled();
        expect(mocks.unref).toHaveBeenCalled();
    });
});
