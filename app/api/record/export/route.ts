import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { GameInfoTable, GamePlayTable, GameRecordTable } from "@/db/schema";
import { db } from "@/lib/drizzle";

const toHours = (seconds: number) => Number((seconds / 3600).toFixed(2));

const normalizeTags = (raw: string) =>
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (dateStr: string) => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${
    String(date.getMonth() + 1).padStart(2, "0")
  }-${String(date.getDate()).padStart(2, "0")}`;
};

const getRecordExport = async () => {
  try {
    const plays = await db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
        rating: GamePlayTable.rating,
      })
      .from(GamePlayTable)
      .orderBy(desc(GamePlayTable.totalPlayTime));

    const games = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        tags: GameInfoTable.tags,
        date: GameInfoTable.date,
        platforms: GameInfoTable.platforms,
        developer: GameInfoTable.developer,
        publisher: GameInfoTable.publisher,
        gameType: GameInfoTable.gameType,
      })
      .from(GameInfoTable);

    // 获取每个游戏的所有记录用于计算统计信息
    const gameIds = plays.map((p) => Number(p.gameId)).filter(Boolean);
    const records = gameIds.length > 0
      ? await db
        .select({
          gameId: GameRecordTable.gameId,
          playDate: GameRecordTable.playDate,
          playTime: GameRecordTable.playTime,
        })
        .from(GameRecordTable)
        .where(sql`${GameRecordTable.gameId} IN (${
          sql.join(gameIds.map((id) => sql`${id}`), sql`, `)
        })`)
      : [];

    // 按游戏分组记录
    const recordsByGame = new Map<number, typeof records>();
    for (const record of records) {
      const gameId = Number(record.gameId);
      if (!recordsByGame.has(gameId)) {
        recordsByGame.set(gameId, []);
      }
      recordsByGame.get(gameId)!.push(record);
    }

    const gameMap = new Map(games.map((item) => [Number(item.id), item]));

    const totalSeconds = plays.reduce(
      (sum, item) => sum + Math.max(0, Number(item.totalPlayTime || 0)),
      0,
    );

    const entries = plays
      .map((item) => {
        const game = gameMap.get(Number(item.gameId));
        if (!game) {
          return null;
        }

        const seconds = Math.max(0, Number(item.totalPlayTime || 0));
        if (seconds <= 0) {
          return null;
        }

        const ratio = totalSeconds > 0 ? seconds / totalSeconds : 0;

        // 计算游戏统计信息
        const gameRecords = recordsByGame.get(Number(item.gameId)) || [];

        // 按日期分组计算每日游玩时长
        const dailyTimes = new Map<string, number>();
        for (const record of gameRecords) {
          const dateKey = formatDate(record.playDate || "");
          if (!dateKey || !record.playTime) continue;
          dailyTimes.set(
            dateKey,
            (dailyTimes.get(dateKey) || 0) +
              Math.max(0, Number(record.playTime)),
          );
        }

        const dailyTimesList = Array.from(dailyTimes.values());

        // 第一次和最后一次游玩日期
        const sortedDates = Array.from(dailyTimes.keys()).sort();
        const firstPlayAt = sortedDates[0];
        const lastPlayAt = sortedDates[sortedDates.length - 1];

        // 单日最大游玩时长
        const maxDailySeconds = dailyTimesList.length > 0
          ? Math.max(...dailyTimesList)
          : 0;

        // 平均每日游玩时长
        const avgDailySeconds = dailyTimesList.length > 0
          ? dailyTimesList.reduce((a, b) => a + b, 0) / dailyTimesList.length
          : 0;

        // 游戏评分
        const rating = item.rating ?? null;

        return {
          id: String(game.id),
          title: game.nameCn || game.name || `游戏 ${game.id}`,
          cover: game.cover || "/cover/wa2.jpg",
          tags: normalizeTags(game.tags || "").slice(0, 5),
          totalPlaySeconds: seconds,
          totalPlayHours: toHours(seconds),
          ratio: Number((ratio * 100).toFixed(2)),
          firstPlayAt,
          lastPlayAt,
          maxDailySeconds,
          avgDailySeconds,
          rating,
          // 新增字段
          releaseDate: game.date || undefined,
          platforms: normalizeTags(game.platforms || ""),
          developer: game.developer || undefined,
          publisher: game.publisher || undefined,
          gameType: game.gameType || undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      data: {
        totalPlaySeconds: totalSeconds,
        totalPlayHours: toHours(totalSeconds),
        entries,
      },
    });
  } catch (error) {
    console.error("Get export report failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch export report" },
      { status: 500 },
    );
  }
};

export { getRecordExport as GET };
