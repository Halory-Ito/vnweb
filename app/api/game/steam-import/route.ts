import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import {
  fetchOwnedGames,
  fetchSteamAppDetails,
  getCachedOwnedGame,
  getSteamApiKey,
  isValidSteamUid,
  normalizeSteamId,
  toSteamCoverUrl,
  toSteamIconUrl,
  toSteamLogoUrl,
  toSteamStoreUrl,
} from "./_shared";
import {
  GameIdMapTable,
  GameInfoTable,
  GamePlayTable,
  GamePvTable,
  relateWebsiteTable,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getEnabledProxySettings } from "@/lib/proxy-settings";

export const maxDuration = 300;

const importSteamGames = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      steamId?: string;
      appid?: number | string;
      name?: string;
      playtimeMinutes?: number;
      coverUrl?: string;
      iconUrl?: string;
      logoUrl?: string;
    };
    const steamId = normalizeSteamId(body.steamId);
    const appId = Number(body.appid);
    const appName = typeof body.name === "string" ? body.name.trim() : "";
    const playtimeMinutes = Math.max(0, Number(body.playtimeMinutes ?? 0));
    const coverUrlFromClient = typeof body.coverUrl === "string"
      ? body.coverUrl.trim()
      : "";
    const iconUrlFromClient = typeof body.iconUrl === "string"
      ? body.iconUrl.trim()
      : "";
    const logoUrlFromClient = typeof body.logoUrl === "string"
      ? body.logoUrl.trim()
      : "";

    if (!isValidSteamUid(steamId)) {
      return NextResponse.json(
        { error: "请输入有效的 Steam UID（17 位数字）" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(appId) || appId <= 0) {
      return NextResponse.json({ error: "无效的 appid" }, { status: 400 });
    }

    const steamApiKey = getSteamApiKey();
    if (!steamApiKey) {
      return NextResponse.json(
        { error: "未配置 STEAM_API_KEY，无法导入" },
        { status: 500 },
      );
    }

    // 获取启用的代理配置
    const proxySettings = await getEnabledProxySettings();

    let iconUrl = iconUrlFromClient;
    let logoUrl = logoUrlFromClient;
    if (!iconUrl || !logoUrl) {
      let ownedGame = getCachedOwnedGame(steamId, appId);
      if (!ownedGame) {
        const ownedGames = await fetchOwnedGames(
          steamId,
          steamApiKey,
          proxySettings ?? undefined,
        );
        ownedGame = ownedGames.find((item) => Number(item.appid) === appId) ||
          null;
      }

      if (!iconUrl) {
        iconUrl = toSteamIconUrl(appId, ownedGame?.img_icon_url);
      }
      if (!logoUrl) {
        logoUrl = toSteamLogoUrl(appId, ownedGame?.img_logo_url);
      }
    }

    const steamUrl = toSteamStoreUrl(appId);
    const existedWebsite = await db
      .select({ id: relateWebsiteTable.id })
      .from(relateWebsiteTable)
      .where(eq(relateWebsiteTable.url, steamUrl))
      .limit(1);

    if (existedWebsite[0]) {
      return NextResponse.json({
        data: {
          appid: appId,
          status: "skipped",
          reason: "游戏已存在，已跳过",
        },
      });
    }

    const details = await fetchSteamAppDetails(
      appId,
      proxySettings ?? undefined,
    );
    const now = dayjs().toISOString();
    const name = details?.name?.trim() || appName || `Steam App ${appId}`;
    const playtimeSeconds = Math.floor(playtimeMinutes * 60);

    const platforms: string[] = [];
    if (details?.platforms?.windows) {
      platforms.push("Windows");
    }
    if (details?.platforms?.mac) {
      platforms.push("macOS");
    }
    if (details?.platforms?.linux) {
      platforms.push("Linux");
    }

    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(GameInfoTable)
        .values({
          date: details?.release_date?.date?.trim() || "",
          cover: details?.header_image?.trim() ||
            coverUrlFromClient ||
            toSteamCoverUrl(appId),
          icon: iconUrl,
          logo: logoUrl,
          bg: "",
          summary: details?.short_description?.trim() || "",
          name,
          nameCn: name,
          tags: "",
          nsfw: 0,
          ailases: "",
          platforms: platforms.join(","),
          gameType: "Steam",
          gameEngine: "",
          music: "",
          script: "",
          graphic: "",
          originalPainter: "",
          animationProduction: "",
          developer: (details?.developers ?? []).join(", "),
          publisher: (details?.publishers ?? []).join(", "),
          programmer: "",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: GameInfoTable.id });

      const gameId = inserted[0]?.id;
      if (!gameId) {
        throw new Error("写入 game_info 失败");
      }

      await tx
        .insert(GameIdMapTable)
        .values({
          gameId,
          provider: "steam",
          externalId: String(appId),
        })
        .onConflictDoNothing({
          target: [
            GameIdMapTable.gameId,
            GameIdMapTable.provider,
            GameIdMapTable.externalId,
          ],
        });

      const websites: Array<{ gameId: number; name: string; url: string }> = [
        {
          gameId,
          name: "Steam",
          url: steamUrl,
        },
        {
          gameId,
          name: "Steam Community",
          url: `https://steamcommunity.com/app/${appId}`,
        },
      ];

      if (details?.website?.trim()) {
        websites.push({
          gameId,
          name: "Official Website",
          url: details.website.trim(),
        });
      }

      await tx.insert(relateWebsiteTable).values(websites);

      const pvRows = (details?.movies ?? [])
        .map((movie, index) => {
          const url = movie.hls_h264?.trim() ||
            movie.dash_h264?.trim() ||
            movie.mp4?.max?.trim() ||
            movie.mp4?.["480"]?.trim() ||
            movie.webm?.max?.trim() ||
            movie.webm?.["480"]?.trim() ||
            "";

          if (!url) {
            return null;
          }

          const rawName = (movie.name || "").trim();
          const name = rawName || `PV ${index + 1}`;

          return {
            gameId,
            name,
            url,
            createdAt: now,
            updatedAt: now,
          };
        })
        .filter(
          (
            item,
          ): item is {
            gameId: number;
            name: string;
            url: string;
            createdAt: string;
            updatedAt: string;
          } => item !== null,
        );

      if (pvRows.length > 0) {
        await tx.insert(GamePvTable).values(pvRows);
      }

      console.info("Steam PV import summary:", {
        appId,
        gameId,
        moviesCount: details?.movies?.length || 0,
        insertedPvCount: pvRows.length,
      });

      await tx.insert(GamePlayTable).values({
        gameId,
        totalPlayTime: playtimeSeconds,
      });
    });

    return NextResponse.json({
      data: {
        appid: appId,
        status: "imported",
        playtimeSeconds,
      },
    });
  } catch (error) {
    console.error("Steam import failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Steam 导入失败" },
      { status: 500 },
    );
  }
};

export { importSteamGames as POST };
