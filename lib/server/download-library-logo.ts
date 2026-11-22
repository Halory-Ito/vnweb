import { lookup } from 'node:dns/promises'
import { get as getHttp, type IncomingMessage } from 'node:http'
import { get as getHttps } from 'node:https'
import { BlockList } from 'node:net'

import { APPEARANCE_MAX_IMAGE_BYTES, isAppearanceImageUrl } from '@/lib/settings/appearance-image'

const nonPublicAddresses = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 3],
] as const) {
  nonPublicAddresses.addSubnet(address, prefix)
}

async function openImage(url: URL, signal: AbortSignal) {
  const { address } = await lookup(url.hostname, { family: 4 })
  if (nonPublicAddresses.check(address)) throw new Error('图片链接需要指向公网地址。')

  const get = url.protocol === 'https:' ? getHttps : getHttp
  return new Promise<IncomingMessage>((resolve, reject) => {
    get(
      url,
      {
        signal,
        family: 4,
        agent: false,
        lookup: (_host, _options, callback) => callback(null, address, 4),
      },
      resolve,
    ).on('error', reject)
  })
}

export async function downloadLibraryLogo(source: string) {
  const signal = AbortSignal.timeout(8_000)
  let next = source

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!isAppearanceImageUrl(next) || next.startsWith('/'))
      throw new Error('请输入公网 HTTP 或 HTTPS 图片链接。')

    const url = new URL(next)
    const response = await openImage(url, signal)
    const code = response.statusCode ?? 0
    if (code >= 300 && code < 400 && response.headers.location) {
      response.destroy()
      next = new URL(response.headers.location, url).href
      continue
    }

    if (code !== 200) {
      response.destroy()
      throw new Error('无法下载远程图片。')
    }

    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of response) {
      size += chunk.length
      if (size > APPEARANCE_MAX_IMAGE_BYTES) throw new Error('图片不能超过 256 KB。')
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  throw new Error('图片链接重定向次数过多。')
}
