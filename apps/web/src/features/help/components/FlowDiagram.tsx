import { ChevronRight, ChevronDown } from 'lucide-react';

interface FlowDiagramProps {
  steps: string[];
}

export default function FlowDiagram({ steps }: FlowDiagramProps) {
  return (
    <>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              {step}
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile: vertical */}
      <div className="flex md:hidden flex-col items-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 text-center w-full">
              {step}
            </div>
            {index < steps.length - 1 && (
              <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
