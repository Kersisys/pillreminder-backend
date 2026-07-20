import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface CloudinarySignaturePayload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Фото загружаются НЕ через наш backend, а напрямую с телефона в Cloudinary —
 * так быстрее и не грузит наш сервер трафиком фотографий. Но чтобы api_secret
 * никогда не попадал в APK, телефон сначала запрашивает у нас подписанный
 * набор параметров (подпись действительна только для конкретных timestamp+folder,
 * подделать её без api_secret невозможно).
 *
 * folder содержит userId — так фото разных пользователей физически разделены
 * в самом Cloudinary, что упрощает и модерацию, и полное удаление аккаунта.
 */
export function createUploadSignature(userId: string): CloudinarySignaturePayload {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `pill-reminder/${userId}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET,
  );

  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

/** Вызывается при удалении подтверждения/аккаунта — не оставляем фото-сироты в Cloudinary. */
export async function deleteCloudinaryPhoto(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
