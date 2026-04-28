import axios from 'axios'

const BASE_URL = 'https://downloads.khinsider.com'

/**
 * 搜索专辑
 * @param kw 搜索关键词
 * @returns 搜索结果数组
 */
async function searchAlbums(kw: string) {
  const url = `${BASE_URL}/search?search=${encodeURIComponent(kw)}`
  const res = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: BASE_URL,
      Origin: BASE_URL,
    },
  })

  const results: Array<{
    name: string
    url: string
    type: 'album' | 'soundtrack'
  }> = []

  // 解析搜索结果
  // 专辑链接格式: /game-soundtracks/album/album-name 或 /soundtracks/album-name
  const patterns = [
    /<a href="(\/game-soundtracks\/album\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
    /<a href="(\/soundtracks\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(res.data)) !== null) {
      const albumUrl = new URL(match[1], BASE_URL).href
      const albumName = match[2].trim()

      // 过滤掉太短的名字或导航链接
      if (albumName.length < 2) continue

      // 检查是否已存在
      const exists = results.some((r) => r.url === albumUrl)
      if (!exists) {
        results.push({
          name: albumName,
          url: albumUrl,
          type: match[1].startsWith('/game-soundtracks')
            ? 'album'
            : 'soundtrack',
        })
      }
    }
  }

  return results
}

/**
 * 获取专辑详情
 * @param albumUrl 专辑页面URL
 * @returns 专辑信息，包括封面和歌曲列表
 */
async function getAlbumDetails(albumUrl: string) {
  const res = await axios.get(albumUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: albumUrl,
      Origin: BASE_URL,
    },
  })

  const result: {
    name: string
    covers: string[]
    songs: Array<{
      name: string
      url: string
      duration?: string
      size?: string
    }>
  } = {
    name: '',
    covers: [],
    songs: [],
  }

  // 提取专辑名称 - 从h2标签中获取
  const h2Match = res.data.match(/<h2[^>]*>([^<]+)<\/h2>/i)
  if (h2Match) {
    result.name = h2Match[1].trim()
  }

  // 提取封面图片 - 从专辑信息区域的img标签获取
  // 封面通常在thumbs/目录下的图片，以00%20开头或包含Booklet/Front/Cover等关键词
  const coverPattern =
    /<img src="(https:\/\/[a-z]+\.vgmtreasurechest\.com\/soundtracks\/[^"]+\/thumbs\/[^"]+\.(?:jpg|png|jpeg|gif))"/gi

  let coverMatch
  while ((coverMatch = coverPattern.exec(res.data)) !== null) {
    const coverUrl = coverMatch[1]
    if (!result.covers.includes(coverUrl)) {
      result.covers.push(coverUrl)
    }
  }

  // 提取歌曲列表 - 解析包含.mp3链接的单元格
  // 歌曲链接格式: /game-soundtracks/album/album-name/song-name.mp3
  const songPattern =
    /<td class="clickable-row"><a href="(\/game-soundtracks\/album\/[^/]+\/[^"]+\.mp3)"[^>]*>([^<]+)<\/a><\/td>/gi

  const songSet = new Set<string>()

  let match
  while ((match = songPattern.exec(res.data)) !== null) {
    const songUrl = new URL(match[1], BASE_URL).href
    const songName = decodeURIComponent(match[2].trim())

    // 过滤掉重复的和太短的名字
    if (songName.length < 1 || songSet.has(songUrl)) continue

    songSet.add(songUrl)
    result.songs.push({
      name: songName,
      url: songUrl,
    })
  }

  // 尝试获取时长信息 - 查找表格中的时长列
  const durationPattern =
    /<td class="clickable-row" align="right">(\d+:\d+)<\/td>/gi

  let songIndex = 0
  let durationMatch

  while ((durationMatch = durationPattern.exec(res.data)) !== null) {
    const duration = durationMatch[1]
    if (songIndex < result.songs.length) {
      result.songs[songIndex].duration = duration
      songIndex++
    }
  }

  return result
}

/**
 * 获取歌曲音频URL
 * @param songPageUrl 歌曲页面URL
 * @returns 音频文件URL
 */
async function getSongAudioUrl(songPageUrl: string): Promise<string | null> {
  const res = await axios.get(songPageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: songPageUrl,
      Origin: BASE_URL,
    },
  })

  // 查找音频播放器
  const audioPatterns = [
    /<audio[^>]*src="([^"]+\.(mp3|flac|ogg|wav|m4a|aac|opus))"[^>]*>/i,
    /<source[^>]*src="([^"]+\.(mp3|flac|ogg|wav|m4a|aac|opus))"[^>]*>/i,
    // 查找下载链接
    /href="([^"]+\.(mp3|flac|ogg|wav|m4a|aac|opus))"[^>]*>.*?(?:Download|Play|Mp3|FLAC)/i,
  ]

  for (const pattern of audioPatterns) {
    const match = res.data.match(pattern)
    if (match) {
      return new URL(match[1], songPageUrl).href
    }
  }

  // 尝试从JavaScript变量中获取
  const jsAudioPattern =
    /(?:audioUrl|mp3Url|soundUrl|source)\s*[=:]\s*["']([^"']+\.(?:mp3|flac|ogg|wav|m4a|aac|opus))["']/i
  const jsMatch = res.data.match(jsAudioPattern)
  if (jsMatch) {
    return new URL(jsMatch[1], songPageUrl).href
  }

  return null
}

// 测试函数
async function main() {
  console.log('=== 搜索测试 ===')
  const searchResults = await searchAlbums('sakura no uta')
  console.log('搜索结果:', JSON.stringify(searchResults, null, 2))

  if (searchResults.length > 0) {
    console.log('\n=== 专辑详情测试 ===')
    const albumDetails = await getAlbumDetails(searchResults[0].url)
    console.log('专辑详情:', JSON.stringify(albumDetails, null, 2))
  }
}

// 运行测试
main().catch(console.error)
