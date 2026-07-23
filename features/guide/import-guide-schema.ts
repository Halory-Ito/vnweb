import { z } from 'zod'

import type { GuideEnding, GuideRoute, GuideSearchResult, GuideStep } from './guide-api'

const guideNameSchema = z.object({
  'zh-cn': z.string().min(1, 'name["zh-cn"] 不能为空'),
  'en-us': z.string().optional(),
  'ja-jp': z.string().optional(),
})

const guideStepSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['choice', 'save', 'load', 'note']).optional(),
  content: z.string().min(1, '步骤 content 不能为空'),
  group: z.string().optional(),
  prefix: z.string().optional(),
  subfix: z.string().optional(),
  finished: z.boolean().optional(),
})

const guideEndingSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '结局 name 不能为空'),
  type: z.enum(['normal', 'bad', 'good', 'true']).optional(),
  cover: z.string().optional(),
  steps: z.array(guideStepSchema).min(1, '结局 steps 不能为空数组'),
  requirements: z.string().optional(),
})

const guideRouteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '路线 name 不能为空'),
  endings: z.array(guideEndingSchema).min(1, '路线 endings 不能为空数组'),
})

export const guideJsonSchema = z.object({
  uid: z.string().optional(),
  vndb_id: z.string().optional(),
  seoName: z.string().optional(),
  cover: z.string().optional(),
  romaji: z.string().optional(),
  name: guideNameSchema,
  developer: z.string().optional(),
  releaseDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  level: z.number().int().min(0).max(5).optional(),
  tips: z.array(z.string()).optional(),
  show: z.boolean().optional(),
  nsfw_content: z.boolean().optional(),
  views: z.number().int().optional(),
  routes: z.array(guideRouteSchema).min(1, 'routes 不能为空数组'),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
})

export type GuideJsonInput = z.input<typeof guideJsonSchema>

export function validateGuideJson(value: unknown): GuideSearchResult {
  const parsed = guideJsonSchema.parse(value)

  return {
    uid: parsed.uid ?? '',
    cover: parsed.cover ?? '',
    name: {
      'zh-cn': parsed.name['zh-cn'],
      'en-us': parsed.name['en-us'] ?? '',
      'ja-jp': parsed.name['ja-jp'] ?? '',
    },
    developer: parsed.developer ?? '',
    romaji: parsed.romaji ?? '',
    tags: parsed.tags ?? [],
    level: parsed.level ?? 0,
    tips: parsed.tips ?? [],
    routes: parsed.routes.map(
      (route): GuideRoute => ({
        id: route.id ?? '',
        name: route.name,
        endings: route.endings.map(
          (ending): GuideEnding => ({
            id: ending.id ?? '',
            name: ending.name,
            type: ending.type ?? 'normal',
            cover: ending.cover,
            steps: ending.steps.map(
              (step): GuideStep => ({
                id: step.id ?? '',
                type: step.type ?? 'choice',
                content: step.content,
                group: step.group,
                prefix: step.prefix,
                subfix: step.subfix,
                finished: step.finished,
              }),
            ),
            requirements: ending.requirements,
          }),
        ),
      }),
    ),
  }
}
