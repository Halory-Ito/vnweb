import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@/lib/request-utils", () => ({ api: mocks.api }));

import {
    createScanner,
    deleteScannerById,
    getScanErrors,
    getScannerList,
    startScannerById,
    updateScannerById,
} from "@/lib/game/scan-utils";

describe("lib/scan-utils", () => {
    beforeEach(() => {
        mocks.api.get.mockReset();
        mocks.api.post.mockReset();
        mocks.api.patch.mockReset();
        mocks.api.delete.mockReset();
    });

    test("scanner apis map response payload", async () => {
        mocks.api.get
            .mockResolvedValueOnce({ data: { data: [{ id: 1 }] } })
            .mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
        mocks.api.post
            .mockResolvedValueOnce({ data: { data: { id: 3 } } })
            .mockResolvedValueOnce({ data: { data: { scannerId: 1 } } });
        mocks.api.patch.mockResolvedValueOnce({ data: { data: { id: 4 } } });
        mocks.api.delete.mockResolvedValueOnce({
            data: { data: { deleted: true, id: 1 } },
        });

        expect((await getScannerList())[0].id).toBe(1);
        expect(
            (await createScanner({
                directory: "d",
                provider: "p",
                scanMode: 0,
                scanLevel: 0,
            })).id,
        ).toBe(3);
        expect(
            (await updateScannerById(1, {
                directory: "d",
                provider: "p",
                scanMode: 0,
                scanLevel: 0,
            })).id,
        ).toBe(4);
        expect((await deleteScannerById(1)).data.deleted).toBe(true);
        expect((await startScannerById(1)).data.scannerId).toBe(1);
        expect((await getScanErrors())[0].id).toBe(2);
    });
});
