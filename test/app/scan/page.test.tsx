import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const mocks = vi.hoisted(() => ({
  getScannerList: vi.fn(),
  getScanErrors: vi.fn(),
  startScannerById: vi.fn(),
  deleteScannerById: vi.fn(),
  createScanner: vi.fn(),
  updateScannerById: vi.fn(),
  getGameCardList: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/game/scan-utils', () => ({
  createScanner: mocks.createScanner,
  deleteScannerById: mocks.deleteScannerById,
  getScanErrors: mocks.getScanErrors,
  getScannerList: mocks.getScannerList,
  startScannerById: mocks.startScannerById,
  updateScannerById: mocks.updateScannerById,
}))

vi.mock('@/lib/game/game-utils', () => ({
  getGameCardList: mocks.getGameCardList,
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
  }) =>
    open ? (
      <div>
        <button
          type="button"
          aria-label="mock-close-dialog"
          onClick={() => onOpenChange?.(false)}
        />
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

const SelectContext = React.createContext<(value: string) => void>(() => {})

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }) => (
    <SelectContext.Provider value={onValueChange ?? (() => {})}>
      <div data-select-value={value}>
        <input
          data-testid="mock-select-input"
          value={value}
          onInput={(event) =>
            onValueChange?.((event.target as HTMLInputElement).value)
          }
          onChange={(event) =>
            onValueChange?.((event.target as HTMLInputElement).value)
          }
        />
        {children}
      </div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder ?? ''}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => {
    const onValueChange = React.useContext(SelectContext)
    return (
      <button type="button" onClick={() => onValueChange(value)}>
        {children}
      </button>
    )
  },
}))

import Scan from '@/app/scan/page'

function setupDefaultMocks() {
  mocks.getScannerList.mockResolvedValue([
    {
      id: 1,
      directory: 'D:/Games/VN',
      provider: 'vndb',
      progress: 60,
      gameCount: 5,
      scanMode: 0,
      scanLevel: 2,
    },
  ])
  mocks.getScanErrors.mockResolvedValue([])
  mocks.getGameCardList.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
  mocks.startScannerById.mockResolvedValue({
    data: {
      scannedCount: 8,
      addedCount: 3,
    },
  })
  mocks.deleteScannerById.mockResolvedValue({
    data: {
      deleted: true,
    },
  })
  mocks.createScanner.mockResolvedValue({
    id: 2,
    directory: 'E:/VN',
    provider: 'vndb',
    progress: 0,
    gameCount: 0,
    scanMode: 0,
    scanLevel: 0,
  })
  mocks.updateScannerById.mockResolvedValue({
    id: 1,
    directory: 'D:/Games/VN-Updated',
    provider: 'vndb',
    scanMode: 0,
    scanLevel: 2,
  })
}

