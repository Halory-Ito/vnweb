import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { GamePlayTable } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { finalizeGameSession } from "@/lib/game-session-utils";

const stopGame = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params;
    const gameId = Number(id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "无效的游戏 id" }, { status: 400 });
    }

    const playRows = await db
      .select({
        isRunning: GamePlayTable.isRunning,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1);

    const play = playRows[0];
    if (!play || play.isRunning !== 1) {
      return NextResponse.json({ error: "游戏未在运行" }, { status: 400 });
    }

    // 结束游戏会话并记录游玩时间
    await finalizeGameSession(gameId);

    return NextResponse.json({ data: { stopped: true } });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "结束游戏失败" },
      { status: 500 },
    );
  }
};

export { stopGame as POST };
