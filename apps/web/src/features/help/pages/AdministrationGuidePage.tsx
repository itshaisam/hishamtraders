import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { adminContent } from '../data/adminContent';

export default function AdministrationGuidePage() {
  return (
    <GuideLayout section="administration" content={adminContent}>
      <ContentRenderer content={adminContent} />
    </GuideLayout>
  );
}
