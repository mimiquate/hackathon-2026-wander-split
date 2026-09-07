// Ported verbatim from the "Apps landing page UI mockup" project's
// `Landing Page.dc.html` handoff — specifically the embedded `renderVals()`
// data (crew, ledger rows, settlements, stops). This is the actual page
// spec (found after the fact); it supersedes the "wonderSplit Design
// System" project's ui_kits/app/data.js, which was a different, unrelated
// demo dataset for the mobile app screens.

export interface CrewMember {
  name: string;
  colorIndex: number;
}

export const crew: CrewMember[] = [
  { name: "María", colorIndex: 1 },
  { name: "Juan", colorIndex: 2 },
  { name: "Sofi", colorIndex: 3 },
  { name: "Nico", colorIndex: 4 },
  { name: "Tomás", colorIndex: 5 },
  { name: "Ale", colorIndex: 1 },
];

export const crew6 = crew;
export const crew4 = crew.slice(0, 4);
export const crew3 = crew.slice(1, 4);

export interface Settlement {
  from: CrewMember;
  to: CrewMember;
  amount: string;
  done?: boolean;
}

// The hero card's settle row and Gastos' first settle row are the same
// transfer (Juan → María, US$50,00) per the spec's own renderVals().
export const settleHero: Settlement = { from: crew[1], to: crew[0], amount: "US$50,00" };
export const settle1: Settlement = settleHero;
export const settle2: Settlement = { from: crew[2], to: crew[0], amount: "US$128,00" };
export const settle3: Settlement = {
  from: crew[3],
  to: crew[4],
  amount: "US$74,50",
  done: true,
};

export const settlements: Settlement[] = [settle1, settle2, settle3];
export const gastosTotal = "US$1.386,40";

export interface LedgerEntry {
  label: string;
  meta: string;
  amount: string;
  converted?: string;
  people: CrewMember[];
}

export const heroLedger: LedgerEntry[] = [
  {
    label: "Depa en Triana",
    meta: "pagó María · 12 oct · Sevilla",
    amount: "€620,00",
    converted: "US$684,00",
    people: crew4,
  },
  {
    label: "AVE a Madrid",
    meta: "pagó Juan · 15 oct",
    amount: "€62,00",
    converted: "US$68,40",
    people: crew6,
  },
];

export interface StopItem {
  label: string;
  icon: string;
}

export interface Stop {
  city: string;
  dates: string;
  nights: number;
  state: "thinking" | "urgent" | "booked";
  items: StopItem[];
  people: CrewMember[];
}

export const stops: Stop[] = [
  {
    city: "Sevilla",
    dates: "12–15 oct",
    nights: 3,
    state: "booked",
    items: [
      { label: "Depa en Triana", icon: "bed" },
      { label: "Vuelo EZE → SVQ", icon: "plane" },
    ],
    people: crew6,
  },
  {
    city: "Madrid",
    dates: "15–17 oct",
    nights: 2,
    state: "urgent",
    items: [
      { label: "AVE desde Sevilla", icon: "train-front" },
      { label: "Hostel en Malasaña", icon: "bed" },
    ],
    people: crew4,
  },
  {
    city: "Barcelona",
    dates: "17–19 oct",
    nights: 2,
    state: "thinking",
    items: [
      { label: "Tren a Barcelona", icon: "train-front" },
      { label: "Airbnb en Gràcia", icon: "bed" },
    ],
    people: crew3,
  },
];
