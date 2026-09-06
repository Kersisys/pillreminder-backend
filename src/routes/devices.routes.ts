import { Router } from 'express';
import { disableDeviceReminders, listDevices, registerDevice } from '../controllers/devices.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';

export const devicesRouter = Router();

devicesRouter.use(requireAuth);
devicesRouter.post('/register', asyncHandler(registerDevice));
devicesRouter.get('/', asyncHandler(listDevices));
devicesRouter.delete('/:id', asyncHandler(disableDeviceReminders));
