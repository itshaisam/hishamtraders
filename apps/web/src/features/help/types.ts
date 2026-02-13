import { LucideIcon } from 'lucide-react';

export type CalloutVariant = 'tip' | 'warning' | 'note' | 'important';

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'steps'; steps: { title: string; description: string }[] }
  | { type: 'flow'; steps: string[] }
  | { type: 'callout'; variant: CalloutVariant; title: string; text: string }
  | { type: 'fieldTable'; fields: { name: string; fieldType: string; required: boolean; description: string }[] }
  | { type: 'keyValue'; pairs: { key: string; value: string }[] }
  | { type: 'code'; language?: string; code: string }
  | { type: 'roles'; roles: string[] };

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

export interface GuideSubSection {
  id: string;
  title: string;
  content: ContentBlock[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  roles?: string[];
  content: ContentBlock[];
  subSections?: GuideSubSection[];
}

export interface GuideContent {
  title: string;
  icon: LucideIcon;
  introduction: string;
  tableOfContents: TocItem[];
  sections: GuideSection[];
}

export interface HelpSectionDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  order: number;
  category: 'getting-started' | 'modules' | 'technical';
}
