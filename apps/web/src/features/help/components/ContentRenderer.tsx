import { GuideContent } from '../types';
import GuideSection from './GuideSection';
import GuideSubSection from './GuideSubSection';
import StepList from './StepList';
import FlowDiagram from './FlowDiagram';
import InfoCallout from './InfoCallout';
import FieldTable from './FieldTable';
import KeyValueGrid from './KeyValueGrid';
import CodeBlock from './CodeBlock';
import RoleBadges from './RoleBadges';
import { ContentBlock } from '../types';

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>;
    case 'steps':
      return <StepList steps={block.steps} />;
    case 'flow':
      return <FlowDiagram steps={block.steps} />;
    case 'callout':
      return (
        <InfoCallout variant={block.variant} title={block.title}>
          {block.text}
        </InfoCallout>
      );
    case 'fieldTable':
      return <FieldTable fields={block.fields} />;
    case 'keyValue':
      return <KeyValueGrid pairs={block.pairs} />;
    case 'code':
      return <CodeBlock code={block.code} language={block.language} />;
    case 'roles':
      return <RoleBadges roles={block.roles} />;
    default:
      return null;
  }
}

function RenderBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </>
  );
}

interface ContentRendererProps {
  content: GuideContent;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 leading-relaxed mb-8">{content.introduction}</p>
      {content.sections.map((section) => (
        <GuideSection
          key={section.id}
          id={section.id}
          title={section.title}
          icon={section.icon}
        >
          {section.roles && section.roles.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 mr-2">Accessible by:</span>
              <RoleBadges roles={section.roles} />
            </div>
          )}
          <RenderBlocks blocks={section.content} />
          {section.subSections?.map((sub) => (
            <GuideSubSection key={sub.id} id={sub.id} title={sub.title}>
              <RenderBlocks blocks={sub.content} />
            </GuideSubSection>
          ))}
        </GuideSection>
      ))}
    </div>
  );
}
