import { api } from "@/lib/request-utils";

import type { GameFilterState, GameSidebarProps } from "@/types/game-types";

export type GameDetail = {
  id: number;
  date: string;
  cover: string;
  icon: string;
  logo: string;
  bg: string;
  summary: string;
  name: string;
  nameCn: string;
  tags: string[];
  nsfw: boolean;
  ailases: string[];
  platforms: string[];
  gameType: string;
  gameEngine: string;
  music: string;
  script: string;
  graphic: string;
  originalPainter: string;
  animationProduction: string;
  developer: string;
  publisher: string;
  programmer: string;
  createdAt: string | null;
  updatedAt: string | null;
  exePath: string;
  totalPlayTime: number;
  playCount: number;
  rating: number;
  lastLaunchedAt: string;
  playStatus: number;
  isRunning: boolean;
  currentSessionSeconds: number;
  externalSourceIds: string;
  websites: Array<{
    id: number;
    name: string;
    url: string;
  }>;
};

export type GameRuntime = {
  isRunning: boolean;
  currentSessionSeconds: number;
};

export type VndbCharacterListItem = {
  id: string;
  name: string;
  original: string;
  imageUrl: string;
  role: "main" | "primary" | "side" | "appears" | "";
};

export type CharacterSyncSource = "vndb" | "bangumi" | "both";
export type CharacterMergeStrategy =
  | "prefer_vndb"
  | "prefer_bangumi"
  | "prefer_bangumi_with_vndb_fallback";

export type VndbCharacterDetail = {
  id: string;
  name: string;
  original: string;
  description: string;
  imageUrl: string;
  bloodType: string;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  cup: string;
  age: number | null;
  birthday: [number, number] | null;
  sex: [string | null, string | null] | null;
  gender: [string | null, string | null] | null;
};

export const getGameFilterOptions = async () => {
  const response = await api.get("/game/filter-options");
  return (
    response.data as {
      data: {
        releaseDates: string[];
        developers: string[];
        publishers: string[];
        categories: string[];
        platforms: string[];
        tags: string[];
        originalPainters: string[];
        scripts: string[];
        musics: string[];
        engines: string[];
        plannings: string[];
      };
    }
  ).data;
};

export type GameTimerRecordItem = {
  id: number;
  startAt: string;
  endAt: string;
  durationSeconds: number;
};

