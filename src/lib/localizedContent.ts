export function pickLocalized(en: string, tr: string, lang: 'EN' | 'TR'): string {
  if (lang === 'TR' && tr.trim()) return tr;
  return en;
}

export function combineEventDateTime(eventDate: string, eventTime: string): string {
  const time = eventTime.length === 5 ? `${eventTime}:00` : eventTime;
  return `${eventDate}T${time}`;
}
