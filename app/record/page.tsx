import RecordOverview from './overview/page'
import RecordExportPanel from '@/components/record/record-export-panel'
import RecordPeriodPanel from '@/components/record/record-period-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Record() {
  return (
    <Tabs
      defaultValue="overview"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="overview">总览</TabsTrigger>
        <TabsTrigger value="year">年报</TabsTrigger>
        <TabsTrigger value="month">月报</TabsTrigger>
        {/* <TabsTrigger value="week">周报</TabsTrigger> */}
        <TabsTrigger value="rating">评分报告</TabsTrigger>
        <TabsTrigger value="export">导出报告</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="overview">
        <RecordOverview />
      </TabsContent>
      <TabsContent value="year">
        <RecordPeriodPanel range="year" title="年度游戏报告" />
      </TabsContent>
      <TabsContent value="month">
        <RecordPeriodPanel range="month" title="月度游戏报告" />
      </TabsContent>
      {/* <TabsContent value="week">
        <RecordPeriodPanel range="week" title="周度游戏报告" />
      </TabsContent> */}
      <TabsContent value="rating">rating</TabsContent>
      <TabsContent value="export">
        <RecordExportPanel />
      </TabsContent>
    </Tabs>
  )
}
