import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fs: { readdir: vi.fn() },
}));

vi.mock("node:fs/promises", () => ({ default: mocks.fs }));

import { GET } from "@/app/api/settings/font/local-list/route";

const file = (name: string) => ({ name, isFile: () => true });
const dir = (name: string) => ({ name, isFile: () => false });

describe("settings/font/local-list GET", () => {
    beforeEach(() => {
        mocks.fs.readdir.mockReset();
    });

    test("returns sorted windows font list", async () => {
        // Step 1: 第一目录含字体和非字体文件，第二目录抛错。
        mocks.fs.readdir
            .mockResolvedValueOnce([
                file("b.otf"),
                dir("folder"),
                file("a.ttf"),
                file("x.txt"),
            ])
            .mockRejectedValueOnce(new Error("denied"));

        // Step 2: 调用 GET 并断言排序与过滤。
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.map((i: any) => i.name)).toEqual(["a", "b"]);
    });
});
