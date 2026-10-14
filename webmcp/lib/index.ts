export { ensureWebMcpRuntime } from './runtime'
export { resolveTargetGame } from './resolve-target-game'
export type { ResolveTargetGameResult } from './resolve-target-game'
export {
  buildGameNameCandidates,
  MAX_NAME_ATTEMPTS,
  searchWithGameNameCandidates,
} from './game-name-candidates'
export type { GameNameSource, SearchWithKeywordsResult } from './game-name-candidates'
export {
  findExternalSourceBinding,
  parseExternalSourceIds,
  serializeExternalSourceIds,
  withoutExternalSourceBinding,
} from './external-source-ids'
export type { ExternalSourceBinding } from './external-source-ids'
export {
  executeWebMcpTool,
  listWebMcpTools,
  parseToolCallArguments,
  toAgentToolDefinitions,
} from './client'
