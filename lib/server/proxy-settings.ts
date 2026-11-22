import { eq } from 'drizzle-orm'

import { ProxyConfigTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

import type { ProxySettings, ProxyType } from '@/lib/settings/proxy-settings'

export async function getEnabledProxySettings(): Promise<ProxySettings | null> {
  try {
    const [row] = await db
      .select()
      .from(ProxyConfigTable)
      .where(eq(ProxyConfigTable.enabled, 1))
      .limit(1)

    if (!row) return null
    return {
      enabled: true,
      type: row.type as ProxyType,
      host: row.host,
      port: row.port,
      username: row.username || '',
      password: row.password || '',
    }
  } catch (error) {
    console.error('Failed to get enabled proxy settings:', error)
    return null
  }
}
