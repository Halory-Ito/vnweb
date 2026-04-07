import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fs: {
        mkdir: vi.fn(async () => undefined),
        writeFile: vi.fn(async () => undefined),
    },
}));

vi.mock("node:fs/promises", () => ({ default: mocks.fs }));

import {
    localizeGameImage,
    localizeGameImageFields,
    predictLocalGameImagePath,
} from "@/lib/server/game-image-storage";

describe("lib/server/game-image-storage", () => {
    beforeEach(() => {
        mocks.fs.mkdir.mockClear();
        mocks.fs.writeFile.mockClear();
    });

    test("predictLocalGameImagePath returns local path directly", () => {
        const result = predictLocalGameImagePath({
            gameName: "A",
            releaseDate: "2026-01-01",
            imageType: "cover",
            sourceUrl: "/assets/cover/a.jpg",
        });

        expect(result).toBe("/assets/cover/a.jpg");
    });

    test("localizeGameImage keeps non-http plain path", async () => {
        const result = await localizeGameImage({
            gameName: "A",
            releaseDate: "2026-01-01",
            imageType: "bg",
            sourceUrl: "relative/path.jpg",
        });

        expect(result).toBe("relative/path.jpg");
    });

    test("localizeGameImageFields localizes data-url image", async () => {
        // Step 1: 使用 data url 触发本地写入流程。
        const result = await localizeGameImageFields({
            gameName: "A B",
            releaseDate: "2026-01-01",
            cover: "data:image/png;base64,AA==",
        });

        // Step 2: 断言返回 public 路径并发生写入。
        expect(result.cover).toContain("/assets/cover/");
        expect(mocks.fs.mkdir).toHaveBeenCalled();
        expect(mocks.fs.writeFile).toHaveBeenCalled();
    });
});
