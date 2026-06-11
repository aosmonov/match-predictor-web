import type { HistoryItem, LocaleKey, Match, KnockoutWinner, Prediction } from "./types";
import { locales } from "./i18n";

export const GROUPS = Array.from({ length: 12 }, (_, index) =>
  `GROUP_${String.fromCharCode(65 + index)}`,
);

const TEAM_TRANSLATIONS: Record<string, Record<LocaleKey, string>> = {
  ARG: { en: "Argentina", ru: "Аргентина", ky: "Аргентина" },
  BRA: { en: "Brazil", ru: "Бразилия", ky: "Бразилия" },
  CAN: { en: "Canada", ru: "Канада", ky: "Канада" },
  ENG: { en: "England", ru: "Англия", ky: "Англия" },
  ESP: { en: "Spain", ru: "Испания", ky: "Испания" },
  FRA: { en: "France", ru: "Франция", ky: "Франция" },
  IRN: { en: "Iran", ru: "Иран", ky: "Иран" },
  MEX: { en: "Mexico", ru: "Мексика", ky: "Мексика" },
  PAN: { en: "Panama", ru: "Панама", ky: "Панама" },
  USA: { en: "USA", ru: "США", ky: "АКШ" },
  RSA: { en: "South Africa", ru: "Южная Африка", ky: "Түштүк Африка" },
  KOR: { en: "South Korea", ru: "Южная Корея", ky: "Түштүк Корея" },
  CZE: { en: "Czech Republic", ru: "Чешская Республика", ky: "Чехия" },
  BIH: {
    en: "Bosnia and Herzegovina",
    ru: "Босния и Герцеговина",
    ky: "Босния жана Герцеговина",
  },
  PAR: { en: "Paraguay", ru: "Парагвай", ky: "Парагвай" },
  QAT: { en: "Qatar", ru: "Катар", ky: "Катар" },
  SUI: { en: "Switzerland", ru: "Швейцария", ky: "Швейцария" },
  MAR: { en: "Morocco", ru: "Марокко", ky: "Марокко" },
  HAI: { en: "Haiti", ru: "Гаити", ky: "Гаити" },
  SCO: { en: "Scotland", ru: "Шотландия", ky: "Шотландия" },
  AUS: { en: "Australia", ru: "Австралия", ky: "Австралия" },
  TUR: { en: "Turkey", ru: "Турция", ky: "Туркия" },
  GER: { en: "Germany", ru: "Германия", ky: "Германия" },
  CUR: { en: "Curaçao", ru: "Кюрасао", ky: "Кюрасао" },
  CUW: { en: "Curaçao", ru: "Кюрасао", ky: "Кюрасао" },
  NED: { en: "Netherlands", ru: "Нидерланды", ky: "Нидерланды" },
  JPN: { en: "Japan", ru: "Япония", ky: "Япония" },
  CIV: {
    en: "Ivory Coast",
    ru: "Берег Слоновой Кости",
    ky: "Кот-д'Ивуар",
  },
  ECU: { en: "Ecuador", ru: "Эквадор", ky: "Эквадор" },
  SWE: { en: "Sweden", ru: "Швеция", ky: "Швеция" },
  TUN: { en: "Tunisia", ru: "Тунис", ky: "Тунис" },
  CPV: { en: "Cape Verde", ru: "Кабо-Верде", ky: "Кабо-Верде" },
  BEL: { en: "Belgium", ru: "Бельгия", ky: "Бельгия" },
  EGY: { en: "Egypt", ru: "Египет", ky: "Египет" },
  KSA: { en: "Saudi Arabia", ru: "Саудовская Аравия", ky: "Сауд Арабия" },
  URY: { en: "Uruguay", ru: "Уругвай", ky: "Уругвай" },
  NZL: { en: "New Zealand", ru: "Новая Зеландия", ky: "Жаңы Зеландия" },
  SEN: { en: "Senegal", ru: "Сенегал", ky: "Сенегал" },
  IRQ: { en: "Iraq", ru: "Ирак", ky: "Ирак" },
  NOR: { en: "Norway", ru: "Норвегия", ky: "Норвегия" },
  ALG: { en: "Algeria", ru: "Алжир", ky: "Алжир" },
  AUT: { en: "Austria", ru: "Австрия", ky: "Австрия" },
  JOR: { en: "Jordan", ru: "Иордания", ky: "Иордания" },
  POR: { en: "Portugal", ru: "Португалия", ky: "Португалия" },
  COD: { en: "Congo DR", ru: "Конго, ДР", ky: "Конго, ДР" },
  CRO: { en: "Croatia", ru: "Хорватия", ky: "Хорватия" },
  GHA: { en: "Ghana", ru: "Гана", ky: "Гана" },
  UZB: { en: "Uzbekistan", ru: "Узбекистан", ky: "Өзбекстан" },
  COL: { en: "Colombia", ru: "Колумбия", ky: "Колумбия" },
};

