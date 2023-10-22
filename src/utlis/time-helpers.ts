import { addDays, addWeeks, eachWeekOfInterval, formatDistance, isFuture } from 'date-fns';

export function toDate(dateString: string) {
  return addDays(new Date(dateString), 1);
}
export function getClosestAiringDate(airingDate: Date, currentDate = new Date()) {
  if (isFuture(airingDate)) {
    return airingDate;
  }

  try {
    const range = eachWeekOfInterval({ start: airingDate, end: addWeeks(currentDate, 1) }, { weekStartsOn: airingDate.getDay() as any });

    const daDate = range.find((date) => isFuture(date));

    daDate.setHours(airingDate.getHours());
    daDate.setMinutes(airingDate.getMinutes());

    return daDate;
  } catch (ex) {
    console.error(airingDate, currentDate, ex);
    return new Date();
  }
}

export function getAiringTime(airingDate: Date, currentDate = new Date()) {
  if (isFuture(airingDate)) {
    return formatDistance(airingDate, currentDate);
  }

  const nextDate = getClosestAiringDate(airingDate, currentDate);

  return formatDistance(nextDate, currentDate, { addSuffix: true });
}
