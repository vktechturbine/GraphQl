import path  from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
 export const clearImage = filePath => {
    console.log("filePath");
    filePath = path.join(__dirname, '..', filePath);
    console.log(filePath);
    fs.unlink(filePath, err => console.log(err));
  };

export default clearImage;