interface Step {
  title: string;
  description: string;
}

interface StepListProps {
  steps: Step[];
}

export default function StepList({ steps }: StepListProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="w-0.5 h-full bg-blue-200 min-h-[24px]" />
            )}
          </div>
          <div className="pb-6">
            <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
