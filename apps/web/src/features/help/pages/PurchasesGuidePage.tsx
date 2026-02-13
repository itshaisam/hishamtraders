import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { purchasesContent } from '../data/purchasesContent';

export default function PurchasesGuidePage() {
  return (
    <GuideLayout section="purchases" content={purchasesContent}>
      <ContentRenderer content={purchasesContent} />
    </GuideLayout>
  );
}
