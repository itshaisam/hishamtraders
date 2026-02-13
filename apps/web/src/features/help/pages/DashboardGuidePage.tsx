import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { dashboardContent } from '../data/dashboardContent';

export default function DashboardGuidePage() {
  return (
    <GuideLayout section="dashboard" content={dashboardContent}>
      <ContentRenderer content={dashboardContent} />
    </GuideLayout>
  );
}
