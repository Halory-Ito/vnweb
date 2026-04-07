import { describe, expect, test } from "vitest";

import { cn } from "@/lib/utils";

describe("lib/utils", () => {
    test("cn merges class names correctly", () => {
        const result = cn("px-2", "text-sm", false && "hidden", "px-4");
        expect(result).toContain("text-sm");
        expect(result).toContain("px-4");
        expect(result).not.toContain("px-2");
    });
});
