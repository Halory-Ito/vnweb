import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const select = vi.fn(() => ({
        from: vi.fn(() => ({
            where: vi.fn(() => ({
                limit: vi.fn(
                    async () => [{
                        id: 1,
                        name: "A",
                        nameCn: "",
                        date: "2025-01-01",
                    }]
                ),
            })),
        })),
    }));
    const localizeGameImageInBackground = vi.fn(() => "/assets/cover/a.jpg");
    return { db: { select }, localizeGameImageInBackground };
});

vi.mock("@/lib/drizzle", () => ({ db: mocks.db }));
vi.mock(
    "@/lib/server/game-image-storage",
    () => ({
        localizeGameImageInBackground: mocks.localizeGameImageInBackground,
    }),
);

import { POST } from "@/app/api/game/[id]/image-localize/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (
    payload: unknown,
): NextRequest => ({ json: async () => payload } as NextRequest);

describe("game/[id]/image-localize POST", () => {
    beforeEach(() => {
        mocks.db.select.mockClear();
        mocks.localizeGameImageInBackground.mockClear();
    });

    test("returns 400 for invalid image type", async () => {
        const res = await POST(
            req({ imageType: "x", sourceUrl: "a" }),
            ctx("1"),
        );
        expect(res.status).toBe(400);
    });

    test("returns 400 for invalid game id", async () => {
        const res = await POST(
            req({ imageType: "cover", sourceUrl: "a" }),
            ctx("0"),
        );
        expect(res.status).toBe(400);
    });

    test("returns 400 when source url is missing", async () => {
        const res = await POST(
            req({ imageType: "cover", sourceUrl: "" }),
            ctx("1"),
        );
        expect(res.status).toBe(400);
    });

    test("returns 404 when game not found", async () => {
        mocks.db.select.mockImplementationOnce(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({ limit: vi.fn(async () => []) })),
            })),
        }));

        const res = await POST(
            req({ imageType: "cover", sourceUrl: "a" }),
            ctx("1"),
        );
        expect(res.status).toBe(404);
    });

    test("localizes image successfully", async () => {
        // Step: 校验参数透传给本地化函数。
        const res = await POST(
            req({ imageType: "cover", sourceUrl: "https://img" }),
            ctx("1"),
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(mocks.localizeGameImageInBackground).toHaveBeenCalled();
        expect(body).toEqual({ data: { path: "/assets/cover/a.jpg" } });
    });
});
