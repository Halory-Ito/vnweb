export type BackgroundTransitionStyle =
  | "none"
  | "center-fade"
  | "cross-fade"
  | "slide-up"
  | "zoom-fade";

export type BackgroundSettings = {
  customBackgroundEnabled: boolean;
  customBackgroundImage: string;
  lastGameBackgroundImage: string;
  transitionStyle: BackgroundTransitionStyle;
  transitionDurationMs: number;
};

export const BACKGROUND_SETTINGS_STORAGE_KEY = "vnweb:background-settings";
export const BACKGROUND_SETTINGS_EVENT = "vnweb:background-settings-changed";

export const DEFAULT_LAST_GAME_BACKGROUND_IMAGE = "/bg.png";
export const DEFAULT_BACKGROUND_TRANSITION_STYLE: BackgroundTransitionStyle =
  "center-fade";
export const DEFAULT_BACKGROUND_TRANSITION_DURATION_MS = 420;

export const BACKGROUND_TRANSITION_STYLE_OPTIONS: Array<{
  value: BackgroundTransitionStyle;
  label: string;
}> = [
  { value: "center-fade", label: "中心渐入渐出" },
  { value: "cross-fade", label: "淡入淡出" },
  { value: "slide-up", label: "上移淡入" },
  { value: "zoom-fade", label: "缩放淡入" },
  { value: "none", label: "无动画" },
];

const TRANSITION_STYLE_SET = new Set<BackgroundTransitionStyle>(
  BACKGROUND_TRANSITION_STYLE_OPTIONS.map((item) => item.value),
);

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  customBackgroundEnabled: false,
  customBackgroundImage: "",
  lastGameBackgroundImage: DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
  transitionStyle: DEFAULT_BACKGROUND_TRANSITION_STYLE,
  transitionDurationMs: DEFAULT_BACKGROUND_TRANSITION_DURATION_MS,
};

export function normalizeBackgroundSettings(
  input: Partial<BackgroundSettings> | BackgroundSettings,
): BackgroundSettings {
  const transitionDurationCandidate = Number(input.transitionDurationMs);

  return {
    customBackgroundEnabled: Boolean(input.customBackgroundEnabled),
    customBackgroundImage: typeof input.customBackgroundImage === "string"
      ? input.customBackgroundImage.trim()
      : "",
    lastGameBackgroundImage:
      typeof input.lastGameBackgroundImage === "string" &&
        input.lastGameBackgroundImage.trim().length > 0
        ? input.lastGameBackgroundImage.trim()
        : DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
    transitionStyle: typeof input.transitionStyle === "string" &&
        TRANSITION_STYLE_SET.has(
          input.transitionStyle as BackgroundTransitionStyle,
        )
      ? (input.transitionStyle as BackgroundTransitionStyle)
      : DEFAULT_BACKGROUND_TRANSITION_STYLE,
    transitionDurationMs: Number.isFinite(transitionDurationCandidate) &&
        transitionDurationCandidate >= 0
      ? Math.min(3000, Math.max(0, Math.round(transitionDurationCandidate)))
      : DEFAULT_BACKGROUND_TRANSITION_DURATION_MS,
  };
}

export function readBackgroundSettings(): BackgroundSettings {
  if (typeof window === "undefined") {
    return DEFAULT_BACKGROUND_SETTINGS;
  }

  const raw = window.localStorage.getItem(BACKGROUND_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_BACKGROUND_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BackgroundSettings>;
    return normalizeBackgroundSettings(parsed);
  } catch {
    return DEFAULT_BACKGROUND_SETTINGS;
  }
}

export function writeBackgroundSettings(settings: BackgroundSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    BACKGROUND_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeBackgroundSettings(settings)),
  );
}

export function notifyBackgroundSettingsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(BACKGROUND_SETTINGS_EVENT));
}

export function updateLastGameBackground(image: string) {
  const normalizedImage = image.trim();
  if (!normalizedImage) {
    return;
  }

  const current = readBackgroundSettings();
  const next = normalizeBackgroundSettings({
    ...current,
    lastGameBackgroundImage: normalizedImage,
  });
  writeBackgroundSettings(next);
  notifyBackgroundSettingsChanged();
}