export type GameMediaLinkItem = {
  id: number;
  name: string;
  url: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GameMemoryItem = {
  id: number;
  gameId: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CollectionGameItem = {
  linkId: number;
  id: number;
  name: string;
  cover: string;
  icon: string;
  date: string;
  addedAt: string;
  lastRunAt: string;
  playTime: number;
  rating: number;
};

export type CollectionItem = {
  id: number;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  firstGameCover: string;
  games: CollectionGameItem[];
};

export type GameCardListItem = {
  id: string;
  title: string;
  cover: string;
  publishAt: string;
  lastRunAt: string;
  addedAt: string;
  playTime: number;
  rating: number;
};

export const getGameById = async (id: string) => {
  const response = await api.get(`/game/${id}`);
  return (response.data as { data: GameDetail }).data;
};

export const getGameRuntimeById = async (id: number) => {
  const response = await api.get(`/game/${id}/runtime`);
  return (response.data as { data: GameRuntime }).data;
};

export const getVndbCharactersByGameId = async (gameId: number) => {
  const response = await api.get("/db/vndb/characters", {
    params: {
      gameId,
    },
  });
  return (
    response.data as {
      data: {
        vnId: string;
        bgmSubjectId: string;
        items: VndbCharacterListItem[];
      };
    }
  ).data;
};

export const syncVndbCharactersByGameId = async (
  gameId: number,
  options?: {
    source?: CharacterSyncSource;
    mergeStrategy?: CharacterMergeStrategy;
    saveImagesToLocal?: boolean;
  },
) => {
  const response = await api.post("/db/vndb/characters", {
    gameId,
    source: options?.source,
    mergeStrategy: options?.mergeStrategy,
    saveImagesToLocal: options?.saveImagesToLocal,
  });
  return (
    response.data as {
      data: {
        gameId: number;
        vnId: string;
        bgmSubjectId: string;
        total: number;
        inserted: number;
        updated: number;
      };
    }
  ).data;
};

export const clearVndbCharactersByGameId = async (gameId: number) => {
  const response = await api.delete("/db/vndb/characters", {
    params: {
      gameId,
    },
  });

  return (
    response.data as {
      data: {
        gameId: number;
        cleared: boolean;
      };
    }
  ).data;
};

export const getVndbCharacterById = async (
  characterId: string,
  gameId?: number,
) => {
  const response = await api.get(`/db/vndb/character/${characterId}`, {
    params: gameId ? { gameId } : undefined,
  });
  return (response.data as { data: VndbCharacterDetail }).data;
};

export const updateVndbCharacterById = async (
  characterId: string,
  payload: {
    gameId: number;
    name: string;
    original: string;
    description: string;
    imageUrl: string;
    bloodType: string;
    height: number | null;
    weight: number | null;
    bust: number | null;
    waist: number | null;
    hips: number | null;
    age: number | null;
    birthday: [number, number] | null;
    sex: [string | null, string | null] | null;
    gender: [string | null, string | null] | null;
  },
) => {
  const response = await api.patch(
    `/db/vndb/character/${characterId}`,
    payload,
  );
  return (response.data as { data: { updated: boolean } }).data;
};

export const launchGameById = async (id: number, exePath?: string) => {
  const response = await api.post(`/game/${id}/launch`, {
    exePath,
  });
  return response.data as {
    data: {
      exePath: string;
      iconPath: string;
    };
  };
};

export const stopGameById = async (id: number) => {
  const response = await api.post(`/game/${id}/stop`);
  return response.data as {
    data: {
      stopped: boolean;
    };
  };
};

export const updateGamePlayStatusById = async (id: number, status: number) => {
  const response = await api.patch(`/game/${id}`, {
    status,
  });
  return response.data as {
    data: {
      status: number;
    };
  };
};

export const getGameTimerRecordsById = async (id: number) => {
  const response = await api.get(`/game/${id}/records`);
  return (
    response.data as {
      data: {
        records: GameTimerRecordItem[];
        totalPlayTime: number;
      };
    }
  ).data;
};

export const updateGameTimerRecordsById = async (
  id: number,
  payload: {
    records: Array<{
      startAt: string;
      endAt: string;
    }>;
  },
) => {
  const response = await api.put(`/game/${id}/records`, payload);
  return (
    response.data as {
      data: {
        updated: boolean;
        totalPlayTime: number;
      };
    }
  ).data;
};

export const updateGameRatingById = async (id: number, rating: number) => {
  const response = await api.patch(`/game/${id}`, {
    rating,
  });
  return response.data as {
    data: {
      rating: number;
    };
  };
};

export const getGamePvsById = async (id: number) => {
  const response = await api.get(`/game/${id}/pv`);
  return (
    response.data as {
      data: {
        items: GameMediaLinkItem[];
      };
    }
  ).data;
};

export const syncSteamPvsByGameId = async (
  id: number,
  payload?: {
    steamAppId?: string | number;
  },
) => {
  const response = await api.post(`/game/${id}/pv/steam-sync`, payload);
  return (
    response.data as {
      data: {
        gameId: number;
        steamAppId: number;
        total: number;
        inserted: number;
        skipped: number;
      };
    }
  ).data;
};

export const createGamePvById = async (
  id: number,
  payload: {
    name: string;
    url: string;
  },
) => {
  const response = await api.post(`/game/${id}/pv`, payload);
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem;
      };
    }
  ).data;
};

export const updateGamePvById = async (
  id: number,
  payload: {
    itemId: number;
    name: string;
    url: string;
  },
) => {
  const response = await api.patch(`/game/${id}/pv`, payload);
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem;
      };
    }
  ).data;
};

export const deleteGamePvById = async (id: number, itemId: number) => {
  const response = await api.delete(`/game/${id}/pv`, {
    params: {
      itemId,
    },
  });
  return (
    response.data as {
      data: {
        deleted: boolean;
        itemId: number;
      };
    }
  ).data;
};

