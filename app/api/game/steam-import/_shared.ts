import axios from "axios";
import { like } from "drizzle-orm";

import { relateWebsiteTable } from "@/db/schema";
import { db } from "@/lib/drizzle";
import type { ProxySettings } from "@/lib/proxy-settings";

export const STEAM_OWNED_GAMES_API =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
export const STEAM_APP_DETAILS_API =
  "https://store.steampowered.com/api/appdetails";
export const STEAM_REQUEST_TIMEOUT_MS = 10_000;
const STEAM_STORE_PREFIX = "https://store.steampowered.com/app/";
const STEAM_OWNED_GAMES_MAX_RETRIES = 3;
const OWNED_GAMES_CACHE_TTL_MS = 10 * 60 * 1000;
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

/**
 * 将客户端 ProxySettings 转换为 axios 的 proxy 配置
 */
function buildAxiosProxyConfig(
  settings: ProxySettings,
): false | AxiosProxyConfig {
  if (!settings.enabled || !settings.host || !settings.port) {
    return false;
  }

  // axios 的 proxy 配置只支持 HTTP/HTTPS，不支持 SOCKS5
  // 对于 SOCKS5，我们需要使用 agent
  if (settings.type === "socks5") {
    return false;
  }

  return {
    host: settings.host,
    port: settings.port,
    auth: settings.username && settings.password
      ? {
        username: settings.username,
        password: settings.password,
      }
      : undefined,
    protocol: settings.type,
  };
}

type AxiosProxyConfig = {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: string;
};

export type SteamOwnedGame = {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  img_icon_url?: string;
  img_logo_url?: string;
};

type SteamOwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
};

const ownedGamesCache = new Map<
  string,
  { expiresAt: number; games: SteamOwnedGame[] }
>();

export type SteamAppDetail = {
  name?: string;
  short_description?: string;
  header_image?: string;
  release_date?: {
    date?: string;
  };
  developers?: string[];
  publishers?: string[];
  website?: string;
  movies?: Array<{
    id?: number;
    name?: string;
    thumbnail?: string;
    dash_h264?: string;
    hls_h264?: string;
    mp4?: {
      max?: string;
      480?: string;
    };
    webm?: {
      max?: string;
      480?: string;
    };
    highlight?: boolean;
  }>;
  platforms?: {
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
  };
};

type SteamAppDetailResponse = {
  success?: boolean;
  data?: SteamAppDetail;
};

export const getSteamApiKey = () => {
  return (
    process.env.STEAM_API_KEY ||
    process.env.NEXT_PUBLIC_STEAM_API_KEY ||
    process.env.STEAM_WEB_API_KEY ||
    ""
  );
};

export const normalizeSteamId = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const isValidSteamUid = (value: string) => {
  return /^\d{17}$/.test(value);
};

export const toSteamStoreUrl = (appId: number) =>
  `${STEAM_STORE_PREFIX}${appId}`;

export const toSteamCoverUrl = (appId: number) =>
  `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

export const toSteamIconUrl = (appId: number, iconHash?: string) => {
  const hash = (iconHash || "").trim();
  if (!hash) {
    return "";
  }

  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg`;
};

export const toSteamLogoUrl = (appId: number, logoHash?: string) => {
  const hash = (logoHash || "").trim();
  if (!hash) {
    return "";
  }

  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg`;
};

export const fetchOwnedGames = async (
  steamId: string,
  apiKey: string,
  proxySettings?: ProxySettings,
) => {
  // 不使用缓存，因为代理可能变化
  let lastError: unknown = null;
  const proxyConfig = proxySettings
    ? buildAxiosProxyConfig(proxySettings)
    : false;

  for (
    let attempt = 1;
    attempt <= STEAM_OWNED_GAMES_MAX_RETRIES;
    attempt += 1
  ) {
    try {
      const response = await axios.get<SteamOwnedGamesResponse>(
        STEAM_OWNED_GAMES_API,
        {
          timeout: STEAM_REQUEST_TIMEOUT_MS,
          params: {
            key: apiKey,
            steamid: steamId,
            include_appinfo: 1,
            include_played_free_games: 1,
            format: "json",
          },
          proxy: proxyConfig,
        },
      );

      const games = response.data.response?.games ?? [];
      ownedGamesCache.set(steamId, {
        expiresAt: Date.now() + OWNED_GAMES_CACHE_TTL_MS,
        games,
      });
      return games;
    } catch (error) {
      lastError = error;

      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const code = error.code || "";
      const canRetry = RETRYABLE_NETWORK_CODES.has(code) &&
        attempt < STEAM_OWNED_GAMES_MAX_RETRIES;

      if (canRetry) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }

      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
        throw new Error("连接 Steam 超时，请稍后重试");
      }

      throw new Error(error.message || "获取 Steam 游戏库失败");
    }
  }

  if (axios.isAxiosError(lastError)) {
    const code = lastError.code || "";
    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      throw new Error("连接 Steam 超时，请稍后重试");
    }
    throw new Error(lastError.message || "获取 Steam 游戏库失败");
  }

  throw new Error("获取 Steam 游戏库失败");
};

export const fetchSteamAppDetails = async (appId: number) => {
  try {
    const response = await axios.get<Record<string, SteamAppDetailResponse>>(
      STEAM_APP_DETAILS_API,
      {
        timeout: STEAM_REQUEST_TIMEOUT_MS,
        params: {
          appids: appId,
          l: "schinese",
        },
      },
    );

    const detail = response.data[String(appId)];
    if (!detail?.success || !detail.data) {
      return null;
    }

    return detail.data;
  } catch (error) {
    console.warn("Fetch Steam app details failed:", appId, error);
    return null;
  }
};

export const getCachedOwnedGame = (steamId: string, appId: number) => {
  const cached = ownedGamesCache.get(steamId);
  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }

  return cached.games.find((item) => Number(item.appid) === appId) ?? null;
};

export const getImportedSteamAppIdSet = async () => {
  const appIdSet = new Set<number>();

  const rows = await db
    .select({ url: relateWebsiteTable.url })
    .from(relateWebsiteTable)
    .where(like(relateWebsiteTable.url, `${STEAM_STORE_PREFIX}%`));

  for (const row of rows) {
    const matched = row.url.match(/\/app\/(\d+)/);
    if (!matched) {
      continue;
    }
    const appId = Number(matched[1]);
    if (Number.isInteger(appId) && appId > 0) {
      appIdSet.add(appId);
    }
  }

  return appIdSet;
};
