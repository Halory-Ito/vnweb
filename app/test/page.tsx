'use client'
import { useEffect, useState } from 'react'

type ProgramStatus = {
  running: boolean
  path: string | null
  elapsedSeconds: number
}

export default function Test() {
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)
  const [status, setStatus] = useState<ProgramStatus>({
    running: false,
    path: null,
    elapsedSeconds: 0,
  })

  const queryStatus = async (silent = false) => {
    if (!silent) {
      setIsQuerying(true)
    }

    try {
      const response = await fetch('/api/test', {
        method: 'GET',
      })

      const data = (await response.json()) as ProgramStatus

      if (!response.ok) {
        if (!silent) {
          setMessage('状态查询失败')
        }
        return
      }

      setStatus(data)
    } catch {
      if (!silent) {
        setMessage('请求失败，请检查服务是否正常')
      }
    } finally {
      if (!silent) {
        setIsQuerying(false)
      }
    }
  }

  useEffect(() => {
    void queryStatus(true)
  }, [])

  useEffect(() => {
    if (!status.running) {
      return
    }

    const intervalId = setInterval(() => {
      void queryStatus(true)
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [status.running])

  const handleStart = async () => {
    if (!value.trim()) {
      setMessage('请输入可执行文件路径')
      return
    }

    setIsStarting(true)
    setMessage('')

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: value.trim() }),
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? '启动失败')
        return
      }
      setMessage(`已启动：${data.path}`)
      await queryStatus(true)
    } catch {
      setMessage('请求失败，请检查服务是否正常')
    } finally {
      setIsStarting(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    setMessage('')

    try {
      const response = await fetch('/api/test', {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error ?? '停止失败')
        await queryStatus(true)
        return
      }
      setMessage('已发送停止指令，等待程序退出...')
      await queryStatus(true)
    } catch {
      setMessage('请求失败，请检查服务是否正常')
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="flex min-h-screen min-w-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">本地程序启动测试</h1>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="请输入本地 .exe 路径"
        className="w-full max-w-2xl rounded border px-3 py-2"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting || isStopping}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {isStarting ? '启动中...' : '开始'}
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={isStarting || isStopping || isQuerying}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {isStopping ? '停止中...' : '停止'}
        </button>
        <button
          type="button"
          onClick={() => void queryStatus()}
          disabled={isStarting || isStopping || isQuerying}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {isQuerying ? '查询中...' : '查询状态'}
        </button>
      </div>
      <div className="w-full max-w-2xl rounded border p-3 text-sm">
        <p>状态：{status.running ? '运行中' : '未运行'}</p>
        <p>路径：{status.path ?? '-'}</p>
        <p>已运行：{status.elapsedSeconds} 秒</p>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  )
}