export const importLocalGamePvById = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/game/${id}/pv/import`, formData);
  return (
    response.data as {
      data: {
        name: string;
        path: string;
      };
    }
  ).data;
};

export const getGameOstsById = async (id: number) => {
  const response = await api.get(`/game/${id}/ost`);
  return (
    response.data as {
      data: {
        items: GameMediaLinkItem[];
      };
    }
  ).data;
};

export const createGameOstById = async (
  id: number,
  payload: {
    name: string;
    url: string;
  },
) => {
  const response = await api.post(`/game/${id}/ost`, payload);
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem;
      };
    }
  ).data;
};

export const updateGameOstById = async (
  id: number,
  payload: {
    itemId: number;
    name: string;
    url: string;
  },
) => {
  const response = await api.patch(`/game/${id}/ost`, payload);
  return (
    response.data as {
      data: {
        item: GameMediaLinkItem;
      };
    }
  ).data;
};

export const deleteGameOstById = async (id: number, itemId: number) => {
  const response = await api.delete(`/game/${id}/ost`, {
    params: {
      itemId,
    },
  });
  return (
    response.data as {
      data: {
        deleted: boolean;
        itemId: number;
      };
    }
  ).data;
};

export const getGameMemoriesById = async (id: number, title?: string) => {
  const response = await api.get(`/game/${id}/memory`, {
    params: {
      title: title ?? "",
    },
  });
  return (
    response.data as {
      data: {
        items: GameMemoryItem[];
      };
    }
  ).data;
};

export const createGameMemoryById = async (
  id: number,
  payload: {
    image: File;
    title: string;
    description: string;
  },
) => {
  const formData = new FormData();
  formData.append("image", payload.image);
  formData.append("title", payload.title);
  formData.append("description", payload.description);

  const response = await api.post(`/game/${id}/memory`, formData);
  return (
    response.data as {
      data: {
        item: GameMemoryItem;
      };
    }
  ).data;
};

export const updateGameMemoryById = async (
  gameId: number,
  memoryId: number,
  payload: {
    title: string;
    description: string;
    image?: File;
  },
) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const response = await api.patch(
    `/game/${gameId}/memory/${memoryId}`,
    formData,
  );
  return (
    response.data as {
      data: {
        item: GameMemoryItem;
      };
    }
  ).data;
};

export const deleteGameMemoryById = async (
  gameId: number,
  memoryId: number,
) => {
  const response = await api.delete(`/game/${gameId}/memory/${memoryId}`);
  return response.data as {
    data: {
      deleted: boolean;
      id: number;
    };
  };
};

export const importLocalGameOstById = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/game/${id}/ost/import`, formData);
  return (
    response.data as {
      data: {
        name: string;
        path: string;
      };
    }
  ).data;
};

export const uploadGameOstLyricById = async (
  id: number,
  payload: {
    itemId: number;
    file: File;
  },
) => {
  const formData = new FormData();
  formData.append("itemId", String(payload.itemId));
  formData.append("file", payload.file);

  const response = await api.post(`/game/${id}/ost/lyric`, formData);
  return (
    response.data as {
      data: {
        itemId: number;
        path: string;
      };
    }
  ).data;
};

export const deleteGameById = async (id: number) => {
  const response = await api.delete(`/game/${id}`);
  return response.data as {
    data: {
      deleted: boolean;
      id: number;
    };
  };
};

export const browseLocalFileByGameId = async (id: number) => {
  const response = await api.post(`/game/${id}/browse-local`);
  return response.data as {
    data: {
      opened: boolean;
      exePath: string;
    };
  };
};

export const updateGameSettingsById = async (
  id: number,
  payload: {
    exePath: string;
    cover: string;
    bg: string;
    icon: string;
    logo: string;
  },
) => {
  const response = await api.patch(`/game/${id}`, payload);
  return response.data as {
    data: {
      updated: boolean;
    };
  };
};

export const enqueueGameImageLocalizationById = async (
  id: number,
  payload: {
    imageType: "cover" | "bg" | "icon" | "logo";
    sourceUrl: string;
  },
) => {
  const response = await api.post(`/game/${id}/image-localize`, payload);
  return response.data as {
    data: {
      path: string;
    };
  };
};

