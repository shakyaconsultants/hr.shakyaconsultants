import type { Request, Response } from 'express';
import { ROOT_API } from '@constants/root.constants.js';

export function getRoot(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: ROOT_API.MESSAGE,
    version: ROOT_API.VERSION,
    docs: ROOT_API.DOCS_PATH,
    health: ROOT_API.HEALTH_PATH,
  });
}
