import { useEffect, useState } from "react";
export type Player = {
  id: string;
  name: string;
  number: number;
  position: string;
  status: string;
  goals: number;
  assists: number;
};
export type Event = {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  place: string;
  selected: string[];
  responses: Record<string, string>;
  score?: string;
};
export type Club = {
  name: string;
  category: string;
  country: string;
  timezone: string;
  coach: string;
};
export type Data = { club: Club; players: Player[]; events: Event[] };
export const positions = ["Gardien", "Défenseur", "Milieu", "Attaquant"];
const names = [
  "Lucas Martin",
  "Amadou Diallo",
  "Thomas Bernard",
  "Yanis Benali",
  "Hugo Petit",
  "Ibrahim Koné",
  "Nathan Robert",
  "Adam Dupont",
  "Moussa Traoré",
  "Léo Moreau",
  "Sami Haddad",
  "Jules Laurent",
  "Noah Simon",
  "Karim Fall",
  "Ethan Leroy",
  "Ali Touré",
  "Maxime Roux",
  "Oumar Diop",
];
export const initial: Data = {
  club: {
    name: "FC Étoile",
    category: "Seniors · Équipe première",
    country: "France",
    timezone: "Europe/Paris",
    coach: "Alex",
  },
  players: names.map((name, i) => ({
    id: String(i + 1),
    name,
    number: i + 1,
    position: i < 2 ? "Gardien" : i < 8 ? "Défenseur" : i < 14 ? "Milieu" : "Attaquant",
    status: i === 5 ? "Blessé" : "Disponible",
    goals: [0, 0, 1, 0, 2, 0, 1, 2, 4, 3, 1, 0, 2, 1, 7, 5, 3, 2][i],
    assists: i % 4,
  })),
  events: [
    {
      id: "e1",
      type: "Match",
      title: "AS Horizon",
      date: "2026-11-15",
      time: "15:00",
      place: "Stade des Étoiles · Domicile",
      selected: names.slice(0, 14).map((_, i) => String(i + 1)),
      responses: Object.fromEntries(
        names
          .slice(0, 14)
          .map((_, i) => [String(i + 1), i < 10 ? "Présent" : i === 10 ? "Absent" : "En attente"]),
      ),
    },
    {
      id: "e2",
      type: "Entraînement",
      title: "Technique & possession",
      date: "2026-11-12",
      time: "19:00",
      place: "Terrain principal",
      selected: names.map((_, i) => String(i + 1)),
      responses: {},
    },
    {
      id: "e3",
      type: "Entraînement",
      title: "Préparation du match",
      date: "2026-11-13",
      time: "19:00",
      place: "Terrain principal",
      selected: names.map((_, i) => String(i + 1)),
      responses: {},
    },
    {
      id: "e4",
      type: "Match",
      title: "Olympique du Parc",
      date: "2026-11-08",
      time: "15:00",
      place: "Extérieur",
      selected: names.slice(0, 14).map((_, i) => String(i + 1)),
      responses: {},
      score: "3–1",
    },
    {
      id: "e5",
      type: "Match",
      title: "US Montval",
      date: "2026-11-01",
      time: "15:00",
      place: "Domicile",
      selected: [],
      responses: {},
      score: "2–2",
    },
    {
      id: "e6",
      type: "Match",
      title: "FC Rivière",
      date: "2026-10-25",
      time: "15:00",
      place: "Extérieur",
      selected: [],
      responses: {},
      score: "2–0",
    },
  ],
};
export const uid = () => crypto.randomUUID();
export const dateLabel = (
  s: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) => new Date(s + "T12:00:00").toLocaleDateString("fr-FR", options);
export const initials = (s: string) =>
  s
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
export function useClub() {
  const [data, setData] = useState<Data>(() => {
    try {
      const raw = localStorage.getItem("clubxi-v1");
      return raw ? JSON.parse(raw) : structuredClone(initial);
    } catch {
      return structuredClone(initial);
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("clubxi-v1", JSON.stringify(data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data]);
  return { data, setData, storageError };
}
