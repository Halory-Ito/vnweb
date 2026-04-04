import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { CharacterTable } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { VNDBClient } from "@/lib/vndb-client";

type VndbCharacterDetailResult = {
  id?: string;
  name?: string;
  original?: string | null;
  description?: string | null;
  blood_type?: string | null;
  height?: number | null;
  weight?: number | null;
  bust?: number | null;
  waist?: number | null;
  hips?: number | null;
  cup?: string | null;
  age?: number | null;
  birthday?: [number, number] | null;
  sex?: [string | null, string | null] | null;
  gender?: [string | null, string | null] | null;
  image?: {
    url?: string;
  } | null;
};

const normalizeCharacterId = (rawId: string) => {
  const trimmed = rawId.trim();
  if (!trimmed) {
    return "";
  }

  if (/^bgm-\d+$/i.test(trimmed)) {
    return trimmed.toLocaleLowerCase();
  }

  if (/^c\d+$/i.test(trimmed)) {
    return `c${trimmed.slice(1)}`;
  }

  if (/^\d+$/.test(trimmed)) {
    return `c${trimmed}`;
  }

  return "";
};

const getCharacterById = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params;
    const characterId = normalizeCharacterId(id);
    const gameIdParam = Number(req.nextUrl.searchParams.get("gameId"));

    if (!characterId) {
      return NextResponse.json(
        { error: "Invalid character id parameter" },
        { status: 400 },
      );
    }

    if (Number.isInteger(gameIdParam) && gameIdParam > 0) {
      const localRows = await db
        .select({
          vndbId: CharacterTable.vndbId,
          name: CharacterTable.name,
          original: CharacterTable.original,
          description: CharacterTable.description,
          imageUrl: CharacterTable.imageUrl,
          bloodType: CharacterTable.bloodType,
          height: CharacterTable.height,
          weight: CharacterTable.weight,
          bust: CharacterTable.bust,
          waist: CharacterTable.waist,
          hips: CharacterTable.hips,
          age: CharacterTable.age,
          birthdayMonth: CharacterTable.birthdayMonth,
          birthdayDay: CharacterTable.birthdayDay,
          sex: CharacterTable.sex,
          gender: CharacterTable.gender,
        })
        .from(CharacterTable)
        .where(
          and(
            eq(CharacterTable.gameId, gameIdParam),
            eq(CharacterTable.vndbId, characterId),
          ),
        )
        .limit(1);

      const localCharacter = localRows[0];
      if (localCharacter) {
        const sex = localCharacter.sex
          ? (JSON.parse(localCharacter.sex) as [string | null, string | null])
          : null;
        const gender = localCharacter.gender
          ? (JSON.parse(localCharacter.gender) as [
            string | null,
            string | null,
          ])
          : null;

        return NextResponse.json({
          data: {
            id: localCharacter.vndbId,
            name: localCharacter.name,
            original: localCharacter.original || "",
            description: localCharacter.description || "",
            imageUrl: localCharacter.imageUrl || "",
            bloodType: localCharacter.bloodType || "",
            height: localCharacter.height,
            weight: localCharacter.weight,
            bust: localCharacter.bust,
            waist: localCharacter.waist,
            hips: localCharacter.hips,
            cup: "",
            age: localCharacter.age,
            birthday: localCharacter.birthdayMonth && localCharacter.birthdayDay
              ? [localCharacter.birthdayMonth, localCharacter.birthdayDay]
              : null,
            sex,
            gender,
          },
        });
      }
    }

    if (!/^c\d+$/i.test(characterId)) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const res = await VNDBClient.request({
      method: "POST",
      url: "/character",
      data: {
        filters: ["id", "=", characterId],
        fields:
          "name, original, description, image.url, blood_type, height, weight, bust, waist, hips, cup, age, birthday, sex, gender",
        results: 1,
      },
    });

    const payload = res.data as {
      results?: VndbCharacterDetailResult[];
    };

    const item = payload.results?.[0];
    if (!item) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: item.id ?? characterId,
        name: item.name ?? "",
        original: item.original ?? "",
        description: item.description ?? "",
        imageUrl: item.image?.url ?? "",
        bloodType: item.blood_type ?? "",
        height: item.height ?? null,
        weight: item.weight ?? null,
        bust: item.bust ?? null,
        waist: item.waist ?? null,
        hips: item.hips ?? null,
        cup: item.cup ?? "",
        age: item.age ?? null,
        birthday: item.birthday ?? null,
        sex: item.sex ?? null,
        gender: item.gender ?? null,
      },
    });
  } catch (error) {
    console.error("VNDB character detail fetch failed:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "VNDB character detail fetch failed",
      },
      { status: 500 },
    );
  }
};

const patchCharacterById = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params;
    const characterId = normalizeCharacterId(id);

    if (!characterId) {
      return NextResponse.json(
        { error: "Invalid character id parameter" },
        { status: 400 },
      );
    }

    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number;
      name?: string;
      original?: string;
      description?: string;
      imageUrl?: string;
      bloodType?: string;
      height?: number | null;
      weight?: number | null;
      bust?: number | null;
      waist?: number | null;
      hips?: number | null;
      age?: number | null;
      birthday?: [number, number] | null;
      sex?: [string | null, string | null] | null;
      gender?: [string | null, string | null] | null;
    };

    const gameId = Number(payload.gameId);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
    }

    const existing = await db
      .select({ id: CharacterTable.id })
      .from(CharacterTable)
      .where(
        and(
          eq(CharacterTable.gameId, gameId),
          eq(CharacterTable.vndbId, characterId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const toNullableInt = (value: unknown) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const num = Number(value);
      if (!Number.isFinite(num)) {
        return null;
      }
      return Math.trunc(num);
    };

    await db
      .update(CharacterTable)
      .set({
        name: typeof payload.name === "string" ? payload.name.trim() : "",
        original: typeof payload.original === "string"
          ? payload.original.trim()
          : "",
        description: typeof payload.description === "string"
          ? payload.description.trim()
          : "",
        imageUrl: typeof payload.imageUrl === "string"
          ? payload.imageUrl.trim()
          : "",
        bloodType: typeof payload.bloodType === "string"
          ? payload.bloodType.trim()
          : "",
        height: toNullableInt(payload.height),
        weight: toNullableInt(payload.weight),
        bust: toNullableInt(payload.bust),
        waist: toNullableInt(payload.waist),
        hips: toNullableInt(payload.hips),
        age: toNullableInt(payload.age),
        birthdayMonth: payload.birthday
          ? toNullableInt(payload.birthday[0])
          : null,
        birthdayDay: payload.birthday
          ? toNullableInt(payload.birthday[1])
          : null,
        sex: payload.sex ? JSON.stringify(payload.sex) : "",
        gender: payload.gender ? JSON.stringify(payload.gender) : "",
        updatedAt: dayjs().toISOString(),
      })
      .where(
        and(
          eq(CharacterTable.gameId, gameId),
          eq(CharacterTable.vndbId, characterId),
        ),
      );

    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    console.error("Character update failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Character update failed" },
      { status: 500 },
    );
  }
};

export const GET = getCharacterById;
export const PATCH = patchCharacterById;
