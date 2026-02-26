export default function RecordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full p-4">
      <h1 className="mb-4 h-full text-2xl font-bold">我的游戏记录</h1>
      {children}
    </div>
  )
}
