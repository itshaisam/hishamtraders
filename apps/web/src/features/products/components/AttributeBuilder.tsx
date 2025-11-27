import { Plus, X } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface AttributeRow {
  key: string;
  value: string;
}

interface AttributeBuilderProps {
  attributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
  error?: string;
}

export function AttributeBuilder({ attributes, onChange, error }: AttributeBuilderProps) {
  const rows: AttributeRow[] = Object.entries(attributes).map(([key, value]) => ({
    key,
    value,
  }));

  const handleAddRow = () => {
    const newKey = `attribute${rows.length + 1}`;
    onChange({ ...attributes, [newKey]: '' });
  };

  const handleRemoveRow = (keyToRemove: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[keyToRemove];
    onChange(newAttributes);
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;

    const newAttributes = { ...attributes };
    const value = newAttributes[oldKey];
    delete newAttributes[oldKey];
    newAttributes[newKey] = value;
    onChange(newAttributes);
  };

  const handleValueChange = (key: string, value: string) => {
    onChange({ ...attributes, [key]: value });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Attributes <span className="text-red-500">*</span>
      </label>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="Attribute name (e.g., Color)"
              value={row.key}
              onChange={(e) => handleKeyChange(row.key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Value (e.g., Chrome)"
              value={row.value}
              onChange={(e) => handleValueChange(row.key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveRow(row.key)}
              disabled={rows.length === 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={handleAddRow}>
        <Plus className="h-4 w-4 mr-1" />
        Add Attribute
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        Define variant attributes like Color, Size, Finish, etc. At least one attribute is required.
      </p>
    </div>
  );
}
