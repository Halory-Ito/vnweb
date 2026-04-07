import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
    Inter: vi.fn(() => ({ className: "inter" })),
    Lora: vi.fn(() => ({ className: "lora" })),
    Source_Sans_3: vi.fn(() => ({ className: "source" })),
}));

vi.mock("next/font/local", () => ({
    default: vi.fn(() => ({ className: "local" })),
}));

import {
    inter,
    lora,
    LXGWWenKai,
    sourceCodePro400,
    sourceCodePro700,
} from "@/lib/font-utils";

describe("lib/font-utils", () => {
    test("exports initialized font objects", () => {
        expect(inter).toBeTruthy();
        expect(lora).toBeTruthy();
        expect(sourceCodePro400).toBeTruthy();
        expect(sourceCodePro700).toBeTruthy();
        expect(LXGWWenKai).toBeTruthy();
    });
});
