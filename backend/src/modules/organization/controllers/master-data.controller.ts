import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import {
  bulkCreateSchema,
  bulkDeleteSchema,
  bulkUpdateSchema,
  companyUpdateSchema,
  createBodySchema,
  csvImportSchema,
  entityKeyParamSchema,
  idParamSchema,
  listQuerySchema,
  updateBodySchema,
} from '@modules/organization/validators/master-data.validator.js';
import { MasterDataService } from '@modules/organization/shared/master-data.service.js';
import { CompanyService } from '@modules/organization/services/company.service.js';
import { CsvService } from '@modules/organization/shared/csv.service.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';
import type { CursorPaginationResult } from '@infrastructure/database/query/cursor-pagination.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

function buildActor(req: AuthenticatedRequest): MasterDataActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function isCursorResult(
  result: PaginatedResult<BaseDocument> | CursorPaginationResult<BaseDocument>,
): result is CursorPaginationResult<BaseDocument> {
  return 'hasMore' in result;
}

export const listEntities: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const query = validateInput(listQuerySchema, req.query);
    const result = await MasterDataService.list(entityKey as MasterDataEntityKey, buildActor(authReq), query);

    if (isCursorResult(result)) {
      return ResponseService.success(res, authReq, result, 'Entities retrieved');
    }

    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEntityById: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey, id } = validateInput(idParamSchema, req.params);
    const includeDeleted = req.query.includeDeleted === 'true';
    const document = await MasterDataService.getById(
      entityKey as MasterDataEntityKey,
      id,
      buildActor(authReq),
      includeDeleted,
    );
    return ResponseService.success(res, authReq, document);
  } catch (error) {
    next(error);
    return;
  }
};

export const createEntity: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const { data } = validateInput(createBodySchema, req.body);
    const document = await MasterDataService.create(
      entityKey as MasterDataEntityKey,
      data,
      buildActor(authReq),
    );
    return ResponseService.created(res, authReq, document);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateEntity: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey, id } = validateInput(idParamSchema, req.params);
    const { data } = validateInput(updateBodySchema, req.body);
    const document = await MasterDataService.update(
      entityKey as MasterDataEntityKey,
      id,
      data,
      buildActor(authReq),
    );
    return ResponseService.updated(res, authReq, document);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteEntity: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey, id } = validateInput(idParamSchema, req.params);
    await MasterDataService.softDelete(entityKey as MasterDataEntityKey, id, buildActor(authReq));
    return ResponseService.deleted(res, authReq);
  } catch (error) {
    next(error);
    return;
  }
};

export const restoreEntity: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey, id } = validateInput(idParamSchema, req.params);
    const document = await MasterDataService.restore(
      entityKey as MasterDataEntityKey,
      id,
      buildActor(authReq),
    );
    return ResponseService.updated(res, authReq, document, 'Entity restored');
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkCreateEntities: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const { items } = validateInput(bulkCreateSchema, req.body);
    const created = await MasterDataService.bulkCreate(
      entityKey as MasterDataEntityKey,
      items,
      buildActor(authReq),
    );
    return ResponseService.created(res, authReq, created);
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkUpdateEntities: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const { items } = validateInput(bulkUpdateSchema, req.body);
    const updated = await MasterDataService.bulkUpdate(
      entityKey as MasterDataEntityKey,
      items,
      buildActor(authReq),
    );
    return ResponseService.updated(res, authReq, updated);
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkDeleteEntities: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const { ids } = validateInput(bulkDeleteSchema, req.body);
    const result = await MasterDataService.bulkDelete(
      entityKey as MasterDataEntityKey,
      ids,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result, 'Bulk delete completed');
  } catch (error) {
    next(error);
    return;
  }
};

export const exportEntities: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const query = validateInput(listQuerySchema, req.query);
    const actor = buildActor(authReq);
    const result = await MasterDataService.list(entityKey as MasterDataEntityKey, actor, {
      ...query,
      pageSize: 1000,
    });

    const items = isCursorResult(result) ? result.items : result.items;
    const csv = CsvService.exportToCsv(entityKey as MasterDataEntityKey, items);
    await CsvService.logExport(entityKey as MasterDataEntityKey, items.length, actor);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entityKey}-export.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const importEntities: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { entityKey } = validateInput(entityKeyParamSchema, req.params);
    const { csv } = validateInput(csvImportSchema, req.body);
    const actor = buildActor(authReq);
    const rows = CsvService.parseCsv(csv);
    const created = await MasterDataService.bulkCreate(
      entityKey as MasterDataEntityKey,
      rows,
      actor,
    );
    await CsvService.logImport(entityKey as MasterDataEntityKey, created.length, actor);
    return ResponseService.created(res, authReq, { imported: created.length, items: created });
  } catch (error) {
    next(error);
    return;
  }
};

export const getCompany: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const company = await CompanyService.getByCompanyId(authReq.user.companyId);
    return ResponseService.success(res, authReq, company);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateCompany: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(companyUpdateSchema, req.body);
    const company = await CompanyService.update(
      authReq.user.companyId,
      payload,
      buildActor(authReq),
    );
    return ResponseService.updated(res, authReq, company);
  } catch (error) {
    next(error);
    return;
  }
};
