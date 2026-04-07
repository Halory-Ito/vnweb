import { describe, expect, test, vi } from "vitest";

vi.mock("fs/promises", () => ({
    default: {
        readdir: vi.fn(async () => ["a.ttf", "b.otf", "c.txt"]),
    },
}));

import { listFonts } from "@/lib/path-utils";
import fs from "fs/promises";

describe("lib/path-utils", () => {
    test("returns filtered font files on windows", async () => {
        vi.spyOn(process, "platform", "get").mockReturnValue("win32");
        const list = await listFonts();
        expect(list).toEqual(["a.ttf", "b.otf"]);
    });

    test("returns undefined on non-windows", async () => {
        vi.spyOn(process, "platform", "get").mockReturnValue("linux");
        const list = await listFonts();
        expect(list).toBeUndefined();
    });

    test("returns empty list when readdir throws", async () => {
        vi.spyOn(process, "platform", "get").mockReturnValue("win32");
        vi.mocked(fs.readdir).mockRejectedValueOnce(new Error("io"));

        const list = await listFonts();
        expect(list).toEqual([]);
    });
});
