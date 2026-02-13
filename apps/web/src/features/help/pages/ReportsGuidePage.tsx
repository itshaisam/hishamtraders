import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { reportsContent } from '../data/reportsContent';

export default function ReportsGuidePage() {
  return (
    <GuideLayout section="reports" content={reportsContent}>
      <ContentRenderer content={reportsContent} />
    </GuideLayout>
  );
}
