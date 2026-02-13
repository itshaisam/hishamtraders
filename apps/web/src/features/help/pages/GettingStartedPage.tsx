import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { gettingStartedContent } from '../data/gettingStartedContent';

export default function GettingStartedPage() {
  return (
    <GuideLayout section="getting-started" content={gettingStartedContent}>
      <ContentRenderer content={gettingStartedContent} />
    </GuideLayout>
  );
}
