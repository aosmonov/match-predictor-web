import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  createEmailAccount,
  db,
  logout,
  removeCurrentAccount,
  signInWithEmail,
  signInWithGoogle,
  subscribeToAuth,
} from "./firebase";
import { getInitialLocale, locales } from "./i18n";
import type {
  HistoryItem,
  LeaderboardEntry,
  LocaleKey,
  Match,
  Prediction,
  StandingTeam,
  TabKey,
} from "./types";
import {
  GROUPS,
  formatGroup,
  formatKickoff,
  formatTeam,
  getInitials,
  getMatchDate,
  hasStarted,
  hasTeams,
  historyTime,
  matchLabel,
  penaltyLabel,
  predictionKey,
  sortMatches,
  startsIn,
  todayWindow,
} from "./utils";

const GOOGLE_LOGO = "https://developers.google.com/identity/images/g-logo.png";

function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="screen-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(source: Record<string, unknown>, ...paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      const record = asRecord(current);
      return record[key];
    }, source);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeMatchDoc(id: string, data: Record<string, unknown>): Match {
  return {
    ...(data as Omit<Match, "id">),
    id,
    homeTeam: readString(
      data,
      "homeTeam",
      "homeTeam.tla",
      "homeTeam.shortName",
      "homeTeam.name",
      "home.name",
      "teams.home.name",
    ),
    awayTeam: readString(
      data,
      "awayTeam",
      "awayTeam.tla",
      "awayTeam.shortName",
      "awayTeam.name",
      "away.name",
      "teams.away.name",
    ),
    homeFlag: readString(
      data,
      "homeFlag",
      "homeTeam.crest",
      "home.flag",
      "teams.home.logo",
      "homeTeam.flag",
    ),
    awayFlag: readString(
      data,
      "awayFlag",
      "awayTeam.crest",
      "away.flag",
      "teams.away.logo",
      "awayTeam.flag",
    ),
  };
}

