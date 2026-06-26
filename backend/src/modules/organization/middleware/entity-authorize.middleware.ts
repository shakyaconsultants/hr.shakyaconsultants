import type { RequestHandler } from 'express';
import { authorize } from '@modules/auth/middleware/authorize.middleware.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { ORG_PERMISSIONS } from '@modules/organization/constants/organization-permissions.constants.js';

type EntityAction = 'read' | 'create' | 'update' | 'delete';

export function authorizeEntity(action: EntityAction): RequestHandler {
  return (req, res, next) => {
    const entityKey = req.params.entityKey as MasterDataEntityKey;
    try {
      const config = resolveEntityConfig(entityKey);
      const permission = config.permissions[action];
      return authorize(permission)(req, res, next);
    } catch {
      return authorize(ORG_PERMISSIONS.BRANCH_READ)(req, res, next);
    }
  };
}
