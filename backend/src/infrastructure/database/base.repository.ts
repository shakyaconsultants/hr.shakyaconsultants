import type { ClientSession, Model, PipelineStage } from 'mongoose';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import type {
  DomainQueryFilter,
  DomainUpdateQuery,
} from '@infrastructure/database/types/domain-query.types.js';
import type { DomainMongooseOptions } from '@infrastructure/database/types/domain-mongoose-options.types.js';
import {
  buildPaginationResult,
  type PaginationQueryOptions,
} from '@infrastructure/database/query/pagination.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export interface RepositoryQueryOptions {
  companyId?: string;
  includeDeleted?: boolean;
  session?: ClientSession;
  updatedBy?: string;
}

export interface BulkUpdateOperation {
  filter: DomainQueryFilter;
  update: DomainUpdateQuery;
}

export class BaseRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  protected buildQueryOptions(options?: RepositoryQueryOptions): DomainMongooseOptions {
    const queryOptions: DomainMongooseOptions = {};
    if (options?.companyId) {
      queryOptions.companyId = options.companyId;
    }
    if (options?.includeDeleted) {
      queryOptions.includeDeleted = true;
    }
    if (options?.updatedBy) {
      queryOptions.updatedBy = options.updatedBy;
    }
    if (options?.session) {
      queryOptions.session = options.session;
    }
    return queryOptions;
  }

  async create(data: Partial<T>, options?: RepositoryQueryOptions): Promise<T> {
    const document = new this.model(data);
    const saved = await document.save({ session: options?.session });
    return saved as T;
  }

  async findById(id: string, options?: RepositoryQueryOptions): Promise<T | null> {
    return this.model.findOne({ id }, null, this.buildQueryOptions(options)).exec();
  }

  async findByIdOrFail(id: string, options?: RepositoryQueryOptions): Promise<T> {
    const document = await this.findById(id, options);
    if (!document) {
      throw new NotFoundError('Resource not found', ERROR_CODES.NOT_FOUND);
    }
    return document;
  }

  async findOne(filter: DomainQueryFilter, options?: RepositoryQueryOptions): Promise<T | null> {
    return this.model.findOne(filter, null, this.buildQueryOptions(options)).exec();
  }

  async findMany(filter: DomainQueryFilter, options?: RepositoryQueryOptions): Promise<T[]> {
    return this.model.find(filter, null, this.buildQueryOptions(options)).exec();
  }

  async update(
    id: string,
    data: DomainUpdateQuery,
    options?: RepositoryQueryOptions,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ id }, data, {
        new: true,
        runValidators: true,
        ...this.buildQueryOptions(options),
      })
      .exec();
  }

  async softDelete(
    id: string,
    deletedBy: string,
    options?: RepositoryQueryOptions,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { id },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy,
            updatedBy: deletedBy,
          },
        },
        { new: true, ...this.buildQueryOptions({ ...options, includeDeleted: true }) },
      )
      .exec();
  }

  async restore(
    id: string,
    updatedBy: string,
    options?: RepositoryQueryOptions,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { id },
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            updatedBy,
          },
        },
        { new: true, ...this.buildQueryOptions({ ...options, includeDeleted: true }) },
      )
      .exec();
  }

  async hardDelete(id: string, options?: RepositoryQueryOptions): Promise<boolean> {
    const result = await this.model
      .deleteOne({ id })
      .setOptions(this.buildQueryOptions({ ...options, includeDeleted: true }))
      .exec();
    return result.deletedCount > 0;
  }

  async deleteMany(filter: DomainQueryFilter, options?: RepositoryQueryOptions): Promise<number> {
    const result = await this.model
      .deleteMany(filter)
      .setOptions(this.buildQueryOptions({ ...options, includeDeleted: true }))
      .exec();
    return result.deletedCount;
  }

  async exists(filter: DomainQueryFilter, options?: RepositoryQueryOptions): Promise<boolean> {
    const count = await this.model
      .countDocuments(filter)
      .setOptions(this.buildQueryOptions(options))
      .exec();
    return count > 0;
  }

  async count(filter: DomainQueryFilter, options?: RepositoryQueryOptions): Promise<number> {
    return this.model.countDocuments(filter).setOptions(this.buildQueryOptions(options)).exec();
  }

  async aggregate<R = unknown>(
    pipeline: PipelineStage[],
    options?: RepositoryQueryOptions,
  ): Promise<R[]> {
    const aggregation = this.model.aggregate<R>(pipeline);
    if (options?.session) {
      aggregation.session(options.session);
    }
    return aggregation.exec();
  }

  async paginate(
    filter: DomainQueryFilter,
    pagination: PaginationQueryOptions,
    options?: RepositoryQueryOptions,
  ): Promise<PaginatedResult<T>> {
    return buildPaginationResult(this.model, filter, {
      ...pagination,
      companyId: options?.companyId ?? pagination.companyId,
      includeDeleted: options?.includeDeleted ?? pagination.includeDeleted,
    });
  }

  async bulkInsert(documents: Partial<T>[], options?: RepositoryQueryOptions): Promise<T[]> {
    return this.model.insertMany(documents, {
      session: options?.session,
    }) as Promise<T[]>;
  }

  async bulkUpdate(
    operations: BulkUpdateOperation[],
    options?: RepositoryQueryOptions,
  ): Promise<number> {
    const bulkOps = operations.map((op) => ({
      updateOne: {
        filter: op.filter,
        update: op.update,
      },
    }));

    const result = await this.model.bulkWrite(bulkOps, {
      session: options?.session,
    });
    return result.modifiedCount;
  }
}
