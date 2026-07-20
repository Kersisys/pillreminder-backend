import { Router } from 'express';
import { registerPushToken } from '../controllers/push.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';

export const pushRouter = Router();

pushRouter.use(requireAuth);
pushRouter.post('/', asyncHandler(registerPushToken));
