export const METING_BITRATES = [128, 192, 320] as const
export const METING_COVER_SIZES = [150, 300, 500] as const
export const DEFAULT_METING_BITRATE = 320
export const DEFAULT_METING_COVER_SIZE = 300

export function isMetingBitrate(value: unknown) {
  return METING_BITRATES.some((bitrate) => bitrate === value)
}

export function isMetingCoverSize(value: unknown) {
  return METING_COVER_SIZES.some((size) => size === value)
}
