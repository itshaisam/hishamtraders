import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { accountingContent } from '../data/accountingContent';

export default function AccountingGuidePage() {
  return (
    <GuideLayout section="accounting" content={accountingContent}>
      <ContentRenderer content={accountingContent} />
    </GuideLayout>
  );
}
