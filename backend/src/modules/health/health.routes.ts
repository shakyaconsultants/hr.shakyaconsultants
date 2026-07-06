import { Router } from 'express';
import { getHealth, getReadiness } from '@modules/health/health.controller.js';

const healthRouter = Router();

healthRouter.get('/', getHealth);
healthRouter.get('/ready', getReadiness);

export { healthRouter };
