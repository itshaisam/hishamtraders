import {
  Calculator,
  TreePine,
  BookOpen,
  Scale,
  PieChart,
  ScrollText,
  Landmark,
  Coins,
  ArrowLeftRight,
  Lock,
} from 'lucide-react';
import { GuideContent } from '../types';

export const accountingContent: GuideContent = {
  title: 'Accounting',
  icon: Calculator,
  introduction:
    'The Accounting module implements full double-entry bookkeeping for Hisham Traders. It covers the chart of accounts, journal entries, financial reports (trial balance, balance sheet, general ledger), bank account management, petty cash tracking, bank reconciliation, and month-end closing. All monetary transactions ultimately flow through this module.',
  tableOfContents: [
    { id: 'chart-of-accounts', label: 'Chart of Accounts', level: 1 },
    { id: 'coa-account-types', label: 'Account Types', level: 2 },
    { id: 'coa-fields', label: 'Account Fields', level: 2 },
    { id: 'coa-tree-view', label: 'Tree View', level: 2 },
    { id: 'journal-entries', label: 'Journal Entries', level: 1 },
    { id: 'je-lifecycle', label: 'Entry Lifecycle', level: 2 },
    { id: 'je-line-items', label: 'Debit & Credit Lines', level: 2 },
    { id: 'je-double-entry-rules', label: 'Double-Entry Rules', level: 2 },
    { id: 'trial-balance', label: 'Trial Balance', level: 1 },
    { id: 'balance-sheet', label: 'Balance Sheet', level: 1 },
    { id: 'general-ledger', label: 'General Ledger', level: 1 },
    { id: 'bank-accounts', label: 'Bank Accounts', level: 1 },
    { id: 'petty-cash', label: 'Petty Cash', level: 1 },
    { id: 'bank-reconciliation', label: 'Bank Reconciliation', level: 1 },
    { id: 'reconciliation-flow', label: 'Reconciliation Flow', level: 2 },
    { id: 'month-end-closing', label: 'Month-End Closing', level: 1 },
    { id: 'closing-steps', label: 'Closing Steps', level: 2 },
  ],
  sections: [
    // ── 1. Chart of Accounts ─────────────────────────────────────────
    {
      id: 'chart-of-accounts',
      title: 'Chart of Accounts',
      icon: TreePine,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The Chart of Accounts (COA) is the foundation of the accounting system. It organises every account into a hierarchical tree where parent accounts group related child accounts. All journal entries, reports, and financial statements reference accounts defined here.',
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Foundation of All Accounting',
          text: 'Every financial transaction in the system is recorded against accounts defined in the Chart of Accounts. Ensure the chart is set up correctly before entering any journal entries or transactions.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
      subSections: [
        {
          id: 'coa-account-types',
          title: 'Account Types',
          content: [
            {
              type: 'paragraph',
              text: 'Each account belongs to one of five fundamental types. These types determine how the account appears on financial reports and whether its normal balance is a debit or credit.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Asset', value: 'Resources owned by the business (e.g., Cash, Inventory, Receivables). Normal balance: Debit.' },
                { key: 'Liability', value: 'Obligations owed to others (e.g., Accounts Payable, Loans). Normal balance: Credit.' },
                { key: 'Equity', value: 'Owner\'s stake in the business (e.g., Capital, Retained Earnings). Normal balance: Credit.' },
                { key: 'Revenue', value: 'Income earned from business operations (e.g., Sales Revenue). Normal balance: Credit.' },
                { key: 'Expense', value: 'Costs incurred in running the business (e.g., Rent, Salaries, Utilities). Normal balance: Debit.' },
              ],
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Accounting Equation',
              text: 'Assets = Liabilities + Equity. Revenue increases equity while expenses decrease it. This equation must always hold true.',
            },
          ],
        },
        {
          id: 'coa-fields',
          title: 'Account Fields',
          content: [
            {
              type: 'paragraph',
              text: 'Each account in the chart is defined by the following fields.',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'Code', fieldType: 'Text', required: true, description: 'A unique numeric code that identifies the account (e.g., 1001 for Cash in Hand).' },
                { name: 'Name', fieldType: 'Text', required: true, description: 'A descriptive name for the account (e.g., "Cash in Hand", "Accounts Receivable").' },
                { name: 'Type', fieldType: 'Select', required: true, description: 'The account type: Asset, Liability, Equity, Revenue, or Expense.' },
                { name: 'Parent Account', fieldType: 'Select', required: false, description: 'Optional parent account to create a hierarchy. Leave blank for top-level accounts.' },
                { name: 'Is Active', fieldType: 'Checkbox', required: false, description: 'Whether the account is available for use in journal entries. Inactive accounts are hidden from dropdowns but retained for historical data.' },
              ],
            },
          ],
        },
        {
          id: 'coa-tree-view',
          title: 'Tree View',
          content: [
            {
              type: 'paragraph',
              text: 'The Chart of Accounts is displayed as a collapsible tree. Parent accounts can be expanded to reveal their child accounts. This hierarchical view makes it easy to understand the structure of the business\'s finances at a glance.',
            },
            {
              type: 'steps',
              steps: [
                { title: 'Navigate to Chart of Accounts', description: 'Open the Accounting section in the sidebar and click "Chart of Accounts".' },
                { title: 'Browse the Tree', description: 'Click the expand/collapse arrows next to parent accounts to view child accounts underneath.' },
                { title: 'Create a New Account', description: 'Click the "Add Account" button. Fill in the code, name, type, and optionally select a parent account.' },
                { title: 'Edit an Account', description: 'Click on any account row to open the edit form. Update the fields as needed and save.' },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Naming Convention',
              text: 'Use a consistent numbering scheme for account codes. For example: 1xxx for Assets, 2xxx for Liabilities, 3xxx for Equity, 4xxx for Revenue, 5xxx for Expenses. This keeps the chart organised and makes it easy to locate accounts.',
            },
          ],
        },
      ],
    },

    // ── 2. Journal Entries ───────────────────────────────────────────
    {
      id: 'journal-entries',
      title: 'Journal Entries',
      icon: BookOpen,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Journal entries are the core mechanism for recording financial transactions using double-entry bookkeeping. Every entry contains one or more debit lines and one or more credit lines. The total debits must always equal the total credits.',
        },
        {
          type: 'flow',
          steps: ['Create Draft', 'Add Debit/Credit Lines', 'Verify Balance', 'Post Entry'],
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
      subSections: [
        {
          id: 'je-lifecycle',
          title: 'Entry Lifecycle',
          content: [
            {
              type: 'paragraph',
              text: 'Journal entries follow a two-stage lifecycle. They begin as drafts, which can be freely edited, and are then posted to become permanent records.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'DRAFT', value: 'The entry has been created but not yet finalised. Lines can be added, removed, or modified. The entry does not affect account balances.' },
                { key: 'POSTED', value: 'The entry has been finalised and committed to the ledger. It now affects account balances. Posted entries cannot be edited or deleted.' },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Posted Entries Are Permanent',
              text: 'Once a journal entry is posted, it cannot be edited or deleted. If a correction is needed, you must create a new reversing journal entry. Always review entries carefully before posting.',
            },
          ],
        },
        {
          id: 'je-line-items',
          title: 'Debit & Credit Lines',
          content: [
            {
              type: 'paragraph',
              text: 'Each journal entry contains multiple line items. Every line specifies an account and either a debit amount or a credit amount (never both on the same line).',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'Account', fieldType: 'Select', required: true, description: 'The Chart of Accounts entry this line posts to.' },
                { name: 'Debit Amount', fieldType: 'Currency', required: false, description: 'The debit amount for this line. Leave blank or zero if the line is a credit.' },
                { name: 'Credit Amount', fieldType: 'Currency', required: false, description: 'The credit amount for this line. Leave blank or zero if the line is a debit.' },
              ],
            },
            {
              type: 'steps',
              steps: [
                { title: 'Open New Journal Entry', description: 'Navigate to Journal Entries and click "New Entry". Enter the date and a description for the transaction.' },
                { title: 'Add Lines', description: 'For each affected account, add a line with either a debit or credit amount. At minimum, you need one debit line and one credit line.' },
                { title: 'Verify Totals', description: 'The form displays running totals for debits and credits. Ensure they are equal before proceeding.' },
                { title: 'Save as Draft', description: 'Click "Save" to store the entry as a draft. You can return later to edit it.' },
                { title: 'Post the Entry', description: 'Once verified, click "Post" to finalise the entry. This action is irreversible.' },
              ],
            },
          ],
        },
        {
          id: 'je-double-entry-rules',
          title: 'Double-Entry Rules',
          content: [
            {
              type: 'paragraph',
              text: 'Double-entry bookkeeping requires that every transaction is recorded in at least two accounts: one debited and one credited. This ensures the accounting equation (Assets = Liabilities + Equity) always remains in balance.',
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Fundamental Rule',
              text: 'Total Debits must always equal Total Credits in every journal entry. The system will not allow you to post an unbalanced entry.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Debit increases', value: 'Asset accounts and Expense accounts.' },
                { key: 'Debit decreases', value: 'Liability accounts, Equity accounts, and Revenue accounts.' },
                { key: 'Credit increases', value: 'Liability accounts, Equity accounts, and Revenue accounts.' },
                { key: 'Credit decreases', value: 'Asset accounts and Expense accounts.' },
              ],
            },
          ],
        },
      ],
    },

    // ── 3. Trial Balance ─────────────────────────────────────────────
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      icon: Scale,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The Trial Balance report lists all accounts in the Chart of Accounts along with their debit and credit balances for a specified date range. It serves as a quick check that the books are in balance — the sum of all debit balances must equal the sum of all credit balances.',
        },
        {
          type: 'fieldTable',
          fields: [
            { name: 'From Date', fieldType: 'Date', required: true, description: 'Start of the reporting period.' },
            { name: 'To Date', fieldType: 'Date', required: true, description: 'End of the reporting period.' },
          ],
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Debit Column', value: 'Shows the total debit balance for each account within the selected date range.' },
            { key: 'Credit Column', value: 'Shows the total credit balance for each account within the selected date range.' },
            { key: 'Totals Row', value: 'The bottom row displays the sum of all debits and all credits. These two figures must be equal.' },
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Balanced Totals',
          text: 'If the total debits do not equal total credits, there is an error in the journal entries. Review recent entries for mistakes before proceeding with other financial reports.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
    },

    // ── 4. Balance Sheet ─────────────────────────────────────────────
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      icon: PieChart,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The Balance Sheet shows the financial position of the business at a specific point in time. It presents the fundamental accounting equation: Assets = Liabilities + Equity. Unlike the Trial Balance, which shows period activity, the Balance Sheet reflects cumulative balances.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Assets', value: 'Everything the business owns — cash, receivables, inventory, equipment, and other resources.' },
            { key: 'Liabilities', value: 'Everything the business owes — accounts payable, loans, accrued expenses.' },
            { key: 'Equity', value: 'The owner\'s residual interest in the business after subtracting liabilities from assets. Includes capital and retained earnings.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Point-in-Time Report',
          text: 'The Balance Sheet is always generated as of a specific date (e.g., "as of 31 Dec 2025"). It does not show a range of activity — it shows accumulated balances up to that date.',
        },
        {
          type: 'fieldTable',
          fields: [
            { name: 'As of Date', fieldType: 'Date', required: true, description: 'The date for which the balance sheet is generated. All transactions up to and including this date are included.' },
          ],
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
    },

    // ── 5. General Ledger ────────────────────────────────────────────
    {
      id: 'general-ledger',
      title: 'General Ledger',
      icon: ScrollText,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The General Ledger provides a detailed transaction history for each account. It lists every journal entry line that affects the selected account within a date range, along with a running balance that updates after each transaction.',
        },
        {
          type: 'fieldTable',
          fields: [
            { name: 'Account', fieldType: 'Select', required: true, description: 'The specific account to view the ledger for.' },
            { name: 'From Date', fieldType: 'Date', required: true, description: 'Start of the reporting period.' },
            { name: 'To Date', fieldType: 'Date', required: true, description: 'End of the reporting period.' },
          ],
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Date', value: 'The date of the journal entry.' },
            { key: 'Description', value: 'The journal entry description or reference.' },
            { key: 'Debit', value: 'The debit amount posted to this account in the transaction.' },
            { key: 'Credit', value: 'The credit amount posted to this account in the transaction.' },
            { key: 'Running Balance', value: 'The cumulative balance of the account after each transaction, starting from the opening balance at the beginning of the selected period.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Drilling Down',
          text: 'Use the General Ledger to investigate specific account activity. If the Trial Balance shows an unexpected balance for an account, open the General Ledger for that account to see every transaction that contributed to the balance.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
    },

    // ── 6. Bank Accounts ─────────────────────────────────────────────
    {
      id: 'bank-accounts',
      title: 'Bank Accounts',
      icon: Landmark,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The Bank Accounts section allows you to manage the business\'s bank accounts. Each bank account is linked to a corresponding account in the Chart of Accounts (typically an Asset account). This linkage ensures that bank transactions are automatically reflected in the general ledger.',
        },
        {
          type: 'fieldTable',
          fields: [
            { name: 'Bank Name', fieldType: 'Text', required: true, description: 'The name of the bank (e.g., "HBL", "UBL", "Meezan Bank").' },
            { name: 'Account Title', fieldType: 'Text', required: true, description: 'The title of the bank account as it appears on the bank statement.' },
            { name: 'Account Number', fieldType: 'Text', required: true, description: 'The bank account number.' },
            { name: 'GL Account', fieldType: 'Select', required: true, description: 'The linked General Ledger account from the Chart of Accounts.' },
            { name: 'Current Balance', fieldType: 'Currency', required: false, description: 'The current balance as per the system. Updated automatically as transactions are posted.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'GL Linkage',
          text: 'Always link each bank account to its corresponding GL account. This ensures that payments, receipts, and transfers recorded against the bank account flow through to the financial statements automatically.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
    },

    // ── 7. Petty Cash ────────────────────────────────────────────────
    {
      id: 'petty-cash',
      title: 'Petty Cash',
      icon: Coins,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Petty Cash tracks small, day-to-day cash expenses that are not processed through the bank. This includes items like office supplies, transport costs, tea expenses, and minor repairs. The system maintains a running balance of the petty cash fund.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Disbursement', value: 'A payment made from the petty cash fund. Each disbursement reduces the petty cash balance and is recorded against an expense account.' },
            { key: 'Replenishment', value: 'A top-up of the petty cash fund, typically by withdrawing cash from the bank. This increases the petty cash balance.' },
          ],
        },
        {
          type: 'steps',
          steps: [
            { title: 'Record a Disbursement', description: 'Navigate to Petty Cash and click "New Disbursement". Select the expense account, enter the amount, date, and description of the expense.' },
            { title: 'Record a Replenishment', description: 'Click "Replenish Fund". Enter the amount being added to petty cash and the source (usually a bank account withdrawal).' },
            { title: 'Review Transactions', description: 'The petty cash ledger shows all disbursements and replenishments with a running balance. Use date filters to narrow down the view.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Imprest System',
          text: 'Petty cash typically operates on an imprest system. A fixed fund amount is established, and replenishments restore the fund to its original level. The total of disbursements since the last replenishment should equal the replenishment amount.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
    },

    // ── 8. Bank Reconciliation ───────────────────────────────────────
    {
      id: 'bank-reconciliation',
      title: 'Bank Reconciliation',
      icon: ArrowLeftRight,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Bank Reconciliation is the process of matching transactions recorded in the system against those appearing on the bank statement. This ensures that the system balance agrees with the actual bank balance and helps identify discrepancies such as missing entries, bank charges, or errors.',
        },
        {
          type: 'flow',
          steps: [
            'Select Bank Account',
            'Import/Enter Statement',
            'Match Transactions',
            'Review Unmatched',
            'Complete Reconciliation',
          ],
        },
        {
          type: 'roles',
          roles: ['Admin', 'Accountant'],
        },
      ],
      subSections: [
        {
          id: 'reconciliation-flow',
          title: 'Reconciliation Flow',
          content: [
            {
              type: 'paragraph',
              text: 'Follow these steps to complete a bank reconciliation.',
            },
            {
              type: 'steps',
              steps: [
                { title: 'Select Bank Account', description: 'Choose the bank account you want to reconcile from the dropdown. The system displays the current book balance.' },
                { title: 'Enter Statement Details', description: 'Enter the bank statement ending date and ending balance as shown on the bank statement. You may import statement entries or enter them manually.' },
                { title: 'Match Transactions', description: 'The system presents system transactions and statement entries side by side. Match each statement entry to its corresponding system transaction. Auto-matching by amount and date is available.' },
                { title: 'Review Unmatched Items', description: 'Any transactions that could not be matched are flagged for review. These may include bank charges, interest credits, or entries missing from the system.' },
                { title: 'Create Adjusting Entries', description: 'For unmatched bank charges or interest, create journal entries directly from the reconciliation screen to bring the books up to date.' },
                { title: 'Complete Reconciliation', description: 'Once all items are matched or accounted for and the adjusted book balance equals the statement balance, mark the reconciliation as complete.' },
              ],
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Reconcile Regularly',
              text: 'Perform bank reconciliation at least once a month, ideally at month-end before closing the period. Regular reconciliation catches errors early and ensures financial reports are accurate.',
            },
          ],
        },
      ],
    },

    // ── 9. Month-End Closing ─────────────────────────────────────────
    {
      id: 'month-end-closing',
      title: 'Month-End Closing',
      icon: Lock,
      roles: ['Admin'],
      content: [
        {
          type: 'paragraph',
          text: 'Month-End Closing locks an accounting period so that no further journal entries can be posted to dates within that period. This preserves the integrity of financial reports and ensures that historical data is not accidentally modified.',
        },
        {
          type: 'flow',
          steps: [
            'Review Pending Entries',
            'Post All Drafts',
            'Run Trial Balance Check',
            'Close Period',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Irreversible Action',
          text: 'Closing a period is permanent and cannot be undone. Once a month is closed, no journal entries can be created or posted with dates in that period. Ensure all transactions have been recorded and reviewed before closing.',
        },
        {
          type: 'roles',
          roles: ['Admin'],
        },
      ],
      subSections: [
        {
          id: 'closing-steps',
          title: 'Closing Steps',
          content: [
            {
              type: 'paragraph',
              text: 'Complete the following checklist before closing an accounting period.',
            },
            {
              type: 'steps',
              steps: [
                { title: 'Review Pending Entries', description: 'Check for any journal entries still in DRAFT status for the period. These must either be posted or deleted before the period can be closed.' },
                { title: 'Post All Drafts', description: 'Review each draft entry for accuracy, then post them. All legitimate transactions for the period should be committed to the ledger.' },
                { title: 'Complete Bank Reconciliation', description: 'Ensure all bank accounts have been reconciled for the period. Any unrecorded bank charges or interest should be entered as journal entries.' },
                { title: 'Run Trial Balance Check', description: 'Generate a Trial Balance for the period. Verify that total debits equal total credits. Investigate and resolve any discrepancies.' },
                { title: 'Close the Period', description: 'Navigate to Month-End Closing, select the period, and click "Close Period". Confirm the action in the dialog. The period is now locked.' },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Best Practice',
              text: 'Close the previous month within the first week of the new month. This gives enough time to capture late-arriving invoices and adjustments while keeping the books current.',
            },
          ],
        },
      ],
    },
  ],
};
