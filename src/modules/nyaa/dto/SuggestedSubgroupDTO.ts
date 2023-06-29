import { SubGroup } from '~/modules/sub-group/models';

export class SuggestedSubgroupDTO {
  subgroup: SubGroup;
  isTrusted: boolean;
  isRemake: boolean;
  pubDate: Date;
}
