/**
 * BGM API types
 * @see https://bangumi.github.io/api
 */

/**
 * @deprecated
 */
export type BGMSearchSubjectsRequestType = {
  keyword: string
  filter: {
    type: [2, 4]
  }
  nsfw: true
  sort: 'rank'
}
