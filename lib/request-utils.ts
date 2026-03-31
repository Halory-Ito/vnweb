import axios from "axios";

const getPublicEnv = (key: string): string | undefined => {
  if (typeof import.meta !== "undefined") {
    const value = (
      import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    ).env?.[key];
    if (value) {
      return value;
    }
  }

  if (typeof globalThis !== "undefined") {
    const value = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key];
    if (value) {
      return value;
    }
  }

  return undefined;
};

export const api = axios.create({
  baseURL: getPublicEnv("NEXT_PUBLIC_API_URL") ?? "http://localhost:3000/api",
  timeout: undefined,
  proxy: false,
});
