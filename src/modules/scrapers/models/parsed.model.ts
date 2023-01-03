export interface ParsedItem {
  name: string;
  category: string;
  parsedName: string;
  magUrl: string;
  torrentUrl: string;
  size: string;
  uploadedDate: Date;
  ratio: {
    seeders: number;
    leechers: number;
  };
}
