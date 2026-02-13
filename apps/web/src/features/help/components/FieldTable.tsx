interface Field {
  name: string;
  fieldType: string;
  required: boolean;
  description: string;
}

interface FieldTableProps {
  fields: Field[];
}

export default function FieldTable({ fields }: FieldTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {fields.map((field) => (
            <tr key={field.name}>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">{field.name}</td>
              <td className="px-4 py-2 text-sm text-gray-600 font-mono">{field.fieldType}</td>
              <td className="px-4 py-2 text-sm">
                {field.required ? (
                  <span className="text-red-600 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
