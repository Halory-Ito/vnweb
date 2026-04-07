import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const state = {
        rows: [] as unknown[],
        shouldThrow: false,
    };

    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn(async () => {
                        if (state.shouldThrow) {
                            throw new Error("db failed");
                        }
                        return state.rows;
                    }),
                })),
            })),
        })),
    }));

    return { state, db: { select } };
});

vi.mock("@/lib/drizzle", () => ({
    db: mocks.db,
}));

import { POST } from "@/app/api/settings/backup/export-xlsx/route";

describe("app/api/settings/backup/export-xlsx POST", () => {
    beforeEach(() => {
        mocks.state.rows = [];
        mocks.state.shouldThrow = false;
        mocks.db.select.mockClear();
    });

    test("returns xlsx file", async () => {
        // Step 1: 使用空记录也应能导出空模板。
        const response = await POST({} as NextRequest);

        // Step 2: 断言响应为 xlsx 下载。
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain(
            "spreadsheetml.sheet",
        );
        expect(response.headers.get("Content-Disposition")).toContain(
            "vnweb-timer-records-",
        );
    });

    test("returns 500 when db query fails", async () => {
        mocks.state.shouldThrow = true;

        const response = await POST({} as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("db failed");
    });
});
