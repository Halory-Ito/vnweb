'use client'

import { FileJson, ImportIcon, Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImportJsonTab from '@/features/guide/components/import-json-tab'
import ImportSearchTab from '@/features/guide/components/import-search-tab'
import OverwriteGuideAlert from '@/features/guide/components/overwrite-guide-alert'
import { useImportGuide } from '@/features/guide/hooks/use-import-guide'

export default function ImportGuide() {
  const {
    open,
    setOpen,
    mode,
    setMode,
    selectedGameId,
    setSelectedGameId,
    gameCards,
    keyword,
    setKeyword,
    searchResults,
    isSearching,
    hasSearched,
    selectedGuide,
    setSelectedGuide,
    handleSearch,
    jsonText,
    jsonError,
    setJsonText,
    isImporting,
    canImport,
    handleImport,
    isOverwriteAlertOpen,
    setIsOverwriteAlertOpen,
    confirmOverwrite,
    selectedGameTitle,
  } = useImportGuide()

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="h-10 gap-2">
            <ImportIcon className="h-4 w-4" />
            导入攻略
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入攻略</DialogTitle>
          </DialogHeader>

          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as 'search' | 'json')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                搜索攻略
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileJson className="h-4 w-4" />
                JSON 导入
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <TabsContent value="search" className="mt-0">
                <ImportSearchTab
                  keyword={keyword}
                  setKeyword={setKeyword}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  hasSearched={hasSearched}
                  selectedGuide={selectedGuide}
                  setSelectedGuide={setSelectedGuide}
                  onSearch={handleSearch}
                />
              </TabsContent>

              <TabsContent value="json" className="mt-0">
                <ImportJsonTab
                  jsonText={jsonText}
                  jsonError={jsonError}
                  onJsonTextChange={setJsonText}
                />
              </TabsContent>

              {/* 绑定游戏 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">绑定游戏</div>
                <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择要绑定的游戏" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {gameCards.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Tabs>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!canImport || isImporting}
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                '导入攻略'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OverwriteGuideAlert
        open={isOverwriteAlertOpen}
        onOpenChange={setIsOverwriteAlertOpen}
        gameTitle={selectedGameTitle}
        onConfirm={confirmOverwrite}
        isLoading={isImporting}
      />
    </>
  )
}
