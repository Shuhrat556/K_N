export type University = {
  id: string;
  name: string;
  faculty: string;
  location: string;
  district: string;
  studyType: "full-time" | "part-time" | "online";
  language: "ru" | "tj" | "en" | "mixed";
  price: "free" | "paid";
  /** Higher score = stricter / more competitive (demo sorting) */
  requirementScore: number;
};

export const universities: University[] = [
  {
    id: "u1",
    name: "TNU (demo)",
    faculty: "Медицина / тиббӣ",
    location: "dushanbe",
    district: "center",
    studyType: "full-time",
    language: "tj",
    price: "paid",
    requirementScore: 88,
  },
  {
    id: "u2",
    name: "RUDN track (demo)",
    faculty: "Экономика / иқтисод",
    location: "moscow",
    district: "center",
    studyType: "online",
    language: "ru",
    price: "paid",
    requirementScore: 82,
  },
  {
    id: "u3",
    name: "Open courses hub (demo)",
    faculty: "IT / барномасозӣ",
    location: "remote",
    district: "remote",
    studyType: "online",
    language: "mixed",
    price: "free",
    requirementScore: 40,
  },
  {
    id: "u4",
    name: "Polytech evening (demo)",
    faculty: "Инженерия / муҳандисӣ",
    location: "khujand",
    district: "north",
    studyType: "part-time",
    language: "ru",
    price: "paid",
    requirementScore: 74,
  },
  {
    id: "u5",
    name: "Regional institute (demo)",
    faculty: "Педагогика / педагогика",
    location: "bokhtar",
    district: "south",
    studyType: "full-time",
    language: "tj",
    price: "free",
    requirementScore: 62,
  },
];
