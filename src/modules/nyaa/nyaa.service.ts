import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';
import { SubGroup } from '../sub-group/models';
import { SubGroupService } from '../sub-group';
import { NyaaRSSItem } from './models/nyaaRSSItem';
import { NyaaItem } from './models/nyaaItem';

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser();

  constructor(private readonly subgroupService: SubGroupService) {}

  /**
   * Get all items in the specified feed
   * @param feed
   */
  public async fetchItems(feed: NyaaFeed): Promise<NyaaItem[]> {
    try {
      const { items = [] } = (await this.parser.parseURL(feed)) || {};

      return (items as NyaaRSSItem[]).map(item => {
        return {
          downloadLink: item.link,
          publishedDate: new Date(item.isoDate),
          itemName: item.title,
          subGroupName: item.title,
        };
      });
    } catch (ex) {
      console.error(ex);
    }

    return [];
  }

  public filterSubGroups(items: NyaaItem[], groups: SubGroup[]) {
    this.subgroupService.matchesSubgroup('test', new SubGroup());
  }
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
