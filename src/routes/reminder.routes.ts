import { Router } from 'express';
import { getReminderSettings, updateReminderSettings } from '../controllers/reminder.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';

export const reminderRouter = Router();

reminderRouter.use(requireAuth);
reminderRouter.get('/', asyncHandler(getReminderSettings));
reminderRouter.put('/', asyncHandler(updateReminderSettings));
