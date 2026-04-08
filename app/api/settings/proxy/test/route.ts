import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const testUrl = searchParams.get('url')
  const proxyUrl = searchParams.get('proxy')

  if (!testUrl) {
    return NextResponse.json({ error: '测试URL不能为空' }, { status: 400 })
  }

  try {
    const startTime = Date.now()

    // 创建 axios 实例
    const axiosInstance = axios.create({
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
    })

    // 如果提供了代理配置，使用代理
    if (proxyUrl) {
      const agent = new HttpsProxyAgent(proxyUrl)
      axiosInstance.defaults.httpsAgent = agent
    }

    const response = await axiosInstance.get(testUrl)
    const latency = Date.now() - startTime

    const success = response.status >= 200 && response.status < 400

    return NextResponse.json({
      success,
      status: response.status,
      statusText: response.statusText,
      latency,
      proxy: proxyUrl || null,
      message: proxyUrl ? '通过代理访问' : '直连访问',
    })
  } catch (error) {
    const latency = Date.now()
    let errorMessage = '未知错误'

    if (error instanceof Error) {
      if (
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT')
      ) {
        errorMessage = '连接超时（10秒）'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '代理服务器连接被拒绝，请确认代理软件已启动'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = '代理服务器地址无法解析'
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = '连接被重置，可能是代理问题'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      latency,
    })
  }
}
