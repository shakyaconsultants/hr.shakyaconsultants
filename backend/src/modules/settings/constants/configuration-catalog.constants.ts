import { SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';

export interface ConfigurationSettingDefinition {
  key: string;
  name: string;
  description: string;
  valueType: string;
  defaultValue: unknown;
  group: string;
  category?: string;
  validation?: Record<string, unknown>;
  encrypted?: boolean;
  isPublic?: boolean;
}

export interface ConfigurationSection {
  id: string;
  name: string;
  description: string;
  group: string;
}

export const CONFIGURATION_SECTIONS: ConfigurationSection[] = [
  { id: 'general', name: 'General', description: 'Core application settings', group: SETTING_GROUP.GENERAL },
  { id: 'company', name: 'Company', description: 'Company profile and locale', group: SETTING_GROUP.COMPANY },
  { id: 'branding', name: 'Branding', description: 'Logo, colors, and theme', group: SETTING_GROUP.BRANDING },
  { id: 'organization', name: 'Organization', description: 'Org structure defaults', group: SETTING_GROUP.ORGANIZATION },
  { id: 'attendance', name: 'Attendance', description: 'Attendance policies', group: SETTING_GROUP.ATTENDANCE },
  { id: 'leave', name: 'Leave', description: 'Leave management settings', group: SETTING_GROUP.LEAVE },
  { id: 'payroll', name: 'Payroll', description: 'Payroll configuration', group: SETTING_GROUP.PAYROLL },
  { id: 'recruitment', name: 'Recruitment', description: 'Hiring pipeline settings', group: SETTING_GROUP.RECRUITMENT },
  { id: 'projects', name: 'Projects', description: 'Project management settings', group: SETTING_GROUP.PROJECTS },
  { id: 'sales', name: 'Sales', description: 'CRM and sales settings', group: SETTING_GROUP.SALES },
  { id: 'communication', name: 'Communication', description: 'Messaging and announcements', group: SETTING_GROUP.COMMUNICATION },
  { id: 'notifications', name: 'Notifications', description: 'Notification preferences', group: SETTING_GROUP.NOTIFICATIONS },
  { id: 'email', name: 'Email', description: 'SMTP and email delivery', group: SETTING_GROUP.EMAIL },
  { id: 'storage', name: 'Storage', description: 'File storage and Cloudinary', group: SETTING_GROUP.STORAGE },
  { id: 'security', name: 'Security', description: 'Password policy and sessions', group: SETTING_GROUP.SECURITY },
  { id: 'integrations', name: 'Integrations', description: 'Third-party integrations', group: SETTING_GROUP.INTEGRATIONS },
  { id: 'feature_flags', name: 'Feature Flags', description: 'Enable or disable features', group: SETTING_GROUP.FEATURE_FLAGS },
  { id: 'reports', name: 'Reports', description: 'Reporting defaults', group: SETTING_GROUP.REPORTS },
  { id: 'analytics', name: 'Analytics', description: 'Analytics and tracking', group: SETTING_GROUP.ANALYTICS },
  { id: 'api', name: 'API', description: 'API access and rate limits', group: SETTING_GROUP.API },
  { id: 'system', name: 'System', description: 'System-level configuration', group: SETTING_GROUP.SYSTEM },
];

const def = (
  key: string,
  name: string,
  description: string,
  valueType: string,
  defaultValue: unknown,
  group: string,
  options?: Partial<Pick<ConfigurationSettingDefinition, 'category' | 'validation' | 'encrypted' | 'isPublic'>>,
): ConfigurationSettingDefinition => ({
  key,
  name,
  description,
  valueType,
  defaultValue,
  group,
  category: options?.category,
  validation: options?.validation,
  encrypted: options?.encrypted ?? false,
  isPublic: options?.isPublic ?? false,
});

export const CONFIGURATION_CATALOG: ConfigurationSettingDefinition[] = [
  // General
  def('general.app_name', 'Application Name', 'Display name for the ERP', SETTING_VALUE_TYPE.STRING, 'HR Shakya', SETTING_GROUP.GENERAL, { isPublic: true }),
  def('general.default_language', 'Default Language', 'Default locale code', SETTING_VALUE_TYPE.STRING, 'en', SETTING_GROUP.GENERAL, { isPublic: true }),
  def('general.maintenance_mode', 'Maintenance Mode', 'Restrict access during maintenance', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.GENERAL),

  // Company
  def('company.timezone', 'Timezone', 'Default company timezone', SETTING_VALUE_TYPE.STRING, 'Asia/Kolkata', SETTING_GROUP.COMPANY, { isPublic: true }),
  def('company.currency', 'Currency', 'Default currency code', SETTING_VALUE_TYPE.STRING, 'INR', SETTING_GROUP.COMPANY, { isPublic: true }),
  def('company.date_format', 'Date Format', 'Date display format', SETTING_VALUE_TYPE.STRING, 'DD/MM/YYYY', SETTING_GROUP.COMPANY, { isPublic: true }),
  def('company.time_format', 'Time Format', '12h or 24h time format', SETTING_VALUE_TYPE.STRING, '24h', SETTING_GROUP.COMPANY, { isPublic: true }),
  def('company.fiscal_year_start', 'Fiscal Year Start', 'Month fiscal year begins (1-12)', SETTING_VALUE_TYPE.NUMBER, 4, SETTING_GROUP.COMPANY),
  def('company.week_start', 'Week Start Day', 'First day of week (0=Sun)', SETTING_VALUE_TYPE.NUMBER, 1, SETTING_GROUP.COMPANY),

  // Branding
  def('branding.logo_url', 'Logo URL', 'Company logo URL', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.BRANDING, { isPublic: true }),
  def('branding.favicon_url', 'Favicon URL', 'Browser favicon URL', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.BRANDING, { isPublic: true }),
  def('branding.primary_color', 'Primary Color', 'Brand primary hex color', SETTING_VALUE_TYPE.STRING, '#2563eb', SETTING_GROUP.BRANDING, { isPublic: true }),
  def('branding.secondary_color', 'Secondary Color', 'Brand secondary hex color', SETTING_VALUE_TYPE.STRING, '#64748b', SETTING_GROUP.BRANDING, { isPublic: true }),
  def('branding.theme', 'Theme', 'Light or dark theme default', SETTING_VALUE_TYPE.STRING, 'light', SETTING_GROUP.BRANDING, { isPublic: true }),

  // Organization
  def('organization.default_employment_type', 'Default Employment Type', 'Default employment type code', SETTING_VALUE_TYPE.STRING, 'FULL_TIME', SETTING_GROUP.ORGANIZATION),
  def('organization.employee_number_prefix', 'Employee Number Prefix', 'Prefix for auto-generated employee numbers', SETTING_VALUE_TYPE.STRING, 'EMP', SETTING_GROUP.ORGANIZATION),
  def('organization.department_code_prefix', 'Department Code Prefix', 'Prefix for auto-generated department codes', SETTING_VALUE_TYPE.STRING, 'DEPT', SETTING_GROUP.ORGANIZATION),
  def('organization.designation_code_prefix', 'Designation Code Prefix', 'Prefix for auto-generated designation codes', SETTING_VALUE_TYPE.STRING, 'DESG', SETTING_GROUP.ORGANIZATION),
  def('organization.designation_department_required', 'Designation Department Required', 'Require department mapping on designations', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.ORGANIZATION),
  def('organization.require_branch', 'Require Branch', 'Branch required on employee profile', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.ORGANIZATION),
  def('organization.code_pad_length', 'Code Pad Length', 'Zero-pad length for auto-generated master data codes', SETTING_VALUE_TYPE.NUMBER, 4, SETTING_GROUP.ORGANIZATION),
  def('organization.code_include_year', 'Code Include Year', 'Include YY year segment in generated codes', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.ORGANIZATION),
  def('organization.code_include_month', 'Code Include Month', 'Include MM month segment in generated codes', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.ORGANIZATION),
  def('organization.branch_code_prefix', 'Branch Code Prefix', 'Prefix for auto-generated branch codes', SETTING_VALUE_TYPE.STRING, 'BR', SETTING_GROUP.ORGANIZATION),
  def('organization.job_role_code_prefix', 'Job Role Code Prefix', 'Prefix for auto-generated job role codes', SETTING_VALUE_TYPE.STRING, 'ROLE', SETTING_GROUP.ORGANIZATION),
  def('organization.office_location_code_prefix', 'Office Location Code Prefix', 'Prefix for auto-generated office location codes', SETTING_VALUE_TYPE.STRING, 'LOC', SETTING_GROUP.ORGANIZATION),
  def('organization.work_shift_code_prefix', 'Work Shift Code Prefix', 'Prefix for auto-generated work shift codes', SETTING_VALUE_TYPE.STRING, 'SHIFT', SETTING_GROUP.ORGANIZATION),
  def('organization.employment_type_code_prefix', 'Employment Type Code Prefix', 'Prefix for auto-generated employment type codes', SETTING_VALUE_TYPE.STRING, 'EMPT', SETTING_GROUP.ORGANIZATION),
  def('organization.salary_grade_code_prefix', 'Salary Grade Code Prefix', 'Prefix for auto-generated salary grade codes', SETTING_VALUE_TYPE.STRING, 'SG', SETTING_GROUP.ORGANIZATION),
  def('organization.leave_type_code_prefix', 'Leave Type Code Prefix', 'Prefix for auto-generated leave type codes', SETTING_VALUE_TYPE.STRING, 'LV', SETTING_GROUP.ORGANIZATION),
  def('organization.project_category_code_prefix', 'Project Category Code Prefix', 'Prefix for auto-generated project category codes', SETTING_VALUE_TYPE.STRING, 'PCAT', SETTING_GROUP.ORGANIZATION),
  def('organization.technology_code_prefix', 'Technology Code Prefix', 'Prefix for auto-generated technology codes', SETTING_VALUE_TYPE.STRING, 'TECH', SETTING_GROUP.ORGANIZATION),
  def('organization.skill_code_prefix', 'Skill Code Prefix', 'Prefix for auto-generated skill codes', SETTING_VALUE_TYPE.STRING, 'SKL', SETTING_GROUP.ORGANIZATION),

  // Attendance
  def('attendance.grace_minutes', 'Grace Minutes', 'Grace period before marking late', SETTING_VALUE_TYPE.NUMBER, 15, SETTING_GROUP.ATTENDANCE),
  def('attendance.late_threshold_minutes', 'Late Threshold', 'Minutes after which punch is late', SETTING_VALUE_TYPE.NUMBER, 15, SETTING_GROUP.ATTENDANCE),
  def('attendance.weekly_off_days', 'Weekly Off Days', 'Days off (0=Sun, 6=Sat)', SETTING_VALUE_TYPE.JSON, [0, 6], SETTING_GROUP.ATTENDANCE),
  def('attendance.geo_fence_enabled', 'Geo-fence Enabled', 'Require location for punch', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.ATTENDANCE),

  // Leave
  def('leave.carry_forward_enabled', 'Carry Forward', 'Allow leave balance carry forward', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.LEAVE),
  def('leave.max_carry_forward_days', 'Max Carry Forward Days', 'Maximum days to carry forward', SETTING_VALUE_TYPE.NUMBER, 10, SETTING_GROUP.LEAVE),
  def('leave.approval_required', 'Approval Required', 'Leave requests require approval', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.LEAVE),

  // Payroll
  def('payroll.pay_day', 'Pay Day', 'Day of month for salary disbursement', SETTING_VALUE_TYPE.NUMBER, 1, SETTING_GROUP.PAYROLL),
  def('payroll.pf_enabled', 'PF Enabled', 'Provident fund deduction enabled', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.PAYROLL),
  def('payroll.esi_enabled', 'ESI Enabled', 'ESI deduction enabled', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.PAYROLL),
  def('payroll.tax_regime', 'Tax Regime', 'Default tax regime', SETTING_VALUE_TYPE.STRING, 'new', SETTING_GROUP.PAYROLL),

  // Recruitment
  def('recruitment.auto_reject_days', 'Auto Reject Days', 'Days before stale candidates auto-reject', SETTING_VALUE_TYPE.NUMBER, 90, SETTING_GROUP.RECRUITMENT),
  def('recruitment.offer_expiry_days', 'Offer Expiry Days', 'Days before offer expires', SETTING_VALUE_TYPE.NUMBER, 7, SETTING_GROUP.RECRUITMENT),
  def('recruitment.resume_max_size_mb', 'Resume Max Size (MB)', 'Maximum resume upload size', SETTING_VALUE_TYPE.NUMBER, 5, SETTING_GROUP.RECRUITMENT),

  // Projects
  def('projects.default_sprint_duration', 'Default Sprint Duration', 'Sprint length in days', SETTING_VALUE_TYPE.NUMBER, 14, SETTING_GROUP.PROJECTS),
  def('projects.task_auto_assign', 'Task Auto Assign', 'Auto-assign tasks to project lead', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.PROJECTS),
  def('projects.time_tracking_enabled', 'Time Tracking', 'Enable work log time tracking', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.PROJECTS),

  // Sales
  def('sales.lead_auto_assign', 'Lead Auto Assign', 'Auto-assign new leads', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.SALES),
  def('sales.default_pipeline', 'Default Pipeline', 'Default sales pipeline slug', SETTING_VALUE_TYPE.STRING, 'default', SETTING_GROUP.SALES),
  def('sales.deal_currency', 'Deal Currency', 'Default deal currency', SETTING_VALUE_TYPE.STRING, 'INR', SETTING_GROUP.SALES),

  // Communication
  def('communication.announcement_expiry_days', 'Announcement Expiry', 'Default announcement expiry in days', SETTING_VALUE_TYPE.NUMBER, 30, SETTING_GROUP.COMMUNICATION),
  def('communication.allow_direct_messages', 'Direct Messages', 'Allow employee direct messaging', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.COMMUNICATION),

  // Notifications
  def('notifications.email_enabled', 'Email Notifications', 'Send email notifications', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.NOTIFICATIONS),
  def('notifications.push_enabled', 'Push Notifications', 'Send push notifications', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.NOTIFICATIONS),
  def('notifications.digest_frequency', 'Digest Frequency', 'Notification digest frequency', SETTING_VALUE_TYPE.STRING, 'daily', SETTING_GROUP.NOTIFICATIONS),

  // Email / SMTP
  def('email.smtp_host', 'SMTP Host', 'SMTP server hostname', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.EMAIL),
  def('email.smtp_port', 'SMTP Port', 'SMTP server port', SETTING_VALUE_TYPE.NUMBER, 587, SETTING_GROUP.EMAIL),
  def('email.smtp_secure', 'SMTP Secure', 'Use TLS/SSL for SMTP', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.EMAIL),
  def('email.smtp_user', 'SMTP Username', 'SMTP authentication username', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.EMAIL, { encrypted: true }),
  def('email.smtp_password', 'SMTP Password', 'SMTP authentication password', SETTING_VALUE_TYPE.ENCRYPTED, '', SETTING_GROUP.EMAIL, { encrypted: true }),
  def('email.from_address', 'From Address', 'Default sender email address', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.EMAIL),
  def('email.from_name', 'From Name', 'Default sender display name', SETTING_VALUE_TYPE.STRING, 'HR Shakya', SETTING_GROUP.EMAIL),

  // Storage
  def('storage.provider', 'Storage Provider', 'File storage provider', SETTING_VALUE_TYPE.STRING, 'cloudinary', SETTING_GROUP.STORAGE),
  def('storage.cloudinary_folder', 'Cloudinary Folder', 'Root folder for uploads', SETTING_VALUE_TYPE.STRING, 'hr-shakya', SETTING_GROUP.STORAGE),
  def('storage.max_file_size_mb', 'Max File Size (MB)', 'Maximum upload file size', SETTING_VALUE_TYPE.NUMBER, 10, SETTING_GROUP.STORAGE),
  def('storage.allowed_extensions', 'Allowed Extensions', 'Permitted file extensions', SETTING_VALUE_TYPE.JSON, ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'], SETTING_GROUP.STORAGE),
  def('storage.cloudinary_quota_mb', 'Cloudinary Quota (MB)', 'Storage quota limit', SETTING_VALUE_TYPE.NUMBER, 1024, SETTING_GROUP.STORAGE),

  // Security
  def('security.password_min_length', 'Min Password Length', 'Minimum password length', SETTING_VALUE_TYPE.NUMBER, 8, SETTING_GROUP.SECURITY),
  def('security.password_require_uppercase', 'Require Uppercase', 'Password must contain uppercase', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.SECURITY),
  def('security.password_require_number', 'Require Number', 'Password must contain a number', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.SECURITY),
  def('security.password_require_special', 'Require Special Char', 'Password must contain special character', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.SECURITY),
  def('security.session_timeout_minutes', 'Session Timeout', 'Idle session timeout in minutes', SETTING_VALUE_TYPE.NUMBER, 60, SETTING_GROUP.SECURITY),
  def('security.max_login_attempts', 'Max Login Attempts', 'Failed login attempts before lockout', SETTING_VALUE_TYPE.NUMBER, 5, SETTING_GROUP.SECURITY),
  def('security.lockout_duration_minutes', 'Lockout Duration', 'Account lockout duration in minutes', SETTING_VALUE_TYPE.NUMBER, 15, SETTING_GROUP.SECURITY),

  // Integrations
  def('integrations.slack_webhook', 'Slack Webhook', 'Slack incoming webhook URL', SETTING_VALUE_TYPE.STRING, '', SETTING_GROUP.INTEGRATIONS, { encrypted: true }),
  def('integrations.google_calendar_enabled', 'Google Calendar', 'Enable Google Calendar sync', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.INTEGRATIONS),

  // Feature Flags
  def('feature.attendance_module', 'Attendance Module', 'Enable attendance module', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),
  def('feature.payroll_module', 'Payroll Module', 'Enable payroll module', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),
  def('feature.recruitment_module', 'Recruitment Module', 'Enable recruitment module', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),
  def('feature.projects_module', 'Projects Module', 'Enable projects module', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),
  def('feature.sales_module', 'Sales Module', 'Enable sales/CRM module', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),
  def('feature.ai_assistant', 'AI Assistant', 'Enable AI assistant features', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.FEATURE_FLAGS),
  def('feature.mobile_app', 'Mobile App', 'Enable mobile app access', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.FEATURE_FLAGS, { isPublic: true }),

  // Reports
  def('reports.default_format', 'Default Export Format', 'Default report export format', SETTING_VALUE_TYPE.STRING, 'csv', SETTING_GROUP.REPORTS),
  def('reports.retention_days', 'Report Retention', 'Days to retain generated reports', SETTING_VALUE_TYPE.NUMBER, 90, SETTING_GROUP.REPORTS),

  // Analytics
  def('analytics.enabled', 'Analytics Enabled', 'Enable usage analytics', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.ANALYTICS),
  def('analytics.anonymize_ip', 'Anonymize IP', 'Anonymize IP addresses in analytics', SETTING_VALUE_TYPE.BOOLEAN, true, SETTING_GROUP.ANALYTICS),
  def('analytics.retention_days', 'Analytics Retention', 'Days to retain analytics data', SETTING_VALUE_TYPE.NUMBER, 365, SETTING_GROUP.ANALYTICS),

  // API
  def('api.rate_limit_per_minute', 'Rate Limit', 'API requests per minute per key', SETTING_VALUE_TYPE.NUMBER, 100, SETTING_GROUP.API),
  def('api.webhook_retries', 'Webhook Retries', 'Max webhook delivery retries', SETTING_VALUE_TYPE.NUMBER, 3, SETTING_GROUP.API),
  def('api.cors_origins', 'CORS Origins', 'Allowed CORS origins', SETTING_VALUE_TYPE.JSON, [], SETTING_GROUP.API),

  // System
  def('system.log_level', 'Log Level', 'Application log level', SETTING_VALUE_TYPE.STRING, 'info', SETTING_GROUP.SYSTEM),
  def('system.audit_retention_days', 'Audit Retention', 'Days to retain audit logs', SETTING_VALUE_TYPE.NUMBER, 365, SETTING_GROUP.SYSTEM),
  def('system.backup_enabled', 'Backup Enabled', 'Enable automated backups', SETTING_VALUE_TYPE.BOOLEAN, false, SETTING_GROUP.SYSTEM),
];

export const CONFIGURATION_CATALOG_BY_KEY = new Map(
  CONFIGURATION_CATALOG.map((item) => [item.key, item]),
);

export const CONFIGURATION_CATALOG_BY_GROUP = CONFIGURATION_CATALOG.reduce<
  Record<string, ConfigurationSettingDefinition[]>
>((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {});
