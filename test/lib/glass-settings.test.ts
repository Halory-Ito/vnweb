import { describe, expect, test, vi } from "vitest";

import {
    applyGlassSettingsToDocument,
    normalizeGlassSettings,
    notifyGlassSettingsChanged,
    readGlassSettings,
    writeGlassSettings,
} from "@/lib/glass-settings";

describe("lib/glass-settings", () => {
    test("normalize clamps blur and opacity", () => {
        const result = normalizeGlassSettings({ blur: 999, opacity: -2 });
        expect(result.blur).toBe(150);
        expect(result.opacity).toBe(0);
    });

    test("write stores normalized payload", () => {
        const setItem = vi.fn();
        (globalThis as any).window = {
            localStorage: { setItem },
            dispatchEvent: vi.fn(),
        };

        writeGlassSettings({ blur: 12, opacity: 34 });
        expect(setItem).toHaveBeenCalledTimes(1);
    });

    test("read falls back to default on invalid json", () => {
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(() => "{"), setItem: vi.fn() },
            dispatchEvent: vi.fn(),
        };

        const result = readGlassSettings();
        expect(result.blur).toBe(24);
        expect(result.opacity).toBe(24);
    });

    test("apply writes css vars", () => {
        const style = { setProperty: vi.fn() };
        (globalThis as any).document = { documentElement: { style } };

        applyGlassSettingsToDocument({ blur: 20, opacity: 50 });
        expect(style.setProperty).toHaveBeenCalledWith(
            "--app-glass-opacity",
            "0.5",
        );
    });

    test("notify dispatches event", () => {
        const dispatchEvent = vi.fn();
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(), setItem: vi.fn() },
            dispatchEvent,
        };

        notifyGlassSettingsChanged();
        expect(dispatchEvent).toHaveBeenCalledTimes(1);
    });
});
