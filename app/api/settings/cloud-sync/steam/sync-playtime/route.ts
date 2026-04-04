import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import {
    GameIdMapTable,
    GamePlayTable,
    GameRecordTable,
    ThirdPartyAccountTable,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import {
    fetchOwnedGames,
    getSteamApiKey,
} from "@/app/api/game/steam-import/_shared";
import type { ProxySettings } from "@/lib/proxy-settings";

export const maxDuration = 300;

const syncSteamPlaytime = async (req: NextRequest) => {
    try {
        // 从请求体获取代理设置
        const body = (await req.json().catch(() => ({}))) as {
            proxy?: ProxySettings;
        };
        const proxySettings = body.proxy;

        // 获取绑定的 Steam 账号
        const steamAccount = await db
            .select({
                accountId: ThirdPartyAccountTable.accountId,
            })
            .from(ThirdPartyAccountTable)
            .where(eq(ThirdPartyAccountTable.provider, "steam"))
            .limit(1);

        if (!steamAccount[0]) {
            return NextResponse.json(
                { data: { success: false, message: "请先绑定 Steam 账号" } },
                { status: 400 },
            );
        }

        const steamId = steamAccount[0].accountId;
        const apiKey = getSteamApiKey();

        if (!apiKey) {
            return NextResponse.json(
                {
                    data: {
                        success: false,
                        message: "未配置 STEAM_API_KEY，无法同步游戏时长",
                    },
                },
                { status: 500 },
            );
        }

        // 获取 Steam 上的游戏时长（使用代理设置）
        const ownedGames = await fetchOwnedGames(
            steamId,
            apiKey,
            proxySettings,
        );

        // 获取已导入的 Steam 游戏映射
        const importedGames = await db
            .select({
                gameId: GameIdMapTable.gameId,
                externalId: GameIdMapTable.externalId,
            })
            .from(GameIdMapTable)
            .where(eq(GameIdMapTable.provider, "steam"));

        // 创建 appId 到 gameId 的映射
        const appIdToGameId = new Map<string, number>();
        for (const game of importedGames) {
            appIdToGameId.set(game.externalId, game.gameId);
        }

        // 统计更新的游戏数量
        let updatedCount = 0;
        let recordedCount = 0;
        const errors: string[] = [];
        const syncEndedAt = dayjs();
        const syncEndedAtIso = syncEndedAt.toISOString();

        // 更新游戏时长
        for (const game of ownedGames) {
            const appId = String(game.appid);
            const gameId = appIdToGameId.get(appId);

            if (!gameId) {
                continue;
            }

            const playtimeSeconds = Math.floor(
                (game.playtime_forever ?? 0) * 60,
            );

            if (playtimeSeconds <= 0) {
                continue;
            }

            try {
                // 检查是否已存在游戏时长记录
                const existingRecord = await db
                    .select({
                        id: GamePlayTable.id,
                        totalPlayTime: GamePlayTable.totalPlayTime,
                    })
                    .from(GamePlayTable)
                    .where(eq(GamePlayTable.gameId, gameId))
                    .limit(1);

                const existingTimerRecord = await db
                    .select({ id: GameRecordTable.id })
                    .from(GameRecordTable)
                    .where(eq(GameRecordTable.gameId, gameId))
                    .limit(1);

                const hasTimerRecord = Boolean(existingTimerRecord[0]);

                const previousTotal = Math.max(
                    0,
                    Number(existingRecord[0]?.totalPlayTime || 0),
                );
                const deltaSeconds = hasTimerRecord
                    ? playtimeSeconds - previousTotal
                    : playtimeSeconds;

                if (existingRecord[0]) {
                    // 更新现有记录
                    await db
                        .update(GamePlayTable)
                        .set({
                            totalPlayTime: playtimeSeconds,
                            ...(deltaSeconds > 0
                                ? { lastLaunchedAt: syncEndedAtIso }
                                : {}),
                        })
                        .where(eq(GamePlayTable.gameId, gameId));
                } else {
                    // 创建新记录
                    await db.insert(GamePlayTable).values({
                        gameId,
                        totalPlayTime: playtimeSeconds,
                        ...(deltaSeconds > 0
                            ? { lastLaunchedAt: syncEndedAtIso }
                            : {}),
                    });
                }

                if (deltaSeconds > 0) {
                    const startAt = syncEndedAt.subtract(
                        deltaSeconds,
                        "second",
                    );

                    await db.insert(GameRecordTable).values({
                        gameId,
                        playDate: startAt.toISOString(),
                        playTime: deltaSeconds,
                    });

                    recordedCount += 1;
                }

                updatedCount += 1;
            } catch (err) {
                errors.push(`App ${appId}: ${(err as Error).message}`);
            }
        }

        if (updatedCount === 0) {
            return NextResponse.json({
                data: {
                    success: true,
                    message: errors.length > 0
                        ? `同步完成，但有 ${errors.length} 个游戏更新失败`
                        : "没有找到已导入且有时长的 Steam 游戏",
                },
            });
        }

        return NextResponse.json({
            data: {
                success: true,
                message:
                    `成功同步 ${updatedCount} 个游戏的时长，新增 ${recordedCount} 条计时记录`,
            },
        });
    } catch (error) {
        console.error("Sync Steam playtime failed:", error);
        return NextResponse.json(
            {
                data: {
                    success: false,
                    message: (error as Error).message || "同步失败",
                },
            },
            { status: 500 },
        );
    }
};

export { syncSteamPlaytime as POST };
