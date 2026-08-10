import { Router } from 'express';
import { createPillPlan, deletePillPlan, listPillPlans } from '../controllers/pillPlan.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';

export const pillPlanRouter = Router();

pillPlanRouter.use(requireAuth);
pillPlanRouter.get('/', asyncHandler(listPillPlans));
pillPlanRouter.post('/', asyncHandler(createPillPlan));
pillPlanRouter.delete('/:id', asyncHandler(deletePillPlan));
