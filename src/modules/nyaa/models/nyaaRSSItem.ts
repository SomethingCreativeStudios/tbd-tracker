export interface NyaaRSSItem {
  content: string;
  guid: string;
  link: string;
  isoDate: string;
  title: string;
  episodeName: number;
  ['nyaa:trusted']: 'Yes' | 'No';
  ['nyaa:remake']: 'Yes' | 'No';
}
