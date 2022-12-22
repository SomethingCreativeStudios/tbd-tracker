import { SeasonName } from '../models';

export function findLastSeason(season: SeasonName, year: string) {
  if (season === SeasonName.WINTER) {
    return { season: SeasonName.FALL, year: +year - 1 };
  }

  if (season === SeasonName.FALL) {
    return { season: SeasonName.SUMMER, year: +year };
  }

  if (season === SeasonName.SUMMER) {
    return { season: SeasonName.SPRING, year: +year };
  }

  if (season === SeasonName.SPRING) {
    return { season: SeasonName.FALL, year: +year };
  }
}
