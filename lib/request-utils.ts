import axios from 'axios'

export const api = axios.create({
  baseURL: `/api`,
  timeout: undefined,
  proxy: false,
})
