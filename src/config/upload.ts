import multer from 'multer';
import path from 'path';

const tmpPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpPath,
  storage: multer.diskStorage({
    destination: tmpPath,
    filename(req, file, callback) {
      const filename = file.originalname;

      callback(null, filename);
    }
  })
}
