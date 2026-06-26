export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export enum LogCategory {
  Application = 'application',
  Audit = 'audit',
  Security = 'security',
  Http = 'http',
  Queue = 'queue',
  Database = 'database',
  Error = 'error',
}

export enum UploadResourceType {
  Image = 'image',
  Raw = 'raw',
  Auto = 'auto',
}

export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Read = 'read',
  Login = 'login',
  Logout = 'logout',
  Export = 'export',
  Import = 'import',
}
