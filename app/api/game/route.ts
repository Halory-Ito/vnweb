import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";

import { fetchSteamAppDetails } from "./steam-import/_shared";
import {
  GameIdMapTable,
  GameInfoTable,
  GamePvTable,
  relateWebsiteTable,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getEnabledProxySettings } from "@/lib/proxy-settings";
import { syncVndbCharactersByGameId } from "@/lib/server/vndb-character-sync";
import { GameInfo } from "@/types/game-types";

const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const normalizeRecordList = (value: unknown): Record<string, string>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const entries = Object.entries(item as Record<string, unknown>);
      if (entries.length === 0) {
        return null;
      }

      const [key, rawVal] = entries[0];
      const name = normalizeText(key);
      const url = normalizeText(rawVal);

      if (!name || !url) {
        return null;
      }

      return { [name]: url };
    })
    .filter((item): item is Record<string, string> => item !== null);
};

const parseGameInfoPayload = (payload: unknown): GameInfo | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;

  return {
    date: normalizeText(source.date),
    cover: normalizeText(source.cover),
    summary: normalizeText(source.summary),
    name: normalizeText(source.name),
    nameCn: normalizeText(source.nameCn),
    tags: normalizeStringList(source.tags),
    nsfw: Boolean(source.nsfw),
    ailases: normalizeStringList(source.ailases),
    platforms: normalizeStringList(source.platforms),
    gameType: normalizeText(source.gameType),
    gameEngine: normalizeText(source.gameEngine),
    websites: normalizeRecordList(source.websites),
    links: normalizeRecordList(source.links),
    music: normalizeText(source.music),
    script: normalizeText(source.script),
    graphic: normalizeText(source.graphic),
    originalPainter: normalizeText(source.originalPainter),
    animationProduction: normalizeText(source.animationProduction),
    developer: normalizeText(source.developer),
    publisher: normalizeText(source.publisher),
    programmer: normalizeText(source.programmer),
  };
};

const parseSourceMapPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;
  const sourceMap = source.sourceMap;

  if (!sourceMap || typeof sourceMap !== "object") {
    return null;
  }

  const mapRecord = sourceMap as Record<string, unknown>;
  const provider = normalizeText(mapRecord.provider);
  const externalId = normalizeText(mapRecord.externalId);

  if (!provider || !externalId) {
    return null;
  }

  return {
    provider,
    externalId,
  };
};

const createGame = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const gameInfo = parseGameInfoPayload(body);
    const sourceMap = parseSourceMapPayload(body);

    if (!gameInfo || !gameInfo.name) {
      return NextResponse.json(
        { error: "Invalid game info payload" },
        { status: 400 },
      );
    }

    const now = dayjs().toISOString();

    const inserted = await db
      .insert(GameInfoTable)
      .values({
        date: gameInfo.date,
        cover: gameInfo.cover,
        icon: "",
        logo: "",
        bg: "",
        summary: gameInfo.summary,
        name: gameInfo.name,
        nameCn: gameInfo.nameCn,
        tags: gameInfo.tags.join(","),
        nsfw: gameInfo.nsfw ? 1 : 0,
        ailases: gameInfo.ailases.join(","),
        platforms: gameInfo.platforms.join(","),
        gameType: gameInfo.gameType,
        gameEngine: gameInfo.gameEngine,
        music: gameInfo.music,
        script: gameInfo.script,
        graphic: gameInfo.graphic,
        originalPainter: gameInfo.originalPainter,
        animationProduction: gameInfo.animationProduction,
        developer: gameInfo.developer,
        publisher: gameInfo.publisher,
        programmer: gameInfo.programmer,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: GameInfoTable.id });

    const gameId = inserted[0]?.id;

    if (gameId) {
      if (sourceMap) {
        await db
          .insert(GameIdMapTable)
          .values({
            gameId,
            provider: sourceMap.provider,
            externalId: sourceMap.externalId,
          })
          .onConflictDoNothing({
            target: [
              GameIdMapTable.gameId,
              GameIdMapTable.provider,
              GameIdMapTable.externalId,
            ],
          });

        if (sourceMap.provider.trim().toLowerCase() === "vndb") {
          void syncVndbCharactersByGameId(gameId).catch((error) => {
            console.error("Auto sync VNDB characters failed:", error);
          });
        }
      }

      if (sourceMap?.provider.toLowerCase() === "steam") {
        const appId = Number(sourceMap.externalId);
        if (Number.isInteger(appId) && appId > 0) {
          // 获取启用的代理配置
          const proxySettings = await getEnabledProxySettings();
          const details = await fetchSteamAppDetails(
            appId,
            proxySettings ?? undefined,
          );
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
            await db.insert(GamePvTable).values(pvRows);
          }
        }
      }

      const websites = [...gameInfo.websites, ...gameInfo.links]
        .map((item) => {
          const entries = Object.entries(item);
          if (entries.length === 0) {
            return null;
          }
          const [name, url] = entries[0];
          return {
            gameId,
            name,
            url,
          };
        })
        .filter(
          (item): item is { gameId: number; name: string; url: string } =>
            item !== null,
        );

      if (websites.length > 0) {
        await db.insert(relateWebsiteTable).values(websites);
      }
    }

    return NextResponse.json({ data: { id: gameId } });
  } catch (error) {
    console.error("Create game failed:", error);
    return NextResponse.json({ error: "Failed to save game" }, { status: 500 });
  }
};

export { createGame as POST };
