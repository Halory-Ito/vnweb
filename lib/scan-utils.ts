import { api } from '@/lib/request-utils'

export type ScannerItem = {
  id: number
  directory: string
  provider: string
  progress: number
  gameCount: number
  scanMode: number
  scanLevel: number
  excludeDirs: string
  createdAt: string | null
  updatedAt: string | null
}

export type ScanErrorItem = {
  id: number
  directory: string
  error: string
  status: number
  createdAt: string | null
  updatedAt: string | null
}

export const getScannerList = async () => {
  const response = await api.get('/scan/scanner')
  return (response.data as { data: ScannerItem[] }).data
}

export const createScanner = async (payload: {
  directory: string
  provider: string
  scanMode: number
  scanLevel: number
}) => {
  const response = await api.post('/scan/scanner', payload)
  return (response.data as { data: ScannerItem }).data
}

export const updateScannerById = async (
  id: number,
  payload: {
    directory: string
    provider: string
    scanMode: number
    scanLevel: number
  },
) => {
  const response = await api.patch(`/scan/scanner/${id}`, payload)
  return (response.data as { data: ScannerItem }).data
}

export const deleteScannerById = async (id: number) => {
  const response = await api.delete(`/scan/scanner/${id}`)
  return response.data as {
    data: {
      deleted: boolean
      id: number
    }
  }
}

export const startScannerById = async (id: number) => {
  const response = await api.post(`/scan/scanner/${id}/start`)
  return response.data as {
    data: {
      scannerId: number
      scannedCount: number
      matchedCount: number
      addedCount: number
    }
  }
}

export const getScanErrors = async () => {
  const response = await api.get('/scan/error')
  return (response.data as { data: ScanErrorItem[] }).data
}
