import { Router } from 'express';
import { getHealth } from '@modules/health/health.controller.js';

const healthRouter = Router();

healthRouter.get('/', getHealth);

export { healthRouter };
