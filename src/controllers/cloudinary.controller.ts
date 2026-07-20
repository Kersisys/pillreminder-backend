import { Request, Response } from 'express';
import { createUploadSignature } from '../services/cloudinary.service';

export function getUploadSignature(req: Request, res: Response) {
  // requireAuth уже гарантировал, что req.userId существует.
  const signature = createUploadSignature(req.userId!);
  res.json(signature);
}
