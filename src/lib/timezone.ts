// Vietnam timezone helper (GMT+7)
export function getVietnamTime(): Date {
  const now = new Date();
  // Add 7 hours to UTC
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vnTime;
}

export function toVietnamTime(date: Date): Date {
  return new Date(date.getTime() + (7 * 60 * 60 * 1000));
}