const STAGE_TRANSLATIONS: Record<string, Record<LocaleKey, string>> = {
  GROUP_STAGE: { en: "Group Stage", ru: "Групповой этап", ky: "Топтук этап" },
  LAST_32: { en: "Last 32", ru: "1/16 финала", ky: "1/16 финал" },
  ROUND_OF_32: { en: "Last 32", ru: "1/16 финала", ky: "1/16 финал" },
  LAST_16: { en: "Last 16", ru: "1/8 финала", ky: "1/8 финал" },
  ROUND_OF_16: { en: "Last 16", ru: "1/8 финала", ky: "1/8 финал" },
  QUARTER_FINAL: { en: "Quarterfinal", ru: "Четвертьфинал", ky: "Чейрек финал" },
  SEMI_FINAL: { en: "Semifinal", ru: "Полуфинал", ky: "Жарым финал" },
  THIRD_PLACE: { en: "Third-place match", ru: "Матч за 3-е место", ky: "3-орун үчүн беттеш" },
  FINAL: { en: "Final", ru: "Финал", ky: "Финал" },
};

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object" && value && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object" && value && "seconds" in value) {
    const seconds = (value as { seconds?: number }).seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function getMatchDate(match: Match) {
  return toDate(match.timestamp) ?? toDate(match.date);
}

export function formatKickoff(match: Match, locale: LocaleKey) {
  const date = getMatchDate(match);
  if (!date) return match.timeOrMin ?? "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const aDate = getMatchDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDate = getMatchDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
}

export function todayWindow(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(6, 0, 0, 0);
  return { start, end };
}

export function formatTeam(team: string | null | undefined, locale: LocaleKey) {
  if (!team?.trim()) return locales[locale].predictions.teamsTbd;
  const key = team.trim().toUpperCase().replace(/[.\s-]+/g, "_");
  return TEAM_TRANSLATIONS[key]?.[locale] ?? TEAM_TRANSLATIONS[key.replace(/_/g, "")]?.[locale] ?? team;
}

export function formatGroup(group: string | null | undefined, locale: LocaleKey) {
  if (!group?.trim()) return null;
  const match = /GROUP[_\s-]?([A-L])$/i.exec(group);
  if (!match) return group;
  return locale === "ky"
    ? `${match[1].toUpperCase()} ${locales[locale].home.groupLabel}`
    : `${locales[locale].home.groupLabel} ${match[1].toUpperCase()}`;
}

export function formatStage(stage: string | null | undefined, locale: LocaleKey) {
  if (!stage?.trim()) return null;
  const key = stage.trim().toUpperCase().replace(/[.\s/-]+/g, "_");
  return STAGE_TRANSLATIONS[key]?.[locale] ?? stage;
}

export function matchLabel(match: Match, locale: LocaleKey) {
  return formatGroup(match.group, locale) ?? formatStage(match.stage, locale) ?? "Match";
}

export function hasTeams(match: Match) {
  return Boolean(match.homeTeam && match.awayTeam);
}

export function hasStarted(match: Match, now = new Date()) {
  const date = getMatchDate(match);
  return Boolean(date && date.getTime() <= now.getTime()) || match.status === "LIVE" || match.status === "COMPLETED";
}

export function startsIn(match: Match, locale: LocaleKey) {
  const date = getMatchDate(match);
  if (!date) return "";
  const diff = date.getTime() - Date.now();
  if (match.status === "LIVE") return locales[locale].predictions.liveNow;
  if (diff <= 0) return locales[locale].predictions.matchStarted;
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts = [
    days ? `${days}${locales[locale].predictions.daysShort}` : "",
    hours ? `${hours}${locales[locale].predictions.hoursShort}` : "",
    `${mins}${locales[locale].predictions.minutesShort}`,
  ].filter(Boolean);
  return `${locales[locale].predictions.startsInPrefix} ${parts.join(" ")}`;
}

export function predictionKey(prediction: Prediction) {
  return String(prediction.matchId);
}

export function historyTime(item: HistoryItem) {
  return toDate(item.kickoffAt)?.getTime() ?? 0;
}

export function getInitials(name: string, email?: string | null) {
  const source = name.trim() || email?.trim() || "Match Predictor";
  return source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BL";
}

export function penaltyLabel(winner: KnockoutWinner, match: Match, locale: LocaleKey) {
  return winner === "home" ? formatTeam(match.homeTeam, locale) : formatTeam(match.awayTeam, locale);
}
