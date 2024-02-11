export class SyncResultsDTO {
  folderName: string;
  alreadyExists: boolean;
  options: {
    malId: number;
    name: string;
    description: string;
    imagePath: string;
  }[];
}
