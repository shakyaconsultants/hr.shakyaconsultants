import { Router } from 'express';
import { getRoot } from '@modules/root/root.controller.js';

const rootRouter = Router();

rootRouter.get('/', getRoot);

export { rootRouter };
