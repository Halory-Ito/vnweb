export const DEFAULT_APP_PORT: number
export const MIN_APP_PORT: number
export const MAX_APP_PORT: number

export function parseValidPort(value: unknown): number | null
export function readConfiguredAppPortSync(): number
export function resolveServerPortSync(): number
