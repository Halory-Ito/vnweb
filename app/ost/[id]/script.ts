import { searchNeteaseAlbums, getNeteaseAlbumDetails } from './_ui/utils'

// 搜索专辑
const albums = await searchNeteaseAlbums('最终幻想')
console.log(albums) // 搜索结果列表

// 获取专辑详情和歌曲列表
const details = await getNeteaseAlbumDetails('493782')
console.log(details.songs) // 歌曲列表
