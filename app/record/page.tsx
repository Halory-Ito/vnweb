import MonthRecord from './month/page'
import RecordOverview from './overview/page'
import YearRecord from './year/page'
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
        <TabsTrigger value="week">周报</TabsTrigger>
        <TabsTrigger value="rating">评分报告</TabsTrigger>
        <TabsTrigger value="export">导出报告</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="overview">
        <RecordOverview />
      </TabsContent>
      <TabsContent value="year">
        <YearRecord />
      </TabsContent>
      <TabsContent value="month">
        <MonthRecord />
      </TabsContent>
      <TabsContent value="week">week</TabsContent>
      <TabsContent value="rating">rating</TabsContent>
      <TabsContent value="export">export</TabsContent>
    </Tabs>
  )
}
