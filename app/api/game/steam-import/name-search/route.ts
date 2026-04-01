import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { fetchSteamAppDetails, toSteamStoreUrl } from "../_shared";
import { getEnabledProxySettings } from "@/lib/proxy-settings";

type SteamStoreSearchItem = {
  id?: number;
  name?: string;
};

type SteamStoreSearchResponse = {
  total?: number;
  items?: SteamStoreSearchItem[];
};

const normalizeKeyword = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const searchSteamGamesByName = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      keyword?: string;
      offset?: number;
      limit?: number;
    };

    const keyword = normalizeKeyword(body.keyword);
    const offset = normalizePositiveInt(body.offset, 0);
    const limit = Math.max(
      1,
      Math.min(50, normalizePositiveInt(body.limit, 10)),
    );

    if (!keyword) {
      return NextResponse.json({
        data: {
          total: 0,
          items: [],
        },
      });
    }

    // 获取启用的代理配置
    const proxySettings = await getEnabledProxySettings();

    let response;
    if (proxySettings && proxySettings.enabled) {
      const { HttpsProxyAgent } = await import("https-proxy-agent");
      const auth = proxySettings.username && proxySettings.password
        ? `${encodeURIComponent(proxySettings.username)}:${
          encodeURIComponent(proxySettings.password)
        }@`
        : "";
      const proxyUrl =
        `${proxySettings.type}://${auth}${proxySettings.host}:${proxySettings.port}`;
      const httpsAgent = new HttpsProxyAgent(proxyUrl);

      response = await axios.get<SteamStoreSearchResponse>(
        "https://store.steampowered.com/api/storesearch/",
        {
          timeout: 10_000,
          params: {
            term: keyword,
            l: "schinese",
            cc: "CN",
          },
          httpsAgent,
        },
      );
    } else {
      response = await axios.get<SteamStoreSearchResponse>(
        "https://store.steampowered.com/api/storesearch/",
        {
          timeout: 10_000,
          params: {
            term: keyword,
            l: "schinese",
            cc: "CN",
          },
        },
      );
    }

    const items = (response.data.items ?? [])
      .map((item) => {
        const appid = Number(item.id);
        if (!Number.isInteger(appid) || appid <= 0) {
          return null;
        }

        return {
          id: String(appid),
          name: (item.name || "").trim() || `Steam App ${appid}`,
          developer: "Steam",
          date: "",
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          name: string;
          developer: string;
          date: string;
        } => item !== null,
      );

    return NextResponse.json({
      data: {
        total: response.data.total ?? items.length,
        items: items.slice(offset, offset + limit),
      },
    });
  } catch (error) {
    console.error("Search steam games by name failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Steam 名称搜索失败" },
      { status: 500 },
    );
  }
};

const getSteamGameById = async (req: NextRequest) => {
  try {
    const appId = Number(req.nextUrl.searchParams.get("id") || "");
    if (!Number.isInteger(appId) || appId <= 0) {
      return NextResponse.json({ error: "无效的 appid" }, { status: 400 });
    }

    // 获取启用的代理配置
    const proxySettings = await getEnabledProxySettings();
    const details = await fetchSteamAppDetails(
      appId,
      proxySettings ?? undefined,
    );
    if (!details) {
      return NextResponse.json(
        { error: "未找到 Steam 游戏详情" },
        { status: 404 },
      );
    }

    const platforms: string[] = [];
    if (details.platforms?.windows) {
      platforms.push("Windows");
    }
    if (details.platforms?.mac) {
      platforms.push("macOS");
    }
    if (details.platforms?.linux) {
      platforms.push("Linux");
    }

    return NextResponse.json({
      data: {
        date: details.release_date?.date?.trim() || "",
        cover: details.header_image?.trim() || "",
        summary: details.short_description?.trim() || "",
        name: details.name?.trim() || `Steam App ${appId}`,
        nameCn: details.name?.trim() || `Steam App ${appId}`,
        tags: [],
        nsfw: false,
        ailases: [],
        platforms,
        gameType: "Steam",
        gameEngine: "",
        websites: [{ Steam: toSteamStoreUrl(appId) }],
        links: [],
        music: "",
        script: "",
        graphic: "",
        originalPainter: "",
        animationProduction: "",
        developer: (details.developers ?? []).join(", "),
        publisher: (details.publishers ?? []).join(", "),
        programmer: "",
      },
    });
  } catch (error) {
    console.error("Get steam game by id failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Steam 游戏详情获取失败" },
      { status: 500 },
    );
  }
};

export { getSteamGameById as GET, searchSteamGamesByName as POST };
