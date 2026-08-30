export const CATEGORIES = [
  {
    id: "GIDA",
    icon: "restaurant",
    color: "#F97316",
    bg: "rgba(249,115,22,0.12)",
  },
  {
    id: "İLAÇ",
    icon: "medkit",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.12)",
  },
  {
    id: "BARINMA",
    icon: "home",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
  },
];

export const PRIORITIES = [
  {
    value: "DÜŞÜK",
    label: "DÜŞÜK",
    desc: "Genel ihtiyaç / düşük risk",
    icon: "time-outline",
    color: "#64748B",
    urgency: 0.3,
  },
  {
    value: "ACİL",
    label: "ACİL",
    desc: "Hızlı müdahale gerekir",
    icon: "warning-outline",
    color: "#F97316",
    urgency: 0.7,
  },
  {
    value: "KRİTİK",
    label: "KRİTİK",
    desc: "Hayati risk / öncelikli müdahale",
    icon: "alert-circle",
    color: "#EF4444",
    urgency: 1.0,
  },
];

export const PEOPLE_OPTIONS = [
  { label: "1 Kişi", value: 1 },
  { label: "2-5 Kişi", value: 5 },
  { label: "5+ Kişi", value: 10 },
];