const clickActionButtonByText = (text: string, index = 0) => {
  const buttons = Array.from(document.querySelectorAll('button')).filter(
    (button): button is HTMLButtonElement =>
      button.textContent?.trim() === text && !button.disabled,
  )
  expect(buttons[index]).toBeTruthy()
  buttons[index]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('app/scan/page', () => {
  beforeEach(() => {
    document.body.innerHTML = ''

    mocks.getScannerList.mockReset()
    mocks.getScanErrors.mockReset()
    mocks.startScannerById.mockReset()
    mocks.deleteScannerById.mockReset()
    mocks.createScanner.mockReset()
    mocks.updateScannerById.mockReset()
    mocks.getGameCardList.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()

    setupDefaultMocks()

    vi.stubGlobal(
      'setInterval',
      vi.fn((handler: TimerHandler) => {
        if (typeof handler === 'function') {
          handler()
        }
        return 1
      }),
    )
    vi.stubGlobal('clearInterval', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads scanner data and renders summary information', async () => {
    const { getByText } = await render(<Scan />)

    await expect.element(getByText('D:/Games/VN')).toBeInTheDocument()
    await expect.element(getByText('扫描器个数：1')).toBeInTheDocument()
    await expect.element(getByText('游戏个数：2')).toBeInTheDocument()
    await expect.element(getByText('完成度 60%')).toBeInTheDocument()
  })

  it('renders status mapping and weighted progress branches', async () => {
    mocks.getScannerList.mockResolvedValue([
      {
        id: 1,
        directory: 'D:/A',
        provider: 'vndb',
        progress: 100,
        gameCount: 2,
        scanMode: 0,
        scanLevel: 1,
      },
      {
        id: 2,
        directory: 'D:/B',
        provider: 'bangumi',
        progress: 50,
        gameCount: 0,
        scanMode: 1,
        scanLevel: 0,
      },
      {
        id: 3,
        directory: 'D:/C',
        provider: 'vndb',
        progress: 0,
        gameCount: 3,
        scanMode: 0,
        scanLevel: 0,
      },
    ])

    const { getByText } = await render(<Scan />)

    expect(document.body.textContent).toContain('扫描中')
    expect(document.body.textContent).toContain('未开始')
    await expect.element(getByText('层级扫描（层级 1）')).toBeInTheDocument()
    await expect.element(getByText('可执行文件扫描')).toBeInTheDocument()
    await expect.element(getByText('41%')).toBeInTheDocument()
  })

  it('handles load failures for scanners, errors and game count', async () => {
    mocks.getScannerList.mockRejectedValueOnce({
      response: { data: { error: '加载目录失败' } },
    })
    mocks.getScanErrors.mockRejectedValueOnce(new Error('加载失败列表异常'))
    mocks.getGameCardList.mockRejectedValueOnce(new Error('列表读取失败'))

    const { getByText } = await render(<Scan />)

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('加载目录失败')
    })
    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('加载失败列表异常')
    })
    await expect.element(getByText('游戏个数：0')).toBeInTheDocument()
  })

  it('starts one scanner and shows success feedback', async () => {
    const { getByLabelText, getByText } = await render(<Scan />)

    await expect.element(getByText('D:/Games/VN')).toBeInTheDocument()

    await getByLabelText('开始扫描').click()

    await vi.waitFor(() => {
      expect(mocks.startScannerById).toHaveBeenCalledWith(1)
    })
    await vi.waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        '扫描完成：共 8 个，新增 3 个',
      )
    })
  })

  it('handles scanner start failure branch', async () => {
    mocks.startScannerById.mockRejectedValueOnce({
      response: { data: { error: '扫描任务失败' } },
    })

    const { getByLabelText } = await render(<Scan />)

    await getByLabelText('开始扫描').click()

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('扫描任务失败')
    })
  })

  it('handles scan-all empty flow', async () => {
    mocks.getScannerList.mockResolvedValueOnce([])

    const { getByText } = await render(<Scan />)
    await getByText('扫描全部').click()
    expect(mocks.startScannerById).not.toHaveBeenCalled()
  })

  it('handles scan-all success flow', async () => {
    mocks.getScannerList.mockResolvedValue([
      {
        id: 11,
        directory: 'D:/X',
        provider: 'vndb',
        progress: 0,
        gameCount: 1,
        scanMode: 0,
        scanLevel: 0,
      },
      {
        id: 12,
        directory: 'D:/Y',
        provider: 'vndb',
        progress: 0,
        gameCount: 1,
        scanMode: 0,
        scanLevel: 0,
      },
    ])

    const { getByText } = await render(<Scan />)
    await expect.element(getByText('D:/X')).toBeInTheDocument()
    await getByText('扫描全部').click()

    await vi.waitFor(() => {
      expect(mocks.startScannerById).toHaveBeenCalledWith(11)
    })
    await vi.waitFor(() => {
      expect(mocks.startScannerById).toHaveBeenCalledWith(12)
    })
    await vi.waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('全部扫描完成')
    })
  })

  it('handles scan-all failure branch', async () => {
    mocks.startScannerById.mockRejectedValueOnce(new Error('批量失败'))

    const { getByText } = await render(<Scan />)

    await getByText('扫描全部').click()

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('批量失败')
    })
  })

  it('handles directory delete success and failure branches', async () => {
    const first = await render(<Scan />)
    await first.getByLabelText('删除目录').click()

    await vi.waitFor(() => {
      expect(mocks.deleteScannerById).toHaveBeenCalledWith(1)
    })
    await vi.waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('已删除扫描目录')
    })

    mocks.deleteScannerById.mockRejectedValueOnce({
      response: { data: { error: '删除失败-后端' } },
    })

    const second = await render(<Scan />)
    await second.getByLabelText('删除目录').click()

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('删除失败-后端')
    })
  })

  it('opens failed dialog and renders empty and item states', async () => {
    mocks.getScanErrors.mockResolvedValue([
      {
        id: 99,
        error: '权限不足',
        directory: 'F:/denied',
      },
    ])

    const { getByText } = await render(<Scan />)

    await getByText('失败个数：1').click()

    await expect.element(getByText('权限不足')).toBeInTheDocument()
    await expect.element(getByText('目录：F:/denied')).toBeInTheDocument()
    clickActionButtonByText('关闭')

    mocks.getScanErrors.mockResolvedValue([])
    const empty = await render(<Scan />)
    await empty.getByText('失败个数：0').click()
    await expect.element(empty.getByText('暂无失败项')).toBeInTheDocument()
  })

  it('handles global setting add/remove exclude path flow', async () => {
    const { getByPlaceholder, getByText, getByLabelText } = await render(<Scan />)

    await getByText('全局设置').click()
    await expect.element(getByText('暂无排除路径')).toBeInTheDocument()

    clickActionButtonByText('添加')

    const excludeInput = getByPlaceholder('添加排除路径')
    await excludeInput.fill('C:/Temp')
    clickActionButtonByText('添加')
    await excludeInput.fill('C:/Temp')
    clickActionButtonByText('添加')

    await expect.element(getByText('C:/Temp')).toBeInTheDocument()

    await getByLabelText('删除排除路径').click()

    expect(document.body.textContent).not.toContain('C:/Temp')

    clickActionButtonByText('取消')
    await getByText('全局设置').click()
    clickActionButtonByText('保存')
  })

  it('validates add-directory empty path branch', async () => {
    const { getByRole } = await render(<Scan />)

    await getByRole('button', { name: '添加扫描目录列表' }).click()

    clickActionButtonByText('保存')
    expect(mocks.toastError).toHaveBeenCalledWith('请填写扫描目录路径')

    clickActionButtonByText('取消')
  })

  it('validates add-directory invalid level branch', async () => {
    const { getByPlaceholder, getByRole } = await render(<Scan />)

    await getByRole('button', { name: '添加扫描目录列表' }).click()

    const pathInput = getByPlaceholder('扫描目录')
    await pathInput.fill('E:/VN-Level-Invalid')

    const levelInput = getByPlaceholder('扫描层级（默认 0）')
    await levelInput.fill('-1')

    clickActionButtonByText('保存')
    expect(mocks.toastError).toHaveBeenCalledWith('扫描层级需为大于等于 0 的整数')
  })

  it('handles add-directory failure branch', async () => {
    const { getByPlaceholder, getByRole } = await render(<Scan />)

    await getByRole('button', { name: '添加扫描目录列表' }).click()

    const pathInput = getByPlaceholder('扫描目录')
    await pathInput.fill('E:/VN-Fail')

    mocks.createScanner.mockRejectedValueOnce({
      response: { data: { error: '保存失败-后端' } },
    })

    clickActionButtonByText('保存')

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('保存失败-后端')
    })
  })

  it('covers add-directory level input onChange branch', async () => {
    const { getByPlaceholder, getByRole } = await render(<Scan />)

    await getByRole('button', { name: '添加扫描目录列表' }).click()

    const levelInput = getByPlaceholder('扫描层级（默认 0）')
    await levelInput.fill('3')

    const pathInput = getByPlaceholder('扫描目录')
    await pathInput.fill('E:/VN-Level')

    clickActionButtonByText('保存')

    await vi.waitFor(() => {
      expect(mocks.createScanner).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'E:/VN-Level',
          scanLevel: 3,
        }),
      )
    })
  })

  it('creates directory with executable mode and covers add cancel branch', async () => {
    const { getByPlaceholder, getByRole, getByText } = await render(<Scan />)

    await getByRole('button', { name: '添加扫描目录列表' }).click()

    clickActionButtonByText('可执行文件扫描')

    const pathInput = getByPlaceholder('扫描目录')
    await pathInput.fill('E:/VN-Exec')

    clickActionButtonByText('保存')

    await vi.waitFor(() => {
      expect(mocks.createScanner).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'E:/VN-Exec',
          scanMode: 1,
        }),
      )
    })
    await vi.waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('扫描目录已保存')
    })

    await getByRole('button', { name: '添加扫描目录列表' }).click()
    clickActionButtonByText('取消')

    await expect
      .element(getByRole('button', { name: '添加扫描目录列表' }))
      .toBeInTheDocument()
  })

  it('covers edit invalid mode branch', async () => {
    mocks.getScannerList.mockResolvedValue([
      {
        id: 1,
        directory: 'D:/Games/VN',
        provider: 'vndb',
        progress: 20,
        gameCount: 5,
        scanMode: 2,
        scanLevel: 2,
      },
    ])

    const { getByLabelText } = await render(<Scan />)

    await getByLabelText('修改目录').click()
    clickActionButtonByText('保存')
    expect(mocks.toastError).toHaveBeenCalledWith('请选择有效的扫描模式')
  })

  it('covers edit open branch when target is missing', async () => {
    const { getByLabelText } = await render(<Scan />)

    const staleEditButton = document.querySelector(
      'button[aria-label="修改目录"]',
    ) as HTMLButtonElement | null
    expect(staleEditButton).toBeTruthy()

    await getByLabelText('删除目录').click()
    staleEditButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.body.textContent).not.toContain('修改扫描目录')
  })

  it('covers edit path/level/update branches', async () => {
    const { getByLabelText, getByPlaceholder, getByText } = await render(<Scan />)

    await getByLabelText('修改目录').click()

    const editPathInput = getByPlaceholder('扫描目录')
    await editPathInput.fill('   ')
    clickActionButtonByText('保存')
    expect(mocks.toastError).toHaveBeenCalledWith('请填写扫描目录路径')

    const editPathInputAfterError = getByPlaceholder('扫描目录')
    await editPathInputAfterError.fill('D:/Games/VN-Edit')

    mocks.updateScannerById.mockRejectedValueOnce(new Error('更新失败-异常'))
    clickActionButtonByText('保存')

    await vi.waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('更新失败-异常')
    })

    mocks.updateScannerById.mockResolvedValueOnce({
      id: 1,
      directory: 'D:/Games/VN-Edit',
      provider: 'vndb',
      scanMode: 0,
      scanLevel: 2,
    })

    clickActionButtonByText('保存')

    await vi.waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('扫描目录已更新')
    })
    await expect.element(getByText('D:/Games/VN-Edit')).toBeInTheDocument()

    await getByLabelText('修改目录').click()
    clickActionButtonByText('取消')
  })

  it('covers edit level validation and dialog close onOpenChange branch', async () => {
    const { getByLabelText, getByPlaceholder } = await render(<Scan />)

    await getByLabelText('修改目录').click()

    const editPathInput = getByPlaceholder('扫描目录')
    await editPathInput.fill('D:/Games/VN-Level')

    const editLevelInput = getByPlaceholder('扫描层级（默认 0）')
    await editLevelInput.fill('-1')

    clickActionButtonByText('保存')
    expect(mocks.toastError).toHaveBeenCalledWith('扫描层级需为大于等于 0 的整数')

    await getByLabelText('mock-close-dialog').click()
    expect(document.body.textContent).not.toContain('修改扫描目录')
  })
})
