import { BookOpen, LogIn, Menu, Users, Key } from 'lucide-react';
import { GuideContent } from '../types';

export const gettingStartedContent: GuideContent = {
  title: 'Getting Started',
  icon: BookOpen,
  introduction:
    'Welcome to Hisham Traders ERP. This guide walks you through logging in, navigating the application, understanding user roles, and managing your account. Follow these steps to get up and running quickly.',
  tableOfContents: [
    { id: 'login-flow', label: 'Login Flow', level: 1 },
    { id: 'login-steps', label: 'Step-by-Step Login', level: 2 },
    { id: 'login-troubleshooting', label: 'Troubleshooting', level: 2 },
    { id: 'sidebar-navigation', label: 'Sidebar Navigation', level: 1 },
    { id: 'sidebar-menu-groups', label: 'Menu Groups', level: 2 },
    { id: 'sidebar-tips', label: 'Navigation Tips', level: 2 },
    { id: 'user-roles', label: 'User Roles', level: 1 },
    { id: 'role-details', label: 'Role Access Details', level: 2 },
    { id: 'password-change', label: 'Password Change', level: 1 },
  ],
  sections: [
    // ── Section 1: Login Flow ──────────────────────────────────────────
    {
      id: 'login-flow',
      title: 'Login Flow',
      icon: LogIn,
      content: [
        {
          type: 'paragraph',
          text: 'The login page is the entry point to the Hisham Traders ERP system. Every user must authenticate with their email address and password before accessing any part of the application. Once authenticated, a session token is stored securely in your browser so you remain logged in until you explicitly sign out or the session expires.',
        },
        {
          type: 'flow',
          steps: [
            'Open browser and navigate to the application URL',
            'Enter your email address',
            'Enter your password',
            'Click the Login button',
            'System validates credentials',
            'JWT token stored in browser',
            'Redirected to Dashboard',
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Session Persistence',
          text: 'Your session is stored locally in the browser using a secure state management layer. If you close the browser tab, you will remain logged in when you return. To fully log out, use the Logout option in the sidebar or profile menu.',
        },
      ],
      subSections: [
        {
          id: 'login-steps',
          title: 'Step-by-Step Login',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to the Login Page',
                  description:
                    'Open your web browser and go to the application URL provided by your administrator. If you are not already logged in, you will be automatically redirected to the login page.',
                },
                {
                  title: 'Enter Your Email Address',
                  description:
                    'Type your registered email address in the Email field. This is the email that was set up for you by the system administrator. Make sure there are no extra spaces before or after the email.',
                },
                {
                  title: 'Enter Your Password',
                  description:
                    'Type your password in the Password field. Passwords are case-sensitive, so ensure Caps Lock is not accidentally enabled. If this is your first time logging in, use the temporary password provided by your administrator.',
                },
                {
                  title: 'Click Login',
                  description:
                    'Press the Login button to submit your credentials. The system will validate your email and password against the database. If the credentials are correct, you will be redirected to the main Dashboard.',
                },
                {
                  title: 'Access the Dashboard',
                  description:
                    'After a successful login, you will land on the Dashboard page. The dashboard displays key performance indicators, recent activity, and quick-action buttons tailored to your role. From here, use the sidebar to navigate to other modules.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'First-Time Login',
              text: 'If this is your first time logging into the system, it is strongly recommended that you change your temporary password immediately. Navigate to the profile section and use the Change Password feature described in the Password Change section below.',
            },
          ],
        },
        {
          id: 'login-troubleshooting',
          title: 'Troubleshooting',
          content: [
            {
              type: 'paragraph',
              text: 'If you encounter issues during login, review the following common problems and solutions.',
            },
            {
              type: 'keyValue',
              pairs: [
                {
                  key: 'Invalid credentials error',
                  value:
                    'Double-check your email and password. Ensure Caps Lock is off. If you have forgotten your password, contact your system administrator to have it reset.',
                },
                {
                  key: 'Page not loading',
                  value:
                    'Verify that the application server is running and that you are using the correct URL. Try clearing your browser cache or using an incognito/private window.',
                },
                {
                  key: 'Session expired',
                  value:
                    'JWT tokens have a limited lifespan. If you are redirected to the login page unexpectedly, simply log in again. Your previous work is not lost if you were on a form page, though unsaved changes may need to be re-entered.',
                },
                {
                  key: 'Account locked or disabled',
                  value:
                    'If your account has been deactivated by an administrator, you will not be able to log in. Contact your system administrator to restore access.',
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Section 2: Sidebar Navigation ──────────────────────────────────
    {
      id: 'sidebar-navigation',
      title: 'Sidebar Navigation',
      icon: Menu,
      content: [
        {
          type: 'paragraph',
          text: 'The sidebar is the primary navigation element of the application. It appears on the left side of the screen and organizes all available modules into collapsible menu groups. Each menu group can be expanded to reveal its child pages, or collapsed to save screen space. The sidebar can also be fully collapsed into an icon-only mode for a wider content area.',
        },
        {
          type: 'paragraph',
          text: 'The items visible in the sidebar depend on your assigned user role. For example, a Sales Officer will see the Sales and Clients sections but will not see Accounting or Administration modules. This role-based visibility ensures that each user only sees the features relevant to their responsibilities.',
        },
      ],
      subSections: [
        {
          id: 'sidebar-menu-groups',
          title: 'Menu Groups',
          content: [
            {
              type: 'paragraph',
              text: 'The sidebar contains the following menu groups and their respective pages. Each group can be expanded or collapsed by clicking its header.',
            },
            {
              type: 'keyValue',
              pairs: [
                {
                  key: 'Dashboard',
                  value: 'The main overview page with KPI cards, alerts, and quick actions.',
                },
                {
                  key: 'Inventory',
                  value:
                    'Products, Stock Levels, Warehouses, Bin Locations, Bin Transfers, Stock Adjustments, Stock Movements, Expiry Alerts, Gate Passes, Stock Transfers, Stock Counts.',
                },
                {
                  key: 'Purchases',
                  value: 'Suppliers, Purchase Orders.',
                },
                {
                  key: 'Sales',
                  value: 'Clients, Invoices, Returns/Credit Notes.',
                },
                {
                  key: 'Payments',
                  value: 'Client Payments, Supplier Payments, Payment History, Expenses.',
                },
                {
                  key: 'Reports',
                  value: 'Reports Center \u2014 a unified hub for all available reports.',
                },
                {
                  key: 'Accounting',
                  value:
                    'Chart of Accounts, Journal Entries, Trial Balance, Balance Sheet, General Ledger, Bank Accounts, Petty Cash, Bank Reconciliation, Month-End Closing.',
                },
                {
                  key: 'Administration',
                  value: 'Audit Trail, Tax Settings, System Settings.',
                },
              ],
            },
          ],
        },
        {
          id: 'sidebar-tips',
          title: 'Navigation Tips',
          content: [
            {
              type: 'callout',
              variant: 'tip',
              title: 'Bookmark Frequently Used Pages',
              text: 'You can bookmark any page in your browser for quick access. Since the application uses clean URL paths (e.g., /inventory/products, /sales/invoices), bookmarks will take you directly to the desired page after login. This is especially useful for pages you visit multiple times a day, such as the Invoices list or Stock Levels page.',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Collapse the Sidebar',
                  description:
                    'Click the collapse toggle at the top or bottom of the sidebar to switch between full and icon-only mode. In icon-only mode, you can hover over icons to see tooltips with the menu names.',
                },
                {
                  title: 'Expand a Menu Group',
                  description:
                    'Click on any menu group header (e.g., Inventory, Sales) to expand it and reveal its child pages. Click the header again to collapse the group.',
                },
                {
                  title: 'Navigate to a Page',
                  description:
                    'Click on any child page link within an expanded menu group. The active page is highlighted in the sidebar so you always know where you are.',
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Section 3: User Roles ──────────────────────────────────────────
    {
      id: 'user-roles',
      title: 'User Roles',
      icon: Users,
      content: [
        {
          type: 'paragraph',
          text: 'The ERP system uses role-based access control (RBAC) to determine what each user can see and do. Every user is assigned exactly one role, and that role governs which sidebar items are visible, which API endpoints are accessible, and which actions can be performed. Roles are assigned by the system administrator during user creation or via the user management interface.',
        },
        {
          type: 'roles',
          roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT'],
        },
        {
          type: 'paragraph',
          text: 'Below is a summary of each role and the areas of the application they can access.',
        },
        {
          type: 'keyValue',
          pairs: [
            {
              key: 'ADMIN',
              value:
                'Full access to every module in the system. Can manage users, configure system settings, view audit trails, and perform all operations across inventory, sales, purchases, payments, accounting, and reports.',
            },
            {
              key: 'WAREHOUSE_MANAGER',
              value:
                'Access to Inventory modules including Products, Stock Levels, Warehouses, Bin Locations, Bin Transfers, Stock Adjustments, Stock Movements, Expiry Alerts, Gate Passes, Stock Transfers, and Stock Counts. Can manage warehouse operations and oversee all stock-related activities.',
            },
            {
              key: 'SALES_OFFICER',
              value:
                'Access to Sales modules including Clients, Invoices, and Returns/Credit Notes. Can create and manage client records, generate invoices, process sales returns, and view sales-related reports.',
            },
            {
              key: 'ACCOUNTANT',
              value:
                'Access to Accounting modules including Chart of Accounts, Journal Entries, Trial Balance, Balance Sheet, General Ledger, Bank Accounts, Petty Cash, Bank Reconciliation, and Month-End Closing. Also has access to Payments (Client Payments, Supplier Payments, Payment History, Expenses) and the Reports Center.',
            },
            {
              key: 'RECOVERY_AGENT',
              value:
                'Access to Client Payments and receivables-related features. Focused on collecting outstanding payments from clients, viewing payment history, and tracking overdue invoices.',
            },
          ],
        },
      ],
      subSections: [
        {
          id: 'role-details',
          title: 'Role Access Details',
          content: [
            {
              type: 'paragraph',
              text: 'The following table provides a detailed breakdown of which major sidebar groups are accessible to each role. The ADMIN role has unrestricted access and is not listed separately.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'Dashboard',
                  fieldType: 'Page',
                  required: true,
                  description: 'Visible to all roles. Content on the dashboard may vary based on role.',
                },
                {
                  name: 'Inventory',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN and WAREHOUSE_MANAGER.',
                },
                {
                  name: 'Purchases',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN and WAREHOUSE_MANAGER.',
                },
                {
                  name: 'Sales',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN and SALES_OFFICER.',
                },
                {
                  name: 'Payments',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN, ACCOUNTANT, and RECOVERY_AGENT (client payments only).',
                },
                {
                  name: 'Reports',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN and ACCOUNTANT.',
                },
                {
                  name: 'Accounting',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN and ACCOUNTANT.',
                },
                {
                  name: 'Administration',
                  fieldType: 'Module',
                  required: false,
                  description: 'Accessible by ADMIN only. Includes Audit Trail, Tax Settings, and System Settings.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Role Restrictions',
              text: 'Attempting to access a page outside your role permissions will result in an "Access Denied" message. If you believe you need access to additional modules, contact your system administrator to have your role updated.',
            },
          ],
        },
      ],
    },

    // ── Section 4: Password Change ─────────────────────────────────────
    {
      id: 'password-change',
      title: 'Password Change',
      icon: Key,
      content: [
        {
          type: 'paragraph',
          text: 'All users can change their password at any time through the profile section. It is recommended to change your password periodically and especially after your first login if a temporary password was issued. Choose a strong password that combines uppercase and lowercase letters, numbers, and special characters.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Open the Profile Section',
              description:
                'Click on your user name or avatar in the top-right corner of the application, or locate the profile option in the sidebar. This will open your profile settings.',
            },
            {
              title: 'Navigate to Change Password',
              description:
                'Within the profile section, find and click the "Change Password" option. This will display the password change form.',
            },
            {
              title: 'Enter Your Current Password',
              description:
                'Type your current (existing) password in the designated field. This is required to verify your identity before allowing a password change.',
            },
            {
              title: 'Enter Your New Password',
              description:
                'Type your desired new password. Ensure it is sufficiently strong. Avoid using easily guessable information such as your name, email, or common words.',
            },
            {
              title: 'Confirm Your New Password',
              description:
                'Re-type the new password in the confirmation field. This must match the new password exactly.',
            },
            {
              title: 'Submit the Change',
              description:
                'Click the "Update Password" or "Save" button to apply the change. If successful, you will see a confirmation message. Your existing session remains active, so you do not need to log in again immediately.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Password Best Practices',
          text: 'Use a password that is at least 8 characters long and includes a mix of uppercase letters, lowercase letters, numbers, and special characters. Avoid reusing passwords from other systems. If you suspect your account has been compromised, change your password immediately and notify your administrator.',
        },
      ],
    },
  ],
};
