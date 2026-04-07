import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = { selectRows: [] as any[] };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(async () => state.selectRows),
            })),
        })),
    }));

    const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
    }));

    const insert = vi.fn(() => ({ values: vi.fn(async () => undefined) }));

    return {
        state,
        db: { select, update, insert },
        sql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
        eq: vi.fn(() => "eq"),
    };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock("drizzle-orm", () => ({ sql: mocks.sql, eq: mocks.eq }));

import { finalizeGameSession } from "@/lib/game-session-utils";

describe("lib/game-session-utils", () => {
    beforeEach(() => {
        mocks.state.selectRows = [];
        mocks.db.select.mockClear();
        mocks.db.update.mockClear();
        mocks.db.insert.mockClear();
    });

    test("returns not finalized when no running session", async () => {
        const result = await finalizeGameSession(1);
        expect(result.finalized).toBe(false);
    });

    test("finalizes running session", async () => {
        // Step 1: 准备运行中记录。
        mocks.state.selectRows = [{
            id: 1,
            isRunning: 1,
            lastLaunchedAt: new Date().toISOString(),
        }];

        // Step 2: 执行 finalize。
        const result = await finalizeGameSession(1);

        // Step 3: 断言更新与记录写入。
        expect(result.finalized).toBe(true);
        expect(mocks.db.update).toHaveBeenCalledTimes(1);
        expect(mocks.db.insert).toHaveBeenCalledTimes(1);
    });
});
