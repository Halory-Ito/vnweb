declare module '@meting/core' {
  export default class Meting {
    constructor(server: string)
    format(enabled: boolean): this
    cookie(value: string): this
    search(
      keyword: string,
      options?: { type?: number; page?: number; limit?: number },
    ): Promise<string>
    song(id: string): Promise<string>
    album(id: string): Promise<string>
    playlist(id: string): Promise<string>
    url(id: string, bitrate: number): Promise<string>
    lyric(id: string): Promise<string>
    pic(id: string, size: number): Promise<string>
  }
}
