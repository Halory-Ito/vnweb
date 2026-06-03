import { describe, expect, test, vi } from "vitest";

import {
    applyFontSettingsToDocument,
    normalizeFontSettings,
    notifyFontSettingsChanged,
    readFontSettings,
    writeFontSettings,
} from "@/lib/settings/font-settings";

describe("lib/font-settings", () => {
    test("normalize clamps and rounds size/weight", () => {
        const result = normalizeFontSettings({
            fontPath: "  /fonts/a.ttf ",
            fontSize: 99,
            fontWeight: 450,
        });

        expect(result.fontPath).toBe("/fonts/a.ttf");
        expect(result.fontSize).toBe(40);
        expect(result.fontWeight).toBe(500);
    });

    test("read/write works with localStorage", () => {
        const store: Record<string, string> = {};
        (globalThis as any).window = {
            localStorage: {
                getItem: vi.fn((k: string) => store[k] ?? null),
                setItem: vi.fn((k: string, v: string) => {
                    store[k] = v;
                }),
            },
            dispatchEvent: vi.fn(),
        };

        writeFontSettings({
            fontPath: "/fonts/x.ttf",
            fontSize: 16,
            fontWeight: 400,
        });
        const got = readFontSettings();

        expect(got.fontPath).toBe("/fonts/x.ttf");
    });

    test("read falls back to default when json is invalid", () => {
        (globalThis as any).window = {
            localStorage: {
                getItem: vi.fn(() => "{"),
                setItem: vi.fn(),
            },
            dispatchEvent: vi.fn(),
        };

        const got = readFontSettings();
        expect(got.fontPath).toBe("/fonts/SourceHanSerifCN-Regular.otf");
    });

    test("notify dispatches event", () => {
        const dispatchEvent = vi.fn();
        (globalThis as any).window = {
            localStorage: { getItem: vi.fn(), setItem: vi.fn() },
            dispatchEvent,
        };

        notifyFontSettingsChanged();
        expect(dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test("applyFontSettingsToDocument sets css vars", async () => {
        const style = { setProperty: vi.fn() };
        (globalThis as any).document = {
            documentElement: { style },
            fonts: new Set(),
        };
        (globalThis as any).FontFace = vi.fn().mockImplementation(() => ({
            family: "VNWebCustomFont",
            load: async () => ({ family: "VNWebCustomFont" }),
        }));

        await applyFontSettingsToDocument({
            fontPath: "/fonts/test.ttf",
            fontSize: 18,
            fontWeight: 500,
        });

        expect(style.setProperty).toHaveBeenCalled();
    });

    test("applyFontSettingsToDocument falls back when font load fails", async () => {
        const style = { setProperty: vi.fn() };
        (globalThis as any).document = {
            documentElement: { style },
            fonts: new Set(),
        };
        (globalThis as any).FontFace = vi.fn().mockImplementation(() => ({
            family: "VNWebCustomFont",
            load: async () => {
                throw new Error("load failed");
            },
        }));

        await applyFontSettingsToDocument({
            fontPath: "/fonts/fail.ttf",
            fontSize: 16,
            fontWeight: 400,
        });

        expect(style.setProperty).toHaveBeenCalledWith(
            "--app-font-family",
            "'Microsoft YaHei', sans-serif",
        );
    });
});
