import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

export type ProxyType = "http" | "https" | "socks5";

export type ServerProxySettings = {
    enabled: boolean;
    type: ProxyType;
    host: string;
    port: number;
    username: string;
    password: string;
};

export function buildProxyAgentUrl(
    settings: ServerProxySettings,
): string | null {
    if (!settings.enabled || !settings.host) {
        return null;
    }

    const auth = settings.username && settings.password
        ? `${encodeURIComponent(settings.username)}:${
            encodeURIComponent(settings.password)
        }@`
        : "";

    return `${settings.type}://${auth}${settings.host}:${settings.port}`;
}

export function createProxyAgent(settings: ServerProxySettings) {
    const proxyUrl = buildProxyAgentUrl(settings);

    if (!proxyUrl) {
        return null;
    }

    if (settings.type === "socks5") {
        return new SocksProxyAgent(proxyUrl);
    }

    return new HttpsProxyAgent(proxyUrl);
}
