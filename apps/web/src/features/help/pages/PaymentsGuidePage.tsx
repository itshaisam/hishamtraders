import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { paymentsContent } from '../data/paymentsContent';

export default function PaymentsGuidePage() {
  return (
    <GuideLayout section="payments" content={paymentsContent}>
      <ContentRenderer content={paymentsContent} />
    </GuideLayout>
  );
}
