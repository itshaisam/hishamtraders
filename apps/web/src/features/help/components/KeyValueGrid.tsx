interface KeyValueGridProps {
  pairs: { key: string; value: string }[];
}

export default function KeyValueGrid({ pairs }: KeyValueGridProps) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
      {pairs.map((pair) => (
        <div key={pair.key} className="flex flex-col">
          <dt className="text-sm font-medium text-gray-500">{pair.key}</dt>
          <dd className="text-sm text-gray-900 mt-0.5">{pair.value}</dd>
        </div>
      ))}
    </dl>
  );
}
