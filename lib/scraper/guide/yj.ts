import axios from 'axios'

const YJ_API_BASE_URL = 'https://www.yjgalgame.com/api'

// https://www.yjgalgame.com/api/guides?q=痕 -きずあと-&page=1&pageSize=12
export function searchGuides(q: string, page: number = 1, pageSize: number = 12) {
  return axios({
    method: 'GET',
    url: `${YJ_API_BASE_URL}/guides`,
    params: {
      q,
      page,
      pageSize,
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
    },
  }).then((res) => res.data)
}
