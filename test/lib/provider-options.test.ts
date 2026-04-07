import { describe, expect, test } from "vitest";

import {
    DEFAULT_GAME_PROVIDER,
    GAME_PROVIDER_OPTIONS,
} from "@/lib/provider-options";

describe("lib/provider-options", () => {
    test("exports provider options and default value", () => {
        expect(GAME_PROVIDER_OPTIONS.length).toBeGreaterThan(0);
        expect(
            GAME_PROVIDER_OPTIONS.some((i) =>
                i.value === DEFAULT_GAME_PROVIDER
            ),
        ).toBe(true);
    });
});
