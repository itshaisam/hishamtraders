interface GuideSubSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function GuideSubSection({ id, title, children }: GuideSubSectionProps) {
  return (
    <div id={id} className="scroll-mt-24 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3 pl-1">
        {children}
      </div>
    </div>
  );
}
