import { chromium } from 'playwright';
import { BaseScrapper } from './base.scrapper';
import { ParsedItem } from './models/parsed.model';

class PirateScrapper implements BaseScrapper {
  private baseUrl = 'https://thepiratebay.org/search.php';
  private uselessWords = [
    '1080p',
    'HDTS',
    'x264',
    'AAC',
    'HDTC',
    '[1080p]',
    '[WEBRip]',
    '[5.1]',
    'WEB-DL',
    'x264-W45Ps',
    'HEVC',
    '10bit',
    '5.1',
    'H264',
    'AAC-RBG',
    'Mp4',
    'AC3',
    'x265',
    'BONE',
    'H264',
    'BluRay',
    'iTA',
    'ENG',
    'FLAC-SARTRE',
    '[WEBRip]',
    '[5.1]',
    'HDCAM-C1NEM4',
    'NF',
    'WEB-DL',
    'DDP5',
    '5',
    '1',
    'Atmos',
    'x264',
    'AMZN',
    'x264-GalaxyRG',
    'x264-Galax',
  ];

  async search(url: string): Promise<ParsedItem[]> {
    const items = await this.loadRows(`${this.baseUrl}?q=${url}`);

    const clean = (item: string) => {
      const split = item.toLowerCase().split('.').join(' ');

      return this.uselessWords.reduce((acc, word) => acc.replace(word.toLowerCase(), ''), split);
    };

    return items.map((item) => ({ ...item, parsedName: clean(item.parsedName) }));
  }

  private async loadRows(url: string): Promise<ParsedItem[]> {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url);

    await page.waitForTimeout(1000);

    return page.$$eval('.list-entry', (eles) => {
      return eles
        .map(
          (ele) =>
            ({
              name: ele.querySelector('.item-title a').textContent,
              category: ele.querySelector('.item-type').textContent,
              parsedName: ele.querySelector('.item-title a').textContent,
              uploadedDate: new Date(ele.querySelector('.item-uploaded label').textContent),
              //@ts-ignore
              magUrl: ele.querySelector('.item-icons a').href,
              size: ele.querySelector('.item-size')?.textContent,
              torrentUrl: '',
              ratio: {
                leechers: Number.parseInt(ele.querySelector('.item-leech')?.textContent),
                seeders: Number.parseInt(ele.querySelector('.item-seed')?.textContent),
              },
            } as ParsedItem),
        )
        .filter((item) => item.category.includes('Movies'));
    });
  }
}

const service = new PirateScrapper();

Object.freeze(service);

export { service as PirateScrapper };
