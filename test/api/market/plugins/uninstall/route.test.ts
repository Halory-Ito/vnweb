import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const readFile = vi.fn();
    const writeFile = vi.fn();
    return { readFile, writeFile };
});

vi.mock("fs/promises", () => ({
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
}));

import { POST } from "@/app/api/market/plugins/uninstall/route";

const req = (
    payload: unknown,
): Request => ({ json: async () => payload } as Request);

describe("app/api/market/plugins/uninstall POST", () => {
    beforeEach(() => {
        mocks.readFile.mockReset();
        mocks.writeFile.mockReset();
    });

    test("returns 400 for invalid id", async () => {
        const response = await POST(req({ id: " bad/id " }));
        expect(response.status).toBe(400);
    });

    test("updates manifest installed=false", async () => {
        mocks.readFile.mockResolvedValueOnce(
            'export default {\n  id: "a",\n  installed: true,\n};\n',
        );

        const response = await POST(req({ id: "plugin-a" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            id: "plugin-a",
            installed: false,
        });
        expect(mocks.writeFile).toHaveBeenCalledTimes(1);
    });

    test("returns 500 when read fails", async () => {
        mocks.readFile.mockRejectedValueOnce(new Error("io"));

        const response = await POST(req({ id: "plugin-a" }));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain("Failed to uninstall plugin");
    });
});
