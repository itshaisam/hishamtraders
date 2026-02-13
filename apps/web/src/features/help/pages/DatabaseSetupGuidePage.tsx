import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { setupContent } from '../data/setupContent';

export default function DatabaseSetupGuidePage() {
  return (
    <GuideLayout section="setup" content={setupContent}>
      <ContentRenderer content={setupContent} />
    </GuideLayout>
  );
}
