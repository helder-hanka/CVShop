import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const avatarMulterOptions: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
      file.mimetype
    );
    if (!ok)
      return cb(
        new Error('Only JPEG, PNG, GIF and WEBP formats are allowed'),
        false
      );
    cb(null, true);
  },
  storage: undefined, // handled in StorageService
};
