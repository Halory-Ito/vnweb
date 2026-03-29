export type FontSettings = {
  fontPath: string;
  fontSize: number;
  fontWeight: number;
};

export const FONT_SETTINGS_STORAGE_KEY = "vnweb:font-settings";
export const FONT_SETTINGS_EVENT = "vnweb:font-settings-changed";

const APP_FONT_FAMILY_NAME = "VNWebCustomFont";

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontPath: "/fonts/SourceHanSerifCN-Regular.otf",
  fontSize: 16,
  fontWeight: 400,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

let loadedFontPath = "";

export function normalizeFontSettings(
  input: Partial<FontSettings> | FontSettings,
): FontSettings {
  const fontSize = Number(input.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize);
  const fontWeight = Number(
    input.fontWeight ?? DEFAULT_FONT_SETTINGS.fontWeight,
  );

  return {
    fontPath: typeof input.fontPath === "string"
      ? input.fontPath.trim()
      : DEFAULT_FONT_SETTINGS.fontPath,
    fontSize: clamp(
      Number.isFinite(fontSize) ? Math.round(fontSize) : 16,
      10,
      40,
    ),
    fontWeight: clamp(
      Number.isFinite(fontWeight) ? Math.round(fontWeight / 100) * 100 : 400,
      100,
      900,
    ),
  };
}

export function readFontSettings(): FontSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FONT_SETTINGS;
  }

  const raw = window.localStorage.getItem(FONT_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_FONT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FontSettings>;
    return normalizeFontSettings(parsed);
  } catch {
    return DEFAULT_FONT_SETTINGS;
  }
}

export function writeFontSettings(settings: FontSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    FONT_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeFontSettings(settings)),
  );
}

export function notifyFontSettingsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(FONT_SETTINGS_EVENT));
}

async function ensureFontFaceLoaded(fontPath: string) {
  if (typeof document === "undefined" || !fontPath) {
    return;
  }

  if (loadedFontPath === fontPath) {
    return;
  }

  const safePath = fontPath.replace(/"/g, "");
  const fontFace = new FontFace(APP_FONT_FAMILY_NAME, `url("${safePath}")`);
  const loaded = await fontFace.load();

  // Remove previous runtime faces with the same family name to avoid stale cache.
  for (const face of Array.from(document.fonts)) {
    if (face.family.replace(/['"]/g, "") === APP_FONT_FAMILY_NAME) {
      document.fonts.delete(face);
    }
  }

  document.fonts.add(loaded);
  loadedFontPath = fontPath;
}

export async function applyFontSettingsToDocument(settings: FontSettings) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = normalizeFontSettings(settings);
  const root = document.documentElement;

  root.style.setProperty("--app-font-size", `${normalized.fontSize}px`);
  root.style.setProperty("--app-font-weight", String(normalized.fontWeight));

  try {
    await ensureFontFaceLoaded(normalized.fontPath);
    root.style.setProperty(
      "--app-font-family",
      `'${APP_FONT_FAMILY_NAME}', 'Microsoft YaHei', sans-serif`,
    );
  } catch {
    root.style.setProperty(
      "--app-font-family",
      `'Microsoft YaHei', sans-serif`,
    );
  }
}
