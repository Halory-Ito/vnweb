## 接口统计

- 接口文件总数：67
- GET：34
- POST：33
- PUT：3
- PATCH：6
- DELETE：9
- OPTIONS：0
- HEAD：0
- 未识别标准 HTTP 导出：7

### 按模块统计

- addOns：2 个（已识别方法 2 个）
- collection：2 个（已识别方法 2 个）
- db：5 个（已识别方法 0 个）
- game：27 个（已识别方法 26 个）
- market：5 个（已识别方法 5 个）
- record：5 个（已识别方法 5 个）
- scan：4 个（已识别方法 4 个）
- settings：16 个（已识别方法 16 个）
- test：1 个（已识别方法 0 个）

### 接口清单（按模块）

#### addOns

- [GET,POST,PUT,DELETE] /api/addOns/cctv-4k/sources
- [GET] /api/addOns/cctv-4k/stream

#### collection

- [GET,POST] /api/collection
- [POST,PATCH,DELETE] /api/collection/[id]/game

#### db

- [未识别] /api/db/bgm
- [未识别] /api/db/sgdb
- [未识别] /api/db/vndb
- [未识别] /api/db/vndb/character/[id]
- [未识别] /api/db/vndb/characters

#### game

- [POST] /api/game
- [GET,PATCH,DELETE] /api/game/[id]
- [POST] /api/game/[id]/browse-local
- [POST] /api/game/[id]/image-localize
- [POST] /api/game/[id]/launch
- [GET,POST] /api/game/[id]/memory
- [PATCH,DELETE] /api/game/[id]/memory/[memoryId]
- [GET,POST,PATCH,DELETE] /api/game/[id]/ost
- [POST] /api/game/[id]/ost/import
- [POST] /api/game/[id]/ost/lyric
- [GET,POST,PATCH,DELETE] /api/game/[id]/pv
- [POST] /api/game/[id]/pv/import
- [POST] /api/game/[id]/pv/steam-sync
- [GET,PUT] /api/game/[id]/records
- [GET] /api/game/[id]/runtime
- [POST] /api/game/[id]/stop
- [GET] /api/game/bangumi-import/search
- [未识别] /api/game/extract-icon
- [GET] /api/game/filter-options
- [POST] /api/game/image-search
- [GET] /api/game/list
- [POST] /api/game/metadata-batch
- [GET] /api/game/sidebar
- [POST] /api/game/steam-import
- [GET,POST] /api/game/steam-import/name-search
- [POST] /api/game/steam-import/search
- [GET] /api/game/vndb-import/search

#### market

- [GET] /api/market/plugins
- [GET] /api/market/plugins/assets/[...path]
- [POST] /api/market/plugins/import
- [POST] /api/market/plugins/install
- [POST] /api/market/plugins/uninstall

#### record

- [GET] /api/record/export
- [GET] /api/record/month-report
- [GET] /api/record/overview/stats
- [GET] /api/record/timeline
- [GET] /api/record/year-report

#### scan

- [GET] /api/scan/error
- [GET,POST] /api/scan/scanner
- [PATCH,DELETE] /api/scan/scanner/[id]
- [POST] /api/scan/scanner/[id]/start

#### settings

- [POST] /api/settings/background/upload
- [POST] /api/settings/backup/export
- [POST] /api/settings/backup/import
- [GET,POST,DELETE] /api/settings/cloud-sync/accounts
- [GET] /api/settings/cloud-sync/auth/bangumi/callback
- [GET] /api/settings/cloud-sync/auth/bangumi/start
- [GET] /api/settings/cloud-sync/auth/steam/callback
- [GET] /api/settings/cloud-sync/auth/steam/start
- [GET] /api/settings/cloud-sync/auth/vndb/callback
- [GET] /api/settings/cloud-sync/auth/vndb/start
- [POST] /api/settings/cloud-sync/steam/sync-playtime
- [POST] /api/settings/font/cleanup
- [POST] /api/settings/font/import
- [GET] /api/settings/font/local-list
- [GET,POST,PUT,DELETE] /api/settings/proxy
- [GET] /api/settings/proxy/test

#### test

- [未识别] /api/test
