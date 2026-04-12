import axios from "axios";
import SGDB from "steamgriddb";

const getPublicEnv = (key: string): string | undefined => {
  if (typeof import.meta !== "undefined") {
    const value = (
      import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    ).env?.[key];
    if (value) {
      return value;
    }
  }

  if (typeof globalThis !== "undefined") {
    const value = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key];
    if (value) {
      return value;
    }
  }

  return undefined;
};

// bgm client
export const BGMClient = axios.create({
  baseURL: getPublicEnv("NEXT_PUBLIC_BANGUMI_BASE_URL"),
  timeout: undefined,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
    "Access-Token": getPublicEnv("NEXT_PUBLIC_BANGUMI_API_KEY"),
  },
});

const sgdbApiKey = getPublicEnv("NEXT_PUBLIC_STEAMGRIDDB_API_KEY")?.trim();
const sgdbBaseUrl = getPublicEnv("NEXT_PUBLIC_STEAMGRIDDB_BASE_URL") ||
  "https://www.steamgriddb.com/api/v2";
const SGDB_MISSING_KEY_ERROR =
  "Missing NEXT_PUBLIC_STEAMGRIDDB_API_KEY. Please configure it in your .env or .env.local.";

let sgdbInstance: SGDB | null = null;

const getSGDBClient = (): SGDB => {
  if (!sgdbApiKey) {
    throw new Error(SGDB_MISSING_KEY_ERROR);
  }

  if (!sgdbInstance) {
    sgdbInstance = new SGDB({
      key: sgdbApiKey,
      baseURL: sgdbBaseUrl,
    });
  }

  return sgdbInstance;
};

type SGDBClientMethods = {
  searchGame: (
    ...args: Parameters<SGDB["searchGame"]>
  ) => ReturnType<SGDB["searchGame"]>;
  getGameById: (
    ...args: Parameters<SGDB["getGameById"]>
  ) => ReturnType<SGDB["getGameById"]>;
  getGridsById: (
    ...args: Parameters<SGDB["getGridsById"]>
  ) => ReturnType<SGDB["getGridsById"]>;
  getIconsById: (
    ...args: Parameters<SGDB["getIconsById"]>
  ) => ReturnType<SGDB["getIconsById"]>;
  getLogosById: (
    ...args: Parameters<SGDB["getLogosById"]>
  ) => ReturnType<SGDB["getLogosById"]>;
  getHeroesById: (
    ...args: Parameters<SGDB["getHeroesById"]>
  ) => ReturnType<SGDB["getHeroesById"]>;
};

// steamgriddb client
export const SGDBClient: SGDBClientMethods = {
  searchGame: (...args) => getSGDBClient().searchGame(...args),
  getGameById: (...args) => getSGDBClient().getGameById(...args),
  getGridsById: (...args) => getSGDBClient().getGridsById(...args),
  getIconsById: (...args) => getSGDBClient().getIconsById(...args),
  getLogosById: (...args) => getSGDBClient().getLogosById(...args),
  getHeroesById: (...args) => getSGDBClient().getHeroesById(...args),
};

// steam client
export const SteamClient = axios.create({
  baseURL: "https://api.steampowered.com",
  timeout: undefined,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
  },
});

// vndb client
export const VNDBClient = axios.create({
  baseURL: getPublicEnv("NEXT_PUBLIC_VNDB_BASE_URL") ||
    "https://api.vndb.org/kana",
  timeout: undefined,
  headers: {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0",
  },
});
