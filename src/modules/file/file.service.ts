import { Injectable } from '@nestjs/common';
import { readdirSync } from 'fs-extra';
import { FolderModel } from './models/file.model';
import { join, dirname } from 'path';

@Injectable()
export class FileService {
  constructor() {}

  public directoryUp(path: string) {
    const upPath = dirname(path);

    return this.directoryGoTo(upPath);
  }

  public directoryGoTo(path: string) {
    return readdirSync(path, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => ({ fullPath: join(path, item.name), name: item.name } as FolderModel));
  }
}
