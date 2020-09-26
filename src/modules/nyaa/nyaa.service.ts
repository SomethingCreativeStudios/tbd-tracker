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
          subGroupName: item.title.match(/<b>(.*?)<\/b>/g)?.[0] ?? '',
        };
      });
    } catch (ex) {
      console.error(ex);
    }

    return [];
  }

  public findValidItems(items: NyaaItem[], groups: SubGroup[]) {
    return items.filter(item => this.isValidItem(item, groups));
  }

  public isValidItem(item: NyaaItem, groups: SubGroup[]) {
    const validSubgroups = groups.filter(group => group.name.toLowerCase() === item.subGroupName.toLowerCase());

    if (validSubgroups.length === 0) {
      return false;
    }

    return validSubgroups.some(group => this.subgroupService.matchesSubgroup(item.itemName, group));
  }
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
