import type { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";

import { GET } from "@/app/api/settings/cloud-sync/auth/steam/start/route";

describe("settings/cloud-sync/auth/steam/start GET", () => {
    test("redirects to steam openid endpoint", async () => {
        const response = await GET(
            { nextUrl: new URL("http://localhost") } as NextRequest,
        );
        const location = response.headers.get("location") || "";

        expect(response.status).toBe(307);
        expect(location).toContain("steamcommunity.com/openid/login");
        expect(location).toContain("openid.mode=checkid_setup");
    });
});
