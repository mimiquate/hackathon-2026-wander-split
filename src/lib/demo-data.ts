// Ported verbatim from ui_kits/app/data.js in the "wonderSplit Design
// System" project — the single source every landing-page section reads
// from, so a person's avatar color (or a stop's details) never drifts
// between sections.

export interface CrewMember {
  name: string;
  colorIndex: number;
}

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
}

export interface Expense {
  label: string;
  meta: string;
  amount: string;
  converted?: string;
  who: number[];
}

export interface Settlement {
  from: number;
  to: number;
  amount: string;
}

export const crew: CrewMember[] = [
  { name: "Juan", colorIndex: 0 },
  { name: "María", colorIndex: 3 },
  { name: "Sofi", colorIndex: 1 },
  { name: "Nico", colorIndex: 2 },
  { name: "Tomi", colorIndex: 4 },
  { name: "Ale", colorIndex: 0 },
];

export const stops: Stop[] = [
  {
    city: "Lisboa",
    dates: "12–14 oct",
    nights: 2,
    state: "booked",
    items: [
      { label: "Vuelo EZE → LIS", icon: "plane" },
      { label: "Airbnb Alfama", icon: "bed-double" },
    ],
  },
  {
    city: "Oporto",
    dates: "14–16 oct",
    nights: 2,
    state: "urgent",
    items: [
      { label: "Tren Lisboa–Oporto", icon: "train-front" },
      { label: "Hostal Ribeira", icon: "bed-double" },
    ],
  },
  {
    city: "Sevilla",
    dates: "16–19 oct",
    nights: 3,
    state: "thinking",
    items: [
      { label: "Bus Oporto–Sevilla", icon: "bus" },
      { label: "Airbnb Triana (4 de 6)", icon: "bed-double" },
    ],
  },
];

export const expenses: Expense[] = [
  {
    label: "Tren Lisboa–Oporto",
    meta: "pagó Juan · 12 oct",
    amount: "€62,00",
    converted: "US$68,40",
    who: [0, 1, 2],
  },
  {
    label: "Airbnb Alfama",
    meta: "pagó María · 11 oct",
    amount: "€384,00",
    converted: "US$423,00",
    who: [0, 1, 2, 3, 4, 5],
  },
  {
    label: "Cena en Cais do Sodré",
    meta: "pagó Sofi · 13 oct",
    amount: "€96,50",
    converted: "US$106,30",
    who: [1, 2, 4],
  },
  {
    label: "Airbnb Triana",
    meta: "pagó María · 4 de 6",
    amount: "US$210,00",
    who: [1, 2, 3, 5],
  },
  {
    label: "Alquiler de bicis",
    meta: "pagó Nico · 15 oct",
    amount: "€24,00",
    converted: "US$26,40",
    who: [2, 3],
  },
];

export const settlements: Settlement[] = [
  { from: 0, to: 1, amount: "US$50" },
  { from: 2, to: 1, amount: "US$18" },
  { from: 4, to: 3, amount: "US$34" },
];
