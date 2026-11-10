import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock3,
  Shield,
  Trophy,
  Check,
  X,
  Download,
  Search,
  Menu,
  CircleHelp,
  Pencil,
  CheckCircle2,
  Globe,
  MoveUpRight,
} from "lucide-react";
import {
  useClub,
  dateLabel,
  initials,
  positions,
  uid,
  type Player,
  type Event,
} from "../lib/club-store";

const nav = [
  { name: "Vue d’ensemble", icon: LayoutDashboard },
  { name: "Effectif", icon: Users },
  { name: "Calendrier", icon: CalendarDays },
  { name: "Convocations", icon: ClipboardCheck },
  { name: "Statistiques", icon: ChartNoAxesCombined },
  { name: "Paramètres", icon: Settings },
];
const today = "2026-11-10";
function Crest({ small = false, opponent = false }: { small?: boolean; opponent?: boolean }) {
  return (
    <span className={`crest ${small ? "small" : ""} ${opponent ? "opponent" : ""}`}>
      <Shield size={small ? 23 : 45} />
      <b>{opponent ? "ASH" : "FCÉ"}</b>
    </span>
  );
}
function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("input,button,select")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>("button,input,select,textarea");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-overlay">
      <dialog open className="modal" ref={ref} aria-modal="true" aria-label={title}>
        <div className="section-title">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Fermer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </dialog>
    </div>
  );
}
export default function ClubApp() {
  const { data, setData, storageError } = useClub();
  const { club, players, events } = data;
  const [page, setPage] = useState(0),
    [mobileNav, setMobileNav] = useState(false),
    [modal, setModal] = useState<"player" | "event" | "result" | "help" | null>(null),
    [editPlayer, setEditPlayer] = useState<Player | null>(null),
    [editEvent, setEditEvent] = useState<Event | null>(null),
    [toast, setToast] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Tous"),
    [month, setMonth] = useState(new Date("2026-11-01T12:00:00")),
    [activeEvent, setActiveEvent] = useState("e1");
  const nextMatch = events
    .filter((e) => e.type === "Match" && !e.score && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const upcoming = events
    .filter((e) => e.date >= today && !e.score)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const selectedEvent = events.find((e) => e.id === activeEvent) || events[0];
  const results = events.filter((e) => e.score).sort((a, b) => b.date.localeCompare(a.date));
  const wins = results.filter((e) => {
    const [a, b] = e.score!.split("–").map(Number);
    return a > b;
  }).length;
  const called = nextMatch?.selected.length || 0;
  const present = nextMatch
    ? nextMatch.selected.filter((id) => nextMatch.responses[id] === "Présent").length
    : 0;
  function notify(message: string) {
    setToast(message);
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const changePage = (n: number) => {
    setPage(n);
    setMobileNav(false);
    setSearch("");
    setFilter("Tous");
  };
  function openPlayer(p: Player | null = null) {
    setEditPlayer(p);
    setModal("player");
  }
  function openEvent(e: Event | null = null) {
    setEditEvent(e);
    setModal("event");
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "clubxi-sauvegarde.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Sauvegarde exportée");
  }
  function updateResponse(id: string, value: string) {
    if (!selectedEvent) return;
    setData((d) => ({
      ...d,
      events: d.events.map((e) =>
        e.id === selectedEvent.id ? { ...e, responses: { ...e.responses, [id]: value } } : e,
      ),
    }));
  }
  function toggleCall(id: string) {
    if (!selectedEvent) return;
    setData((d) => ({
      ...d,
      events: d.events.map((e) =>
        e.id === selectedEvent.id
          ? {
              ...e,
              selected: e.selected.includes(id)
                ? e.selected.filter((x) => x !== id)
                : [...e.selected, id],
            }
          : e,
      ),
    }));
  }
  const eventRow = (e: Event) => (
    <button
      key={e.id}
      className="event-row"
      onClick={() => {
        setActiveEvent(e.id);
        changePage(3);
      }}
    >
      <div className={`date-tile ${e.type === "Match" ? "orange" : ""}`}>
        <strong>{dateLabel(e.date, { day: "2-digit" })}</strong>
        <span>{dateLabel(e.date, { month: "short" }).replace(".", "")}</span>
      </div>
      <div className="event-info">
        <Tag tone={e.type === "Match" ? "orange" : "neutral"}>{e.type}</Tag>
        <h3>{e.type === "Match" ? `${club.name} vs ${e.title}` : e.title}</h3>
        <p>
          <Clock3 size={12} />
          {e.time}
          <span>·</span>
          <MapPin size={12} />
          {e.place}
        </p>
      </div>
      <ChevronRight size={18} />
    </button>
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <a className="brand" href="/" aria-label="ClubXI accueil">
          <span className="brand-mark">XI</span>club<span>xi</span>
          <i>®</i>
        </a>
        <div className="club-switch">
          <Crest small />
          <div>
            <strong>{club.name}</strong>
            <span>{club.category}</span>
          </div>
        </div>
        <span className="nav-label">ESPACE COACH</span>
        <nav>
          {nav.map((n, i) => (
            <button
              key={n.name}
              className={page === i ? "active" : ""}
              onClick={() => changePage(i)}
            >
              <n.icon size={19} />
              {n.name}
              {i === 3 && (
                <span className="nav-count">{events.filter((e) => e.date >= today).length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="team-message">
            <span>LE COLLECTIF D’ABORD.</span>
            <strong>
              Un club.
              <br />
              Une équipe.
              <br />
              Une ambition.
            </strong>
            <div className="stripes" />
          </div>
          <button className="help" onClick={() => setModal("help")}>
            <CircleHelp size={18} />
            Besoin d’un coup de main ?
          </button>
          <div className="coach">
            <span className="avatar">{initials(club.coach)}</span>
            <div>
              <strong>{club.coach}</strong>
              <span>Entraîneur</span>
            </div>
            <button aria-label="Ouvrir les paramètres" onClick={() => changePage(5)}>
              <Settings size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            aria-label="Menu"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Mon club <ChevronRight size={13} />
            <strong>{nav[page].name}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo">
              <span />
              Version démo
            </span>
            <button className="profile" aria-label="Profil coach" onClick={() => changePage(5)}>
              {initials(club.coach)}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === 0 ? "MARDI 10 NOVEMBRE 2026" : "VOTRE ÉQUIPE, BIEN ORGANISÉE"}
              </p>
              <h1>{page === 0 ? `Au cœur du collectif.` : nav[page].name}</h1>
              <p className="subtitle">
                {
                  [
                    "Tout ce qu’il faut pour faire avancer votre équipe.",
                    "Les talents qui font vivre votre club.",
                    "Chaque rendez-vous compte.",
                    "Le bon groupe, au bon moment.",
                    "Les chiffres au service du collectif.",
                    "Un espace à l’image de votre club.",
                  ][page]
                }
              </p>
            </div>
            <button
              className="btn primary"
              onClick={() => (page === 1 ? openPlayer() : openEvent())}
            >
              <Plus size={18} />
              {page === 1 ? "Ajouter un joueur" : "Créer un événement"}
            </button>
          </div>
          {storageError && (
            <div className="warning">
              La sauvegarde locale est indisponible. Exportez vos données avant de quitter cette
              page.
            </div>
          )}
          {page === 0 && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-label">
                    <span /> L’ESPRIT CLUBXI
                  </div>
                  <h2>
                    Moins de gestion.
                    <br />
                    Plus de <em>terrain.</em>
                  </h2>
                  <p>
                    Des joueurs prêts. Un calendrier clair.
                    <br />
                    Concentrez-vous sur le jeu, on organise le reste.
                  </p>
                  <button className="btn hero-button" onClick={() => changePage(1)}>
                    Gérer mon équipe <ArrowUpRight size={18} />
                  </button>
                </div>
                <div className="hero-image">
                  <img
                    src="/images/training.jpg"
                    alt="Joueurs de football amateur à l’entraînement"
                  />
                </div>
                <div className="hero-caption">
                  <span>ENSEMBLE, SUR LE TERRAIN.</span>
                  <span>01 / SAISON 2026–27</span>
                </div>
              </section>
              <div className="metrics">
                <div className="metric">
                  <div>
                    <span>Joueurs dans l’effectif</span>
                    <Users size={18} />
                  </div>
                  <strong>
                    {players.length}
                    <small>joueurs</small>
                  </strong>
                  <p>
                    <span className="green-dot" />
                    {players.filter((p) => p.status === "Disponible").length} disponibles pour le
                    prochain match
                  </p>
                </div>
                <div className="metric">
                  <div>
                    <span>Prochain match</span>
                    <Shield size={18} />
                  </div>
                  <strong>
                    {nextMatch ? dateLabel(nextMatch.date) : "—"}
                    <small>{nextMatch?.time}</small>
                  </strong>
                  <p>{nextMatch ? `Face à ${nextMatch.title}` : "Aucun match programmé"}</p>
                </div>
                <div className="metric">
                  <div>
                    <span>Réponses aux convocations</span>
                    <ClipboardCheck size={18} />
                  </div>
                  <strong>
                    {present}
                    <small>/ {called} présents</small>
                  </strong>
                  <p>
                    <span className="orange-dot" />
                    {nextMatch?.selected.filter(
                      (id) => !nextMatch.responses[id] || nextMatch.responses[id] === "En attente",
                    ).length || 0}{" "}
                    réponses en attente
                  </p>
                </div>
                <div className="metric">
                  <div>
                    <span>Derniers résultats</span>
                    <Trophy size={18} />
                  </div>
                  <strong>
                    {wins}
                    <small>victoires / {results.length} matchs</small>
                  </strong>
                  <p className="form-dots">
                    {results
                      .slice(0, 5)
                      .reverse()
                      .map((e) => {
                        const [a, b] = e.score!.split("–").map(Number);
                        return (
                          <span className={a > b ? "win" : a === b ? "draw" : "loss"} key={e.id}>
                            {a > b ? "V" : a === b ? "N" : "D"}
                          </span>
                        );
                      })}
                  </p>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="panel match-panel">
                  <div className="section-title">
                    <h2>Le prochain rendez-vous</h2>
                    <Tag tone="orange">Championnat · Démo</Tag>
                  </div>
                  {nextMatch ? (
                    <>
                      <div className="match-versus">
                        <div>
                          <Crest />
                          <strong>{club.name}</strong>
                          <span>
                            Domicile / extérieur :{" "}
                            {nextMatch.place.toLowerCase().includes("extérieur")
                              ? "extérieur"
                              : "domicile"}
                          </span>
                        </div>
                        <div className="versus">
                          <span>
                            {dateLabel(nextMatch.date, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <b>VS</b>
                          <span>{nextMatch.time}</span>
                        </div>
                        <div>
                          <Crest opponent />
                          <strong>{nextMatch.title}</strong>
                          <span>Équipe adverse</span>
                        </div>
                      </div>
                      <div className="match-location">
                        <MapPin size={14} />
                        {nextMatch.place}
                      </div>
                      <div className="call-summary">
                        <div className="avatar-stack">
                          {players
                            .filter((p) => nextMatch.selected.includes(p.id))
                            .slice(0, 4)
                            .map((p) => (
                              <span key={p.id}>{initials(p.name)}</span>
                            ))}
                        </div>
                        <p>
                          <strong>{called} joueurs convoqués</strong>
                          <span>
                            {present} présents · {called - present} autres réponses
                          </span>
                        </p>
                        <button
                          className="btn dark"
                          onClick={() => {
                            setActiveEvent(nextMatch.id);
                            changePage(3);
                          }}
                        >
                          Gérer la convocation <ArrowRight size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="empty">
                      Planifiez votre prochain match.
                      <button className="btn primary" onClick={() => openEvent()}>
                        Créer un match
                      </button>
                    </div>
                  )}
                </section>
                <section className="panel agenda-panel">
                  <div className="section-title">
                    <h2>À l’agenda</h2>
                    <button className="text-link" onClick={() => changePage(2)}>
                      Tout voir <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {upcoming.slice(0, 3).map(eventRow)}
                  {!upcoming.length && <p className="empty">Aucun événement à venir.</p>}
                </section>
                <section className="panel presence-panel">
                  <div className="section-title">
                    <div>
                      <h2>Le groupe répond présent</h2>
                      <p className="muted">Disponibilités du prochain match</p>
                    </div>
                    <button
                      className="icon-btn"
                      aria-label="Voir les présences"
                      onClick={() => changePage(3)}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                  <div className="presence-chart">
                    <div
                      className="donut"
                      style={{
                        background: `conic-gradient(#ff6900 0 ${called ? (present / called) * 100 : 0}%, #efefec 0 100%)`,
                      }}
                    >
                      <div>
                        <strong>
                          {called ? Math.round((present / called) * 100) : 0}
                          <small>%</small>
                        </strong>
                        <span>présents</span>
                      </div>
                    </div>
                    <div className="chart-legend">
                      {[
                        ["Présents", present, "orange"],
                        [
                          "En attente",
                          nextMatch?.selected.filter(
                            (id) =>
                              !nextMatch.responses[id] || nextMatch.responses[id] === "En attente",
                          ).length || 0,
                          "gray",
                        ],
                        [
                          "Absents",
                          nextMatch?.selected.filter((id) => nextMatch.responses[id] === "Absent")
                            .length || 0,
                          "black",
                        ],
                      ].map(([label, n, color]) => (
                        <div key={label}>
                          <span className={`legend-dot ${color}`} />
                          <span>{label}</span>
                          <strong>{n}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="panel results-panel">
                  <div className="section-title">
                    <h2>Le coup de sifflet final</h2>
                    <button className="text-link" onClick={() => changePage(4)}>
                      Les stats <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {results.slice(0, 3).map((e) => (
                    <div className="result-row" key={e.id}>
                      <span className="result-date">{dateLabel(e.date)}</span>
                      <span>
                        {club.name}
                        <small>vs {e.title}</small>
                      </span>
                      <b>{e.score}</b>
                      <Tag
                        tone={
                          Number(e.score!.split("–")[0]) > Number(e.score!.split("–")[1])
                            ? "green"
                            : "neutral"
                        }
                      >
                        {Number(e.score!.split("–")[0]) > Number(e.score!.split("–")[1])
                          ? "Victoire"
                          : Number(e.score!.split("–")[0]) === Number(e.score!.split("–")[1])
                            ? "Nul"
                            : "Défaite"}
                      </Tag>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
          {page === 1 && (
            <section className="panel">
              <div className="section-title">
                <h2>
                  L’effectif <span className="count">{players.length}</span>
                </h2>
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Rechercher un joueur"
                    placeholder="Rechercher un joueur…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="tabs">
                {["Tous", ...positions].map((p) => (
                  <button
                    className={filter === p ? "active" : ""}
                    key={p}
                    onClick={() => setFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Joueur</th>
                      <th>N°</th>
                      <th>Poste</th>
                      <th>Disponibilité</th>
                      <th>Buts</th>
                      <th>Passes</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {players
                      .filter(
                        (p) =>
                          (filter === "Tous" || p.position === filter) &&
                          p.name.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td aria-label={p.name}>
                            <div className="player-name">
                              <span className="avatar">{initials(p.name)}</span>
                              <strong>{p.name}</strong>
                            </div>
                          </td>
                          <td>{p.number}</td>
                          <td>{p.position}</td>
                          <td>
                            <Tag tone={p.status === "Disponible" ? "green" : "orange"}>
                              {p.status}
                            </Tag>
                          </td>
                          <td>{p.goals}</td>
                          <td>{p.assists}</td>
                          <td>
                            <button
                              className="icon-btn"
                              aria-label={`Modifier ${p.name}`}
                              onClick={() => openPlayer(p)}
                            >
                              <Pencil size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!players.filter(
                (p) =>
                  (filter === "Tous" || p.position === filter) &&
                  p.name.toLowerCase().includes(search.toLowerCase()),
              ).length && <p className="empty">Aucun joueur trouvé.</p>}
            </section>
          )}
          {page === 2 && (
            <div className="calendar-layout">
              <section className="panel">
                <div className="section-title">
                  <h2 className="capitalize">
                    {month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </h2>
                  <div className="inline">
                    <button
                      className="icon-btn"
                      aria-label="Mois précédent"
                      onClick={() =>
                        setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                      }
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      className="btn subtle"
                      onClick={() => setMonth(new Date("2026-11-01T12:00:00"))}
                    >
                      Novembre 2026
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Mois suivant"
                      onClick={() =>
                        setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                      }
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="calendar">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                    <span className="day-label" key={d}>
                      {d}
                    </span>
                  ))}
                  {Array.from(
                    {
                      length: (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7,
                    },
                    (_, i) => (
                      <div className="day blank" key={"blank" + i} />
                    ),
                  )}
                  {Array.from(
                    { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
                    (_, i) => {
                      const s = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                      return (
                        <div className={`day ${s === today ? "today" : ""}`} key={s}>
                          <span>{i + 1}</span>
                          {events
                            .filter((e) => e.date === s)
                            .map((e) => (
                              <button
                                className={e.type === "Match" ? "match-event" : "training-event"}
                                key={e.id}
                                onClick={() => {
                                  setActiveEvent(e.id);
                                  changePage(3);
                                }}
                              >
                                {e.time} <span>{e.title}</span>
                              </button>
                            ))}
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
              <section className="panel">
                <div className="section-title">
                  <h2>Les événements du mois</h2>
                </div>
                {events
                  .filter((e) =>
                    e.date.startsWith(
                      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                    ),
                  )
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(eventRow)}
                {!events.some((e) =>
                  e.date.startsWith(
                    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                  ),
                ) && <p className="empty">Aucun événement ce mois-ci.</p>}
              </section>
            </div>
          )}
          {page === 3 && (
            <>
              <section className="panel call-header">
                <div>
                  <p className="eyebrow">ÉVÉNEMENT</p>
                  <select
                    aria-label="Choisir un événement"
                    value={selectedEvent?.id || ""}
                    onChange={(e) => setActiveEvent(e.target.value)}
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {dateLabel(e.date)} · {e.type} · {e.title}
                      </option>
                    ))}
                  </select>
                  {selectedEvent && (
                    <p className="muted">
                      {selectedEvent.time} · {selectedEvent.place}
                    </p>
                  )}
                </div>
                <div className="inline">
                  <button
                    className="btn subtle"
                    disabled={!selectedEvent}
                    onClick={() => selectedEvent && openEvent(selectedEvent)}
                  >
                    <Pencil size={15} />
                    Modifier
                  </button>
                  {selectedEvent?.type === "Match" && (
                    <button
                      className="btn dark"
                      onClick={() => {
                        setEditEvent(selectedEvent);
                        setModal("result");
                      }}
                    >
                      Saisir le résultat
                    </button>
                  )}
                </div>
              </section>
              {selectedEvent ? (
                <section className="panel">
                  <div className="section-title">
                    <div>
                      <h2>{selectedEvent.selected.length} joueurs convoqués</h2>
                      <p className="muted">
                        Mode démo : vous saisissez les réponses. Aucune notification n’est envoyée.
                      </p>
                    </div>
                    <button
                      className="btn subtle"
                      onClick={() => {
                        setData((d) => ({
                          ...d,
                          events: d.events.map((e) =>
                            e.id === selectedEvent.id
                              ? {
                                  ...e,
                                  selected: players
                                    .filter((p) => p.status === "Disponible")
                                    .map((p) => p.id),
                                }
                              : e,
                          ),
                        }));
                        notify("Joueurs disponibles sélectionnés");
                      }}
                    >
                      Sélectionner les disponibles
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Convoqué</th>
                          <th>Joueur</th>
                          <th>Poste</th>
                          <th>Réponse / présence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <input
                                type="checkbox"
                                aria-label={`Convoquer ${p.name}`}
                                checked={selectedEvent.selected.includes(p.id)}
                                onChange={() => toggleCall(p.id)}
                              />
                            </td>
                            <td>
                              <div className="player-name">
                                <span className="avatar">{initials(p.name)}</span>
                                <strong>{p.name}</strong>
                                {p.status === "Blessé" && <Tag tone="orange">Blessé</Tag>}
                              </div>
                            </td>
                            <td>{p.position}</td>
                            <td>
                              <select
                                aria-label={`Réponse de ${p.name}`}
                                disabled={!selectedEvent.selected.includes(p.id)}
                                value={selectedEvent.responses[p.id] || "En attente"}
                                onChange={(e) => updateResponse(p.id, e.target.value)}
                              >
                                <option>En attente</option>
                                <option>Présent</option>
                                <option>Absent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <div className="panel empty">
                  Créez un premier événement pour convoquer vos joueurs.
                </div>
              )}
            </>
          )}
          {page === 4 && (
            <>
              <div className="stats-banner">
                <div>
                  <Trophy size={27} />
                  <span>Matchs joués</span>
                  <strong>{results.length}</strong>
                </div>
                <div>
                  <CheckCircle2 size={27} />
                  <span>Victoires</span>
                  <strong>{wins}</strong>
                </div>
                <div>
                  <MoveUpRight size={27} />
                  <span>Buts marqués</span>
                  <strong>{results.reduce((n, e) => n + Number(e.score!.split("–")[0]), 0)}</strong>
                </div>
                <div>
                  <Shield size={27} />
                  <span>Buts encaissés</span>
                  <strong>{results.reduce((n, e) => n + Number(e.score!.split("–")[1]), 0)}</strong>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="section-title">
                    <h2>Les joueurs décisifs</h2>
                    <Tag>Statistiques saisies</Tag>
                  </div>
                  {[...players]
                    .sort((a, b) => b.goals - a.goals)
                    .slice(0, 8)
                    .map((p, i) => (
                      <div className="scorer" key={p.id}>
                        <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                        <span className="avatar">{initials(p.name)}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <p>
                            {p.position} · {p.assists} passes décisives
                          </p>
                        </div>
                        <b>
                          {p.goals}
                          <small>buts</small>
                        </b>
                        <button
                          className="icon-btn"
                          aria-label={`Modifier les statistiques de ${p.name}`}
                          onClick={() => openPlayer(p)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    ))}
                </section>
                <section className="panel">
                  <div className="section-title">
                    <h2>Résultats de l’équipe</h2>
                  </div>
                  {results.map((e) => (
                    <button
                      className="result-row result-button"
                      key={e.id}
                      onClick={() => {
                        setEditEvent(e);
                        setModal("result");
                      }}
                    >
                      <span className="result-date">{dateLabel(e.date)}</span>
                      <span>
                        {e.title}
                        <small>{e.place}</small>
                      </span>
                      <b>{e.score}</b>
                      <Pencil size={15} />
                    </button>
                  ))}
                  <p className="muted note">
                    Les buts individuels sont renseignés séparément dans les fiches joueurs.
                  </p>
                </section>
              </div>
            </>
          )}
          {page === 5 && (
            <div className="settings-grid">
              <section className="panel">
                <div className="section-title">
                  <h2>L’identité du club</h2>
                  <Globe size={20} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setData((d) => ({
                      ...d,
                      club: {
                        name: String(f.get("name")),
                        category: String(f.get("category")),
                        coach: String(f.get("coach")),
                        country: String(f.get("country")),
                        timezone: String(f.get("timezone")),
                      },
                    }));
                    notify("Paramètres du club enregistrés");
                  }}
                >
                  <label>
                    Nom du club
                    <input
                      aria-label="Nom"
                      name="name"
                      defaultValue={club.name}
                      required
                      maxLength={40}
                    />
                  </label>
                  <label>
                    Catégorie
                    <input
                      aria-label="Catégorie"
                      name="category"
                      defaultValue={club.category}
                      required
                    />
                  </label>
                  <label>
                    Prénom du coach
                    <input
                      aria-label="Prénom du coach"
                      name="coach"
                      defaultValue={club.coach}
                      required
                      maxLength={40}
                    />
                  </label>
                  <label>
                    Pays
                    <input
                      aria-label="Pays"
                      name="country"
                      defaultValue={club.country}
                      required
                      placeholder="Votre pays"
                    />
                  </label>
                  <label>
                    Fuseau horaire
                    <select
                      aria-label="Fuseau horaire"
                      name="timezone"
                      defaultValue={club.timezone}
                    >
                      {Array.from(
                        new Set([club.timezone, ...Intl.supportedValuesOf("timeZone")]),
                      ).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <p className="muted note">
                    Les horaires sont saisis dans le fuseau du club. Cette démo ne convertit pas les
                    heures selon le lieu du visiteur.
                  </p>
                  <button className="btn primary" type="submit">
                    <Check size={17} />
                    Enregistrer
                  </button>
                </form>
              </section>
              <section className="panel storage-panel">
                <div className="section-title">
                  <h2>Votre espace de test</h2>
                  <Tag tone="orange">Démo locale</Tag>
                </div>
                <div className="storage-illustration">
                  <Shield size={56} />
                </div>
                <h3>Votre équipe reste avec vous.</h3>
                <p>
                  Les modifications sont sauvegardées uniquement dans ce navigateur. Pas de compte,
                  de partage entre appareils ou d’envoi de messages pour le moment.
                </p>
                <button className="btn dark" onClick={exportData}>
                  <Download size={17} />
                  Exporter ma sauvegarde
                </button>
                <div className="storage-note">
                  <CheckCircle2 size={17} />
                  {storageError
                    ? "Sauvegarde locale indisponible"
                    : "Sauvegarde automatique activée"}
                </div>
              </section>
            </div>
          )}
          <footer>
            <span>
              <span className="footer-mark">XI</span>Le football se joue ensemble.
            </span>
            <span>Version test · Données d’exemple · Sauvegarde locale</span>
          </footer>
        </main>
      </div>
      {toast && (
        <output className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </output>
      )}
      {modal === "player" && (
        <Modal
          title={editPlayer ? "Modifier le joueur" : "Un nouveau talent"}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const number = Number(f.get("number"));
              if (players.some((p) => p.number === number && p.id !== editPlayer?.id)) {
                notify("Ce numéro est déjà attribué à un joueur");
                return;
              }
              const p: Player = {
                id: editPlayer?.id || uid(),
                name: String(f.get("name")).trim(),
                number,
                position: String(f.get("position")),
                status: String(f.get("status")),
                goals: Number(f.get("goals")),
                assists: Number(f.get("assists")),
              };
              if (!p.name) return;
              setData((d) => ({
                ...d,
                players: editPlayer
                  ? d.players.map((x) => (x.id === p.id ? p : x))
                  : [...d.players, p],
              }));
              setModal(null);
              notify(editPlayer ? "Joueur mis à jour" : "Joueur ajouté à l’effectif");
            }}
          >
            <label>
              Nom complet
              <input
                aria-label="Nom"
                name="name"
                defaultValue={editPlayer?.name}
                required
                maxLength={60}
                placeholder="Ex. Amadou Diallo"
              />
            </label>
            <div className="form-grid">
              <label>
                Numéro
                <input
                  aria-label="Numéro"
                  name="number"
                  type="number"
                  min="1"
                  max="99"
                  required
                  defaultValue={
                    editPlayer?.number ||
                    Math.min(99, Math.max(0, ...players.map((p) => p.number)) + 1)
                  }
                />
              </label>
              <label>
                Poste
                <select
                  aria-label="Poste"
                  name="position"
                  defaultValue={editPlayer?.position || "Milieu"}
                >
                  {positions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Disponibilité
              <select
                aria-label="Disponibilité"
                name="status"
                defaultValue={editPlayer?.status || "Disponible"}
              >
                <option>Disponible</option>
                <option>Blessé</option>
                <option>Indisponible</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                Buts
                <input
                  aria-label="Buts"
                  name="goals"
                  type="number"
                  min="0"
                  max="999"
                  defaultValue={editPlayer?.goals || 0}
                  required
                />
              </label>
              <label>
                Passes décisives
                <input
                  aria-label="Passes décisives"
                  name="assists"
                  type="number"
                  min="0"
                  max="999"
                  defaultValue={editPlayer?.assists || 0}
                  required
                />
              </label>
            </div>
            <button className="btn primary full" type="submit">
              {editPlayer ? "Enregistrer les modifications" : "Ajouter le joueur"}
              <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "event" && (
        <Modal
          title={editEvent ? "Modifier l’événement" : "On se retrouve sur le terrain"}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const event: Event = {
                id: editEvent?.id || uid(),
                type: String(f.get("type")),
                title: String(f.get("title")).trim(),
                date: String(f.get("date")),
                time: String(f.get("time")),
                place: String(f.get("place")).trim(),
                selected: editEvent?.selected || [],
                responses: editEvent?.responses || {},
                score: editEvent?.score,
              };
              if (!event.title || !event.place) return;
              setData((d) => ({
                ...d,
                events: editEvent
                  ? d.events.map((x) => (x.id === event.id ? event : x))
                  : [...d.events, event],
              }));
              setActiveEvent(event.id);
              setModal(null);
              notify(
                editEvent
                  ? "Événement mis à jour"
                  : "Événement créé — vous pouvez convoquer les joueurs",
              );
            }}
          >
            <label>
              Type
              <select aria-label="Type" name="type" defaultValue={editEvent?.type || "Match"}>
                <option>Match</option>
                <option>Entraînement</option>
              </select>
            </label>
            <label>
              Adversaire ou titre de la séance
              <input
                aria-label="Adversaire ou titre"
                name="title"
                defaultValue={editEvent?.title}
                required
                maxLength={60}
                placeholder="Ex. AS Horizon ou séance technique"
              />
            </label>
            <div className="form-grid">
              <label>
                Date
                <input
                  aria-label="Date"
                  name="date"
                  type="date"
                  defaultValue={editEvent?.date || "2026-11-15"}
                  required
                />
              </label>
              <label>
                Heure
                <input
                  aria-label="Heure"
                  name="time"
                  type="time"
                  defaultValue={editEvent?.time || "19:00"}
                  required
                />
              </label>
            </div>
            <label>
              Lieu
              <input
                aria-label="Lieu"
                name="place"
                required
                defaultValue={editEvent?.place}
                maxLength={80}
                placeholder="Stade, terrain · domicile / extérieur"
              />
            </label>
            <p className="muted note">Heure locale du club : {club.timezone}</p>
            <button className="btn primary full" type="submit">
              {editEvent ? "Enregistrer" : "Créer l’événement"}
              <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "result" && editEvent && (
        <Modal title={`Résultat · ${editEvent.title}`} onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const score = `${Number(f.get("for"))}–${Number(f.get("against"))}`;
              setData((d) => ({
                ...d,
                events: d.events.map((x) => (x.id === editEvent.id ? { ...x, score } : x)),
              }));
              setModal(null);
              notify("Résultat enregistré");
            }}
          >
            <p className="muted">{dateLabel(editEvent.date)} · Score final</p>
            <div className="form-grid">
              <label>
                Buts de {club.name}
                <input
                  aria-label="Buts du club"
                  type="number"
                  name="for"
                  min="0"
                  max="99"
                  defaultValue={editEvent.score?.split("–")[0] || 0}
                  required
                />
              </label>
              <label>
                Buts adverses
                <input
                  aria-label="Buts adverses"
                  type="number"
                  name="against"
                  min="0"
                  max="99"
                  defaultValue={editEvent.score?.split("–")[1] || 0}
                  required
                />
              </label>
            </div>
            <button className="btn primary full" type="submit">
              Enregistrer le résultat
              <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Bienvenue dans votre vestiaire" onClose={() => setModal(null)}>
          <div className="help-content">
            <p>
              <b>1. Votre effectif</b>
              <br />
              Ajoutez vos joueurs et renseignez leurs postes et disponibilités.
            </p>
            <p>
              <b>2. Votre calendrier</b>
              <br />
              Créez un match ou un entraînement, puis ouvrez-le dans Convocations.
            </p>
            <p>
              <b>3. Votre groupe</b>
              <br />
              Sélectionnez les joueurs et saisissez leurs réponses ou présences.
            </p>
            <p>
              <b>4. Vos statistiques</b>
              <br />
              Saisissez les scores des matchs et les buts / passes dans les fiches joueurs.
            </p>
            <div className="warning">
              Version test : les données restent dans ce navigateur. Les exemples sont datés de
              novembre 2026. Aucun message n’est envoyé aux joueurs.
            </div>
            <button className="btn primary full" onClick={() => setModal(null)}>
              C’est parti <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
