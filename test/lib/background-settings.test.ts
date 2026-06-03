import { describe, expect, test, vi } from "vitest";

import {
    DEFAULT_BACKGROUND_SETTINGS,
    normalizeBackgroundSettings,
    readBackgroundSettings,
    updateLastGameBackground,
    writeBackgroundSettings,
} from "@/lib/settings/background-settings";

describe("lib/background-settings", () => {
    test("normalize clamps and falls back", () => {
        const result = normalizeBackgroundSettings({
            customBackgroundEnabled: 1 as unknown as boolean,
            customBackgroundImage: "  /a.jpg ",
            transitionStyle: "bad" as any,
            transitionDurationMs: 99999,
            lastGameBackgroundImage: " ",
        });

        expect(result.customBackgroundEnabled).toBe(true);
        expect(result.customBackgroundImage).toBe("/a.jpg");
        expect(result.transitionStyle).toBe(
            DEFAULT_BACKGROUND_SETTINGS.transitionStyle,
        );
        expect(result.transitionDurationMs).toBe(3000);
        expect(result.lastGameBackgroundImage).toBe("/bg.png");
    });

    test("updateLastGameBackground writes when image is valid", () => {
        const setItem = vi.fn();
        const dispatchEvent = vi.fn();
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(() => null), setItem },
            dispatchEvent,
        };

        updateLastGameBackground("/assets/bg/a.jpg");

        expect(setItem).toHaveBeenCalledTimes(1);
        expect(dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test("read returns default on invalid json", () => {
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(() => "{"), setItem: vi.fn() },
            dispatchEvent: vi.fn(),
        };

        const result = readBackgroundSettings();
        expect(result).toEqual(DEFAULT_BACKGROUND_SETTINGS);
    });

    test("write persists normalized settings", () => {
        const setItem = vi.fn();
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(() => null), setItem },
            dispatchEvent: vi.fn(),
        };

        writeBackgroundSettings({
            ...DEFAULT_BACKGROUND_SETTINGS,
            transitionDurationMs: 9999,
        });

        expect(setItem).toHaveBeenCalledTimes(1);
    });

    test("updateLastGameBackground ignores blank input", () => {
        const setItem = vi.fn();
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(() => null), setItem },
            dispatchEvent: vi.fn(),
        };

        updateLastGameBackground("   ");
        expect(setItem).not.toHaveBeenCalled();
    });
});
