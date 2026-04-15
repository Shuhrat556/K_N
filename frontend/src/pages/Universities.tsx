import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { universities, type University } from "../data/universities";
import { t } from "../i18n/translations";
import { useAppStore } from "../store/useAppStore";

type Loc = "all" | University["location"];
type Dist = "all" | University["district"];
type Study = "all" | University["studyType"];
type LangF = "all" | University["language"];
type Price = "all" | University["price"];

function locLabel(lang: "ru" | "tg", loc: Loc) {
  const map: Record<"ru" | "tg", Record<string, string>> = {
    ru: {
      all: "Все",
      dushanbe: "Душанбе",
      moscow: "Москва",
      remote: "Онлайн",
      bokhtar: "Бохтар",
      khujand: "Худжанд",
    },
    tg: {
      all: "Ҳама",
      dushanbe: "Душанбе",
      moscow: "Москва",
      remote: "Онлайн",
      bokhtar: "Бохтар",
      khujand: "Хучанд",
    },
  };
  return map[lang][loc] ?? loc;
}

function studyLabel(lang: "ru" | "tg", v: Study) {
  const map: Record<"ru" | "tg", Record<string, string>> = {
    ru: {
      all: "Все",
      "full-time": "Очная",
      "part-time": "Заочная",
      online: "Дистанционно",
    },
    tg: {
      all: "Ҳама",
      "full-time": "Ҳозирагӣ",
      "part-time": "ғоибона",
      online: "Онлайн",
    },
  };
  return map[lang][v] ?? v;
}

function langLabel(lang: "ru" | "tg", v: LangF) {
  const map: Record<"ru" | "tg", Record<string, string>> = {
    ru: { all: "Все", ru: "Русский", tj: "Таджикский", en: "Английский", mixed: "Смешанный" },
    tg: { all: "Ҳама", ru: "Русӣ", tj: "Тоҷикӣ", en: "Англисӣ", mixed: "Омехта" },
  };
  return map[lang][v] ?? v;
}

function priceLabel(lang: "ru" | "tg", v: Price) {
  if (v === "all") return t(lang, "all");
  if (v === "free") return t(lang, "price_free");
  return t(lang, "price_paid");
}

function distLabel(lang: "ru" | "tg", v: Dist) {
  const map: Record<"ru" | "tg", Record<string, string>> = {
    ru: { all: "Все", center: "Центр", north: "Север", south: "Юг", remote: "Онлайн" },
    tg: { all: "Ҳама", center: "Марказ", north: "Шимол", south: "Ҷануб", remote: "Онлайн" },
  };
  return map[lang][v] ?? v;
}

export function Universities() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [loc, setLoc] = useState<Loc>("all");
  const [dist, setDist] = useState<Dist>("all");
  const [study, setStudy] = useState<Study>("all");
  const [langF, setLangF] = useState<LangF>("all");
  const [price, setPrice] = useState<Price>("all");

  const filtered = useMemo(() => {
    const rows = universities.filter((u) => {
      if (loc !== "all" && u.location !== loc) return false;
      if (dist !== "all" && u.district !== dist) return false;
      if (study !== "all" && u.studyType !== study) return false;
      if (langF !== "all" && u.language !== langF) return false;
      if (price !== "all" && u.price !== price) return false;
      return true;
    });
    return [...rows].sort((a, b) => b.requirementScore - a.requirementScore);
  }, [loc, dist, study, langF, price]);

  const chip = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => {
    const active = value === current;
    return (
      <motion.button
        type="button"
        onClick={() => set(value)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        className={[
          "rounded-full px-3 py-2 text-sm font-extrabold ring-1 sm:py-1 sm:text-xs",
          active
            ? "bg-slate-900 text-white ring-slate-900 dark:bg-sky-600 dark:ring-sky-500"
            : "bg-white/80 text-ink-800 ring-slate-200/70 dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-600/80",
        ].join(" ")}
      >
        {label}
      </motion.button>
    );
  };

  return (
    <div className="page-shell flex min-h-full flex-col pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-base font-extrabold text-ink-900 dark:text-slate-50 sm:text-sm">{t(lang, "universities_title")}</div>
          <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-slate-300 sm:text-xs">{t(lang, "universities_sub")}</div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/80 dark:bg-slate-900/90 px-4 py-2 text-xs font-extrabold text-ink-900 dark:text-slate-50 shadow-card ring-1 ring-slate-200/70 dark:ring-slate-700/80"
          >
            {t(lang, "back")}
          </motion.button>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mt-8 rounded-3xl bg-white/80 dark:bg-slate-900/90 p-6 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_location")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "dushanbe", "moscow", "remote", "bokhtar", "khujand"] as const).map((v) => chip(v, loc, setLoc, locLabel(lang, v)))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_district")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "center", "north", "south", "remote"] as const).map((v) => chip(v, dist, setDist, distLabel(lang, v)))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_type")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "full-time", "part-time", "online"] as const).map((v) => chip(v, study, setStudy, studyLabel(lang, v)))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_lang")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "ru", "tj", "en", "mixed"] as const).map((v) => chip(v, langF, setLangF, langLabel(lang, v)))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-ink-500 dark:text-slate-400">{t(lang, "filter_price")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "free", "paid"] as const).map((v) => chip(v, price, setPrice, priceLabel(lang, v)))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {filtered.map((u, i) => (
          <motion.article
            key={u.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white/85 dark:bg-slate-900/92 p-6 shadow-soft ring-1 ring-slate-200/70 dark:ring-slate-700/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold text-ink-900 dark:text-slate-50">{u.name}</div>
                <div className="mt-1 text-xs font-semibold text-ink-600 dark:text-slate-300">
                  {t(lang, "uni_faculty")}: {u.faculty}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-ink-800 dark:text-slate-200">{locLabel(lang, u.location as Loc)}</span>
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-ink-800 dark:text-slate-200">{distLabel(lang, u.district as Dist)}</span>
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-ink-800 dark:text-slate-200">{studyLabel(lang, u.studyType)}</span>
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-ink-800 dark:text-slate-200">{langLabel(lang, u.language as LangF)}</span>
                  <span className="rounded-full bg-slate-900/5 px-2 py-1 text-ink-800 dark:text-slate-200">{priceLabel(lang, u.price)}</span>
                </div>
              </div>
              <div className="shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 px-3 py-2 text-xs font-black text-white shadow-soft">
                {u.requirementScore}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-ink-600 dark:text-slate-300">Demo sort: higher score = stricter entry (as requested).</div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
