import type { ReactNode } from 'react'

/** 游戏导入对话框通用 props */
export type GameImportDialogProps = {
  children: ReactNode
  initialProvider?: string
  lockProvider?: boolean
  dialogTitle?: string
  dialogDescription?: string
}
