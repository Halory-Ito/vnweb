export { ClassicTemplate } from "./classic-template";
export type { TemplateProps } from "./classic-template";
export { ModernTemplate } from "./modern-template";
export { MinimalTemplate } from "./minimal-template";
export { GamingTemplate } from "./gaming-template";

import { ClassicTemplate } from "./classic-template";
import { ModernTemplate } from "./modern-template";
import { MinimalTemplate } from "./minimal-template";
import { GamingTemplate } from "./gaming-template";

export const TEMPLATES = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    minimal: MinimalTemplate,
    gaming: GamingTemplate,
} as const;

export type TemplateId = keyof typeof TEMPLATES;
