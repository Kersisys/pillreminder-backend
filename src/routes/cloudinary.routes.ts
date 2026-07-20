import { Router } from 'express';
import { getUploadSignature } from '../controllers/cloudinary.controller';
import { requireAuth } from '../middleware/auth';

export const cloudinaryRouter = Router();

cloudinaryRouter.use(requireAuth);
cloudinaryRouter.get('/signature', getUploadSignature);