export const updateGameInfoById = async (
  id: number,
  payload: Partial<{
    date: string;
    cover: string;
    summary: string;
    name: string;
    nameCn: string;
    tags: string[];
    nsfw: boolean;
    ailases: string[];
    platforms: string[];
    gameType: string;
    gameEngine: string;
    music: string;
    script: string;
    graphic: string;
    originalPainter: string;
    animationProduction: string;
    developer: string;
    publisher: string;
    programmer: string;
    externalSourceIds: string;
  }>,
) => {
  const response = await api.patch(`/game/${id}`, payload);
  return response.data as {
    data: {
      updated: boolean;
    };
  };
};

export type GameSearchImageItem = {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
};

export const searchGameImages = async (payload: {
  source: string;
  keyword: string;
  imageType: "cover" | "bg" | "icon" | "logo";
}) => {
  const response = await api.post("/game/image-search", payload);
  return response.data as {
    data: {
      game: {
        id: number;
        name: string;
      } | null;
      items: GameSearchImageItem[];
    };
  };
};

export const getCollections = async () => {
  const response = await api.get("/collection");
  return (response.data as { data: CollectionItem[] }).data;
};

export const createCollection = async (name: string) => {
  const response = await api.post("/collection", { name });
  return (response.data as { data: { id: number; name: string } }).data;
};

export const addGameToCollection = async (
  collectionId: number,
  gameId: number,
) => {
  const response = await api.post(`/collection/${collectionId}/game`, {
    gameId,
  });
  return response.data as {
    data: {
      collectionId: number;
      gameId: number;
      added: boolean;
    };
  };
};

export const removeGameFromCollection = async (
  collectionId: number,
  gameId: number,
) => {
  const response = await api.delete(`/collection/${collectionId}/game`, {
    params: { gameId },
  });
  return response.data as {
    data: {
      collectionId: number;
      gameId: number;
      removed: boolean;
    };
  };
};

export const moveGameToCollection = async (
  sourceCollectionId: number,
  gameId: number,
  targetCollectionId: number,
) => {
  const response = await api.patch(`/collection/${sourceCollectionId}/game`, {
    gameId,
    targetCollectionId,
  });
  return response.data as {
    data: {
      gameId: number;
      sourceCollectionId: number;
      targetCollectionId: number;
      moved: boolean;
    };
  };
};

export const getGameCardList = async () => {
  const response = await api.get("/game/list");
  return (response.data as { data: GameCardListItem[] }).data;
};

export const batchUpdateGameMetadata = async (payload: {
  gameIds: number[];
  provider: "bangumi" | "steamgriddb";
  query?: string;
  fields: Array<
    | "date"
    | "cover"
    | "icon"
    | "logo"
    | "bg"
    | "summary"
    | "name"
    | "nameCn"
    | "tags"
    | "nsfw"
    | "ailases"
    | "platforms"
    | "gameType"
    | "gameEngine"
    | "music"
    | "script"
    | "graphic"
    | "originalPainter"
    | "animationProduction"
    | "developer"
    | "publisher"
    | "programmer"
  >;
  strategy: "replace" | "merge" | "append";
}) => {
  const response = await api.post("/game/metadata-batch", payload);
  return response.data as {
    data: {
      updatedCount: number;
      skippedCount: number;
      failedCount: number;
    };
  };
};

export const getGameSidebarData = async (payload: {
  search: string;
  filter: GameFilterState;
}) => {
  const params = new URLSearchParams();
  params.set("search", payload.search);

  params.set("releaseDateFrom", payload.filter.releaseDateFrom);
  params.set("releaseDateTo", payload.filter.releaseDateTo);
  params.set("playStatus", payload.filter.playStatus);
  params.set("developer", payload.filter.developer);
  params.set("publisher", payload.filter.publisher);
  params.set("category", payload.filter.category);
  params.set("platform", payload.filter.platform);
  params.set("tags", payload.filter.tags);
  params.set("originalPainter", payload.filter.originalPainter);
  params.set("script", payload.filter.script);
  params.set("music", payload.filter.music);
  params.set("engine", payload.filter.engine);
  params.set("planning", payload.filter.planning);

  const response = await api.get(`/game/sidebar?${params.toString()}`);
  return (
    response.data as {
      data: {
        mode: "search" | "default";
        items: GameSidebarProps[];
      };
    }
  ).data;
};