function LanguageSwitch({
  locale,
  setLocale,
}: {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
}) {
  return (
    <div className="language-switch" aria-label="Language">
      {(["en", "ru", "ky"] as LocaleKey[]).map((item) => (
        <button
          key={item}
          className={item === locale ? "active" : ""}
          onClick={() => setLocale(item)}
          type="button"
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function LoginScreen({ locale, setLocale }: { locale: LocaleKey; setLocale: (locale: LocaleKey) => void }) {
  const copy = locales[locale].login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(copy.fillAllFields);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (registering) {
        await createEmailAccount(email.trim(), password);
        alert(copy.accountCreatedSuccess);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setError(copy.emailAlreadyInUse);
      } else if (err?.code?.startsWith("auth/")) {
        setError(copy.invalidEmailOrPassword);
      } else {
        setError(copy.networkError);
      }
    } finally {
      setLoading(false);
    }
  }

  async function authPopup(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await action();
    } catch (err) {
      console.error(err);
      setError(copy.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <LanguageSwitch locale={locale} setLocale={setLocale} />
      <section className="login-card">
        <p className="eyebrow">{copy.logoSubtitle}</p>
        <h1>{copy.logoTitle}</h1>
        <button className="primary-oauth" disabled={loading} onClick={() => authPopup(signInWithGoogle)}>
          <span className="oauth-badge"><img src={GOOGLE_LOGO} alt="" /></span>
          {copy.continueWithGoogle}
        </button>
        <div className="divider" />
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleEmail} className="auth-form">
          <label>
            {copy.emailAddress}
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={copy.enterEmail} type="email" />
          </label>
          <label>
            {copy.password}
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
          </label>
          <button className="secondary-action" disabled={loading} type="submit">
            {registering ? copy.createWithEmail : copy.signInWithEmail}
          </button>
        </form>
      </section>
      <button className="ghost-link" onClick={() => setRegistering((value) => !value)} type="button">
        {registering ? copy.alreadyTrackingPicks : copy.firstTimePredicting}{" "}
        <b>{registering ? copy.signIn : copy.createAccount}</b>
      </button>
    </main>
  );
}

function MatchCard({ match, locale, featured = false }: { match: Match; locale: LocaleKey; featured?: boolean }) {
  const home = formatTeam(match.homeTeam, locale);
  const away = formatTeam(match.awayTeam, locale);
  const isScoreVisible = match.status === "LIVE" || match.status === "COMPLETED";
  const footer =
    match.status === "LIVE"
      ? `${locales[locale].home.minutePrefix} ${match.timeOrMin ?? ""}`
      : match.status === "COMPLETED"
        ? locales[locale].home.fullTime
        : `${locales[locale].home.kickoffPrefix} ${formatKickoff(match, locale)}`;

  return (
    <article className={`match-card ${featured ? "featured" : ""}`}>
      <div className="card-topline">
        <span>{matchLabel(match, locale)}</span>
        <b className={`status ${match.status.toLowerCase()}`}>{match.status}</b>
      </div>
      <div className="team-row">
        <TeamFlag src={match.homeFlag} />
        <span>{home}</span>
        {isScoreVisible && <strong>{match.homeScore ?? "-"}</strong>}
      </div>
      <div className="team-row">
        <TeamFlag src={match.awayFlag} />
        <span>{away}</span>
        {isScoreVisible && <strong>{match.awayScore ?? "-"}</strong>}
      </div>
      <p className="match-footer">{footer}</p>
    </article>
  );
}

function TeamFlag({ src }: { src?: string | null }) {
  return src ? <img className="flag" src={src} alt="" /> : <span className="flag placeholder" />;
}

function HomeScreen({
  locale,
  matches,
  standings,
  loading,
}: {
  locale: LocaleKey;
  matches: Match[];
  standings: Record<string, StandingTeam[]>;
  loading: boolean;
}) {
  const copy = locales[locale].home;
  const [group, setGroup] = useState("GROUP_A");
  const now = new Date();
  const window = todayWindow(now);
  const withDates = matches.filter((match) => getMatchDate(match));
  const today = sortMatches(
    withDates.filter((match) => {
      const date = getMatchDate(match);
      return date && date >= window.start && date <= window.end;
    }),
  );
  const completed = sortMatches(
    withDates.filter((match) => {
      const date = getMatchDate(match);
      return date && date < window.start;
    }),
  ).reverse();
  const upcoming = sortMatches(
    withDates.filter((match) => {
      const date = getMatchDate(match);
      return date && date > window.end;
    }),
  );
  const featured =
    today.find((match) => match.status === "LIVE") ??
    today.find((match) => match.status === "UPCOMING") ??
    today[today.length - 1] ??
    upcoming[0] ??
    completed[0];
  const groupRows = standings[group] ?? [];

  return (
    <section className="screen">
      <ScreenHeader eyebrow={copy.brandText} title={copy.dashboard} />
      {loading ? <p className="muted">{copy.loadingHomeData}</p> : null}
      <Section title={copy.todayGame}>
        {featured ? <MatchCard match={featured} locale={locale} featured /> : <Empty>{copy.noMatchToday}</Empty>}
      </Section>
      <Section title={copy.finishedGames}>
        <HorizontalList>
          {completed.filter((match) => match.id !== featured?.id).slice(0, 8).map((match) => (
            <MatchCard key={match.id} match={match} locale={locale} />
          ))}
          {!completed.length && <Empty>{copy.finishedEmpty}</Empty>}
        </HorizontalList>
      </Section>
      <Section title={copy.upcomingGames}>
        <HorizontalList>
          {upcoming.filter((match) => match.id !== featured?.id).slice(0, 8).map((match) => (
            <MatchCard key={match.id} match={match} locale={locale} />
          ))}
          {!upcoming.length && <Empty>{copy.upcomingEmpty}</Empty>}
        </HorizontalList>
      </Section>
      <Section title={copy.groupStandings}>
        <div className="group-pills">
          {GROUPS.map((item) => (
            <button key={item} className={item === group ? "active" : ""} onClick={() => setGroup(item)}>
              {formatGroup(item, locale)}
            </button>
          ))}
        </div>
        <div className="standings-card">
          <div className="standings-head"><span>{copy.pos}</span><span>{copy.team}</span><span>{copy.mp}</span><span>{copy.pts}</span></div>
          {groupRows.length ? groupRows.map((row) => (
            <div className="standings-row" key={row.team}>
              <span>{row.rank}</span>
              <span><TeamFlag src={row.flag} /> {formatTeam(row.team, locale)}</span>
              <span>{row.mp}</span>
              <strong>{row.pts}</strong>
            </div>
          )) : <Empty>{copy.standingsEmpty}</Empty>}
        </div>
      </Section>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="section"><h2>{title}</h2>{children}</section>;
}

function HorizontalList({ children }: { children: React.ReactNode }) {
  return <div className="horizontal-list">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

function PredictionsScreen({
  locale,
  user,
  matches,
  predictions,
  reloadPredictions,
}: {
  locale: LocaleKey;
  user: User;
  matches: Match[];
  predictions: Prediction[];
  reloadPredictions: () => Promise<void>;
}) {
  const copy = locales[locale].predictions;
  const [tab, setTab] = useState<"notPredicted" | "predicted">("notPredicted");
  const predictionMap = useMemo(() => new Map(predictions.map((item) => [predictionKey(item), item])), [predictions]);
  const eligible = sortMatches(matches).filter((match) => match.status !== "COMPLETED");
  const notPredicted = eligible.filter((match) => !predictionMap.has(match.id));
  const predicted = eligible.filter((match) => predictionMap.has(match.id));
  const list = tab === "notPredicted" ? notPredicted : predicted;

  return (
    <section className="screen">
      <ScreenHeader eyebrow={copy.voteWinPoints} title={copy.predictionZone} />
      <div className="segmented">
        <button className={tab === "notPredicted" ? "active" : ""} onClick={() => setTab("notPredicted")}>
          {copy.tabNotPredicted} ({notPredicted.length})
        </button>
        <button className={tab === "predicted" ? "active" : ""} onClick={() => setTab("predicted")}>
          {copy.tabPredicted} ({predicted.length})
        </button>
      </div>
      <div className="prediction-list">
        {list.map((match) => (
          <PredictionCard
            key={match.id}
            locale={locale}
            match={match}
            prediction={predictionMap.get(match.id)}
            user={user}
            onSaved={reloadPredictions}
          />
        ))}
        {!list.length && <Empty>{tab === "notPredicted" ? copy.noMatchesToPredict : copy.noSavedPredictions}</Empty>}
      </div>
    </section>
  );
}

function PredictionCard({
  locale,
  match,
  prediction,
  user,
  onSaved,
}: {
  locale: LocaleKey;
  match: Match;
  prediction?: Prediction;
  user: User;
  onSaved: () => Promise<void>;
}) {
  const copy = locales[locale].predictions;
  const [homeScore, setHomeScore] = useState(String(prediction?.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(prediction?.awayScore ?? 0));
  const [penaltyWinner, setPenaltyWinner] = useState<"home" | "away" | "">((prediction?.penaltyWinner as "home" | "away") ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const locked = hasStarted(match);
  const teamsReady = hasTeams(match);
  const needsPenaltyWinner = Boolean(match.isKnockout && Number(homeScore) === Number(awayScore));

  useEffect(() => {
    setHomeScore(String(prediction?.homeScore ?? 0));
    setAwayScore(String(prediction?.awayScore ?? 0));
    setPenaltyWinner((prediction?.penaltyWinner as "home" | "away") ?? "");
  }, [prediction?.homeScore, prediction?.awayScore, prediction?.penaltyWinner]);

  async function save() {
    setMessage("");
    if (!teamsReady) return setMessage(copy.predictWhenTeamsKnown);
    if (locked) return setMessage(copy.matchStartedLocked);
    if (needsPenaltyWinner && !penaltyWinner) return setMessage(copy.selectPenaltyWinner);
    setSaving(true);
    try {
      const id = prediction?.id ?? `${user.uid}_${match.id}`;
      await setDoc(
        doc(db, "predictions", id),
        {
          uid: user.uid,
          matchId: prediction?.matchId ?? match.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          penaltyWinner: needsPenaltyWinner ? penaltyWinner : null,
          createdAt: prediction?.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setMessage(copy.saveSuccess);
      await onSaved();
    } catch (err) {
      console.error(err);
      setMessage(copy.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="prediction-card">
      <div className="prediction-card-top">
        <span>{matchLabel(match, locale)}</span>
        <b>{startsIn(match, locale)}</b>
      </div>
      <div className="prediction-teams">
        <span><TeamFlag src={match.homeFlag} /> {formatTeam(match.homeTeam, locale)}</span>
        <span><TeamFlag src={match.awayFlag} /> {formatTeam(match.awayTeam, locale)}</span>
      </div>
      <div className="score-editor">
        <input aria-label="Home score" disabled={locked || !teamsReady} min={0} type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
        <span>:</span>
        <input aria-label="Away score" disabled={locked || !teamsReady} min={0} type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
      </div>
      {match.isKnockout && Number(homeScore) === Number(awayScore) && (
        <div className="penalty-picker">
          <p>{copy.matchEndsInDraw}</p>
          {(["home", "away"] as const).map((side) => (
            <button key={side} className={penaltyWinner === side ? "active" : ""} onClick={() => setPenaltyWinner(side)} type="button">
              {penaltyLabel(side, match, locale)}
            </button>
          ))}
        </div>
      )}
      {message && <p className={message === copy.saveSuccess ? "success" : "error"}>{message}</p>}
      <button className="save-prediction" disabled={saving || locked || !teamsReady} onClick={save}>
        {locked ? copy.locked : saving ? copy.saving : prediction ? copy.updatePrediction : copy.savePrediction}
      </button>
    </article>
  );
}

function LeaderboardScreen({ locale, entries, loading }: { locale: LocaleKey; entries: LeaderboardEntry[]; loading: boolean }) {
  const copy = locales[locale].leaderboard;
  return (
    <section className="screen">
      <ScreenHeader eyebrow={copy.subtitle} title={copy.title} />
      {loading ? <p className="muted">{copy.loading}</p> : null}
      <div className="leaderboard-card">
        {entries.length ? entries.map((entry, index) => {
          const name = entry.displayName || entry.email?.split("@")[0] || "Buddy";
          return (
            <div className="leader-row" key={entry.id}>
              <span className="rank">#{entry.rank ?? index + 1}</span>
              {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="avatar small" /> : <span className="avatar small initials">{getInitials(name, entry.email)}</span>}
              <span className="leader-name">{name}</span>
              <strong>{entry.totalPoints ?? 0} {copy.pts}</strong>
            </div>
          );
        }) : <Empty>{copy.empty}</Empty>}
      </div>
    </section>
  );
}

function ProfileScreen({
  locale,
  user,
  history,
  leaderboard,
}: {
  locale: LocaleKey;
  user: User;
  history: HistoryItem[];
  leaderboard?: LeaderboardEntry;
}) {
  const copy = locales[locale].profile;
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const displayName = user.displayName || user.email?.split("@")[0] || copy.buddyLeaguePlayer;
  const scored = leaderboard?.scoredPredictionCount ?? history.length;
  const correct = history.filter((item) => item.pointsEarned > 0).length;
  const accuracy = scored ? Math.round((correct / scored) * 100) : 0;

  async function deleteAccount() {
    if (!confirm(`${copy.deleteAccountTitle}\n\n${copy.deleteAccountBody}`)) return;
    setBusy(true);
    try {
      await removeCurrentAccount();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <ScreenHeader eyebrow={locales[locale].tabs.profile} title={copy.account} />
      <div className="profile-hero">
        {user.photoURL ? <img className="avatar" src={user.photoURL} alt="" /> : <span className="avatar initials">{getInitials(displayName, user.email)}</span>}
        <h2>{displayName}</h2>
        <p>{user.email ?? copy.noEmailAvailable}</p>
      </div>
      <div className="stats-grid">
        <Stat label={copy.totalPoints} value={leaderboard?.totalPoints ?? 0} />
        <Stat label={copy.globalRank} value={leaderboard?.rank ? `#${leaderboard.rank}` : "-"} />
        <Stat label={copy.accuracy} value={`${accuracy}%`} />
      </div>
      <Section title={copy.pointsBreakdown}>
        <p className="section-copy">{copy.pointsBreakdownDescription}</p>
        <div className="history-card">
          {history.length ? history.map((item) => <HistoryRow key={item.id} item={item} locale={locale} />) : <Empty>{copy.noScoredPredictions}</Empty>}
        </div>
      </Section>
      <Section title={copy.appPreferences}>
        <button className="menu-row" onClick={() => setExpanded((value) => !value)}>{copy.rulesScoringBreakdownMatrix}<span>{expanded ? "⌃" : "⌄"}</span></button>
        {expanded && (
          <div className="rules-panel">
            <h3>{copy.rulesHeading}</h3>
            <p>{copy.rulesDescription}</p>
            {[copy.exactScorePoints, copy.goalDiffPoints, copy.outcomePoints, copy.penaltyWinnerPoints, copy.rulesExampleExact, copy.rulesExampleGoalDiff, copy.rulesExampleWinner, copy.rulesKnockout, copy.rulesLock].map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </Section>
      <Section title={copy.account}>
        <button className="logout-button" disabled={busy} onClick={() => void logout()}>{copy.logout}</button>
        <p className="warning">{copy.deleteWarning}</p>
        <button className="delete-button" disabled={busy} onClick={deleteAccount}>{busy ? copy.deletingAccount : copy.deleteAccount}</button>
      </Section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function HistoryRow({ item, locale }: { item: HistoryItem; locale: LocaleKey }) {
  const copy = locales[locale].profile;
  const parts = [
    [copy.outcome, item.breakdown?.outcomePoints],
    [copy.goalDiff, item.breakdown?.goalDifferencePoints],
    [copy.exactScore, item.breakdown?.exactScorePoints],
    [copy.penaltyWinner, item.breakdown?.penaltyWinnerPoints],
  ].filter(([, value]) => Number(value) > 0);
  return (
    <div className="history-row">
      <div>
        <strong>{item.match}</strong>
        <p>{copy.yourPick}: {item.prediction} • {copy.result}: {item.actualScore}</p>
        <p>{parts.length ? parts.map(([label, value]) => `${label} +${value}`).join(" • ") : copy.noPointsEarned}</p>
      </div>
      <b>+{item.pointsEarned} {copy.pointsSuffix}</b>
    </div>
  );
}

export function App() {
  const [locale, setLocaleState] = useState<LocaleKey>(() => getInitialLocale());
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("home");
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Record<string, StandingTeam[]>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  function setLocale(next: LocaleKey) {
    localStorage.setItem("buddy-league-locale", next);
    setLocaleState(next);
  }

  async function loadPublicData() {
    setLoadingData(true);
    const [matchesSnap, standingsSnap, leaderboardSnap] = await Promise.all([
      getDocs(collection(db, "matches")),
      getDoc(doc(db, "standings", "groups")),
      getDocs(collection(db, "leaderboard")),
    ]);
    setMatches(matchesSnap.docs.map((item) => normalizeMatchDoc(item.id, item.data())));
    setStandings((standingsSnap.data() ?? {}) as Record<string, StandingTeam[]>);
    setLeaderboard(
      leaderboardSnap.docs
        .map((item) => ({ ...(item.data() as Omit<LeaderboardEntry, "id">), id: item.id }))
        .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999)),
    );
    setLoadingData(false);
  }

  async function loadPrivateData(activeUser = user) {
    if (!activeUser) {
      setPredictions([]);
      setHistory([]);
      return;
    }
    const [predictionSnap, historySnap] = await Promise.all([
      getDocs(query(collection(db, "predictions"), where("uid", "==", activeUser.uid))),
      getDocs(query(collection(db, "history"), where("uid", "==", activeUser.uid))),
    ]);
    setPredictions(predictionSnap.docs.map((item) => ({ ...(item.data() as Omit<Prediction, "id">), id: item.id })));
    setHistory(
      historySnap.docs
        .map((item) => ({ ...(item.data() as Omit<HistoryItem, "id">), id: item.id }))
        .sort((a, b) => historyTime(b) - historyTime(a)),
    );
  }

  useEffect(() => subscribeToAuth((next) => {
    setUser(next);
    setAuthLoading(false);
    void loadPrivateData(next);
  }), []);

  useEffect(() => {
    void loadPublicData();
  }, []);

  const myLeaderboard = leaderboard.find((entry) => entry.id === user?.uid);

  if (authLoading) {
    return <main className="loading-shell">Loading Buddy League...</main>;
  }

  if (!user) {
    return <LoginScreen locale={locale} setLocale={setLocale} />;
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand-dot" />
        <b>Buddy League</b>
        <LanguageSwitch locale={locale} setLocale={setLocale} />
      </div>
      <main className="content">
        {tab === "home" && <HomeScreen locale={locale} matches={matches} standings={standings} loading={loadingData} />}
        {tab === "predictions" && (
          <PredictionsScreen
            locale={locale}
            user={user}
            matches={matches}
            predictions={predictions}
            reloadPredictions={() => loadPrivateData(user)}
          />
        )}
        {tab === "leaderboard" && <LeaderboardScreen locale={locale} entries={leaderboard} loading={loadingData} />}
        {tab === "profile" && <ProfileScreen locale={locale} user={user} history={history} leaderboard={myLeaderboard} />}
      </main>
      <nav className="tabbar">
        {(["home", "predictions", "leaderboard", "profile"] as TabKey[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {locales[locale].tabs[item]}
          </button>
        ))}
      </nav>
    </div>
  );
}
