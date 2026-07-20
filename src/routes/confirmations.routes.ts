import { Router } from 'express';
import { listConfirmations, saveConfirmation } from '../controllers/confirmations.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';

export const confirmationsRouter = Router();

confirmationsRouter.use(requireAuth);
confirmationsRouter.post('/', asyncHandler(saveConfirmation));
confirmationsRouter.get('/', asyncHandler(listConfirmations));
