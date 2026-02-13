import GuideLayout from '../components/GuideLayout';
import ContentRenderer from '../components/ContentRenderer';
import { inventoryContent } from '../data/inventoryContent';

export default function InventoryGuidePage() {
  return (
    <GuideLayout section="inventory" content={inventoryContent}>
      <ContentRenderer content={inventoryContent} />
    </GuideLayout>
  );
}
