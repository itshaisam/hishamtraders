import { Shield, ScrollText, Settings, Database } from 'lucide-react';
import { GuideContent } from '../types';

export const adminContent: GuideContent = {
  title: 'Administration',
  icon: Shield,
  introduction:
    'The Administration section covers system-level features available exclusively to Admin users. Here you can review the audit trail to track every action performed in the system, configure tax rates for invoicing, and manage key-value system settings that control application behaviour.',
  tableOfContents: [
    { id: 'audit-trail', label: 'Audit Trail', level: 1 },
    { id: 'audit-search-filters', label: 'Search & Filters', level: 2 },
    { id: 'audit-log-fields', label: 'Log Entry Fields', level: 2 },
    { id: 'tax-settings', label: 'Tax Settings', level: 1 },
    { id: 'system-settings', label: 'System Settings', level: 1 },
    { id: 'system-settings-fields', label: 'Setting Fields', level: 2 },
  ],
  sections: [
    {
      id: 'audit-trail',
      title: 'Audit Trail',
      icon: ScrollText,
      roles: ['Admin'],
      content: [
        {
          type: 'paragraph',
          text: 'The Audit Trail provides a chronological record of every significant action performed in the system. Each log entry captures who performed the action, what was changed, and when it happened. Use the audit trail to investigate discrepancies, verify user activity, and maintain accountability.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Troubleshooting with Audit Trail',
          text: 'When something looks wrong — an invoice was modified unexpectedly, a payment was deleted, or inventory numbers do not match — the audit trail is the first place to check. Filter by entity type and date range to quickly narrow down the relevant entries.',
        },
      ],
      subSections: [
        {
          id: 'audit-search-filters',
          title: 'Search & Filters',
          content: [
            {
              type: 'paragraph',
              text: 'The audit trail supports several filters that can be combined to narrow results. Use the search bar for free-text queries across log details, and apply the dropdown filters for structured searches.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'User',
                  fieldType: 'Dropdown',
                  required: false,
                  description: 'Filter logs by the user who performed the action.',
                },
                {
                  name: 'Action Type',
                  fieldType: 'Dropdown',
                  required: false,
                  description: 'Filter by action: CREATE, UPDATE, DELETE, VIEW, LOGIN, or LOGOUT.',
                },
                {
                  name: 'Entity Type',
                  fieldType: 'Dropdown',
                  required: false,
                  description: 'Filter by the type of entity affected (e.g. Invoice, Payment, Product, Inventory).',
                },
                {
                  name: 'Date Range',
                  fieldType: 'Date inputs',
                  required: false,
                  description: 'Restrict results to a start and end date range.',
                },
              ],
            },
          ],
        },
        {
          id: 'audit-log-fields',
          title: 'Log Entry Fields',
          content: [
            {
              type: 'paragraph',
              text: 'Each audit log entry contains the following information displayed in the results table.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'Timestamp',
                  fieldType: 'DateTime',
                  required: true,
                  description: 'Exact date and time the action was recorded.',
                },
                {
                  name: 'User',
                  fieldType: 'Text',
                  required: true,
                  description: 'Name of the user who performed the action.',
                },
                {
                  name: 'Action',
                  fieldType: 'Enum',
                  required: true,
                  description: 'The type of action: CREATE, UPDATE, DELETE, VIEW, LOGIN, or LOGOUT.',
                },
                {
                  name: 'Entity Type',
                  fieldType: 'Text',
                  required: true,
                  description: 'The type of record affected (e.g. Invoice, Payment, Product).',
                },
                {
                  name: 'Entity ID',
                  fieldType: 'Text',
                  required: true,
                  description: 'The unique identifier of the affected record.',
                },
                {
                  name: 'Details / Notes',
                  fieldType: 'Text',
                  required: false,
                  description: 'Additional context about the action, such as which fields were changed.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tax-settings',
      title: 'Tax Settings',
      icon: Settings,
      roles: ['Admin'],
      content: [
        {
          type: 'paragraph',
          text: 'Tax Settings allow you to configure the tax rates applied to invoices. Set the default tax rate percentage that will be pre-filled when creating new invoices. Individual invoices can still override this value at creation time.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Navigate to Tax Settings',
              description: 'Go to the Administration section and select Tax Settings from the menu.',
            },
            {
              title: 'Set the Default Tax Rate',
              description: 'Enter the tax rate as a percentage (e.g. 17 for 17%). This value will be used as the default on all new invoices.',
            },
            {
              title: 'Save Changes',
              description: 'Click Save to apply the new rate. Existing invoices are not affected — only future invoices will use the updated default.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Existing Invoices',
          text: 'Changing the default tax rate does not retroactively update previously created invoices. Only new invoices created after the change will use the updated rate.',
        },
      ],
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      icon: Database,
      roles: ['Admin'],
      content: [
        {
          type: 'paragraph',
          text: 'System Settings are key-value pairs stored in the SystemSetting table that control various application behaviours. Settings are organised by category for easier management. Only Admin users can view and modify these values.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Key', value: 'A unique identifier for the setting (e.g. default_tax_rate, company_name).' },
            { key: 'Value', value: 'The current value of the setting, stored as a string.' },
            { key: 'Data Type', value: 'The expected data type: STRING, NUMBER, BOOLEAN, or JSON.' },
            { key: 'Label', value: 'A human-readable name displayed in the settings interface.' },
            { key: 'Category', value: 'Groups related settings together (e.g. General, Finance, Inventory).' },
          ],
        },
      ],
      subSections: [
        {
          id: 'system-settings-fields',
          title: 'Setting Fields',
          content: [
            {
              type: 'paragraph',
              text: 'Each system setting record contains the following fields.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'key',
                  fieldType: 'String',
                  required: true,
                  description: 'Unique identifier used internally by the application to look up the setting.',
                },
                {
                  name: 'value',
                  fieldType: 'String',
                  required: true,
                  description: 'The stored value. Interpreted according to the dataType field.',
                },
                {
                  name: 'dataType',
                  fieldType: 'Enum',
                  required: true,
                  description: 'Specifies how the value should be parsed: STRING, NUMBER, BOOLEAN, or JSON.',
                },
                {
                  name: 'label',
                  fieldType: 'String',
                  required: true,
                  description: 'Human-readable display name shown in the admin interface.',
                },
                {
                  name: 'category',
                  fieldType: 'String',
                  required: true,
                  description: 'Logical grouping for the setting (e.g. General, Finance, Inventory).',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Handle with Care',
              text: 'Changing system settings can affect application behaviour across all users. Double-check the value and data type before saving. If unsure about a setting, consult the development team.',
            },
          ],
        },
      ],
    },
  ],
};
