import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { salesContent } from '../data/salesContent';

export default function SalesGuidePage() {
  return (
    <GuideLayout section="sales" content={salesContent}>
      <ContentRenderer content={salesContent} />
    </GuideLayout>
  );
}
