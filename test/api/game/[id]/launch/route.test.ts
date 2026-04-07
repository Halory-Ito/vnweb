import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = { selectQueue: [] as Array<unknown[] | Error> };
    const take = () => {
        const item = state.selectQueue.shift();
        if (!item) return [];
        if (item instanceof Error) throw item;
        return item;
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({ limit: vi.fn(async () => take()) })),
        })),
    }));
    const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
    }));
    const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));
    const access = vi.fn(async () => undefined);
    const mkdir = vi.fn(async () => undefined);
    const copyFile = vi.fn(async () => undefined);
    const unref = vi.fn(() => undefined);
    const spawn = vi.fn(() => ({ unref }));
    const extractIconFromExe = vi.fn(async () => "D:/icon/out.ico");

    return {
        state,
        db: { select, update, insert },
        access,
        mkdir,
        copyFile,
        spawn,
        unref,
        extractIconFromExe,
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "node:fs",
    () => ({
        default: {
            promises: {
                access: mocks.access,
                mkdir: mocks.mkdir,
                copyFile: mocks.copyFile,
            },
            constants: { F_OK: 0 },
        },
    }),
);
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("@/win/extract-icon", () => ({ default: mocks.extractIconFromExe }));

import { POST } from "@/app/api/game/[id]/launch/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("game/[id]/launch POST", () => {
    beforeEach(() => {
        mocks.state.selectQueue = [];
        Object.values(mocks).forEach((v) => {
            if (typeof v === "function" && "mockClear" in v) {
                (v as any).mockClear();
            }
        });
    });

    test("returns 404 when game not found", async () => {
        mocks.state.selectQueue.push([]);

        const res = await POST(req({ exePath: "D:/a.exe" }), ctx("1"));
        expect(res.status).toBe(404);
    });

    test("returns 400 when exe path missing", async () => {
        mocks.state.selectQueue.push(
            [{ id: 1, name: "A", date: "2025-01-01" }],
            [{ id: 10, exePath: "", isRunning: 0 }],
        );

        const res = await POST(req({ exePath: "" }), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.requireExePath).toBe(true);
    });

    test("launches game successfully", async () => {
        // Step: 命中游戏与 play 行后执行图标提取和启动。
        mocks.state.selectQueue.push(
            [{ id: 1, name: "A", date: "2025-01-01" }],
            [{ id: 10, exePath: "D:/a.exe", isRunning: 0 }],
        );

        const res = await POST(req({}), ctx("1"));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(mocks.extractIconFromExe).toHaveBeenCalled();
        expect(mocks.spawn).toHaveBeenCalled();
        expect(mocks.unref).toHaveBeenCalled();
        expect(body.data.exePath).toContain("D:");
    });
});
