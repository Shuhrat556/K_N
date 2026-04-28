import { FormEvent, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  createAcademicFaculty,
  createAcademicSpecialty,
  createAcademicUniversity,
  deleteAcademicFaculty,
  deleteAcademicSpecialty,
  deleteAcademicUniversity,
  fetchAdminAcademicSpecialties,
  fetchAcademicFaculties,
  fetchAcademicUniversities,
  importAcademicExcel,
  updateAcademicFaculty,
  updateAcademicSpecialty,
  updateAcademicUniversity,
} from "../../api/kasbnoma";
import type { AcademicFaculty, AcademicSpecialty, AcademicUniversity } from "../../api/types";

type Props = {
  inputClass: string;
  sectionCardClass: string;
};

export function AdminAcademicTab({ inputClass, sectionCardClass }: Props) {
  const [universities, setUniversities] = useState<AcademicUniversity[]>([]);
  const [faculties, setFaculties] = useState<AcademicFaculty[]>([]);
  const [specialties, setSpecialties] = useState<AcademicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [uniName, setUniName] = useState("");
  const [uniCity, setUniCity] = useState("");
  const [uniDistrict, setUniDistrict] = useState("");

  const [facultyUniversityId, setFacultyUniversityId] = useState<number>(0);
  const [facultyName, setFacultyName] = useState("");

  const [specFacultyId, setSpecFacultyId] = useState<number>(0);
  const [specCode, setSpecCode] = useState("");
  const [specName, setSpecName] = useState("");
  const [specMode, setSpecMode] = useState("");
  const [specLang, setSpecLang] = useState("");
  const [specTuition, setSpecTuition] = useState("");
  const [specAdmission, setSpecAdmission] = useState("");

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, f, s] = await Promise.all([
        fetchAcademicUniversities(),
        fetchAcademicFaculties(),
        fetchAdminAcademicSpecialties(search ? { q: search } : undefined),
      ]);
      setUniversities(u);
      setFaculties(f);
      setSpecialties(s);
      if (u.length > 0) setFacultyUniversityId((prev) => prev || u[0].id);
      if (f.length > 0) setSpecFacultyId((prev) => prev || f[0].id);
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredSpecialties = useMemo(() => {
    if (!search.trim()) return specialties;
    const q = search.trim().toLowerCase();
    return specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code ?? "").toLowerCase().includes(q) ||
        (s.faculty_code ?? "").toLowerCase().includes(q) ||
        (s.degree ?? "").toLowerCase().includes(q) ||
        (s.admission_quota ?? "").toLowerCase().includes(q) ||
        s.university_name.toLowerCase().includes(q) ||
        s.faculty_name.toLowerCase().includes(q),
    );
  }, [specialties, search]);

  const onCreateUniversity = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAcademicUniversity({
        name: uniName.trim(),
        city: uniCity.trim() || null,
        district: uniDistrict.trim() || null,
      });
      setUniName("");
      setUniCity("");
      setUniDistrict("");
      setMessage("Университет добавлен");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить университет");
    }
  };

  const onCreateFaculty = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAcademicFaculty({ university_id: facultyUniversityId, name: facultyName.trim() });
      setFacultyName("");
      setMessage("Факультет добавлен");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить факультет");
    }
  };

  const onCreateSpecialty = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAcademicSpecialty({
        faculty_id: specFacultyId,
        code: specCode.trim() || null,
        name: specName.trim(),
        study_mode: specMode.trim() || null,
        language: specLang.trim() || null,
        tuition: specTuition.trim() || null,
        admission_quota: specAdmission.trim() || null,
      });
      setSpecCode("");
      setSpecName("");
      setSpecMode("");
      setSpecLang("");
      setSpecTuition("");
      setSpecAdmission("");
      setMessage("Специальность добавлена");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось добавить специальность");
    }
  };

  const onDeleteUniversity = async (id: number) => {
    if (!window.confirm("Удалить университет?")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteAcademicUniversity(id);
      setMessage("Университет удалён");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось удалить университет");
    }
  };

  const onEditUniversity = async (u: AcademicUniversity) => {
    const name = window.prompt("Название университета", u.name);
    if (name == null) return;
    const city = window.prompt("Город", u.city ?? "") ?? "";
    const district = window.prompt("Район", u.district ?? "") ?? "";
    setError(null);
    setMessage(null);
    try {
      await updateAcademicUniversity(u.id, {
        name: name.trim() || u.name,
        city: city.trim() || null,
        district: district.trim() || null,
      });
      setMessage("Университет обновлён");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось изменить университет");
    }
  };

  const onDeleteFaculty = async (id: number) => {
    if (!window.confirm("Удалить факультет?")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteAcademicFaculty(id);
      setMessage("Факультет удалён");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось удалить факультет");
    }
  };

  const onEditFaculty = async (f: AcademicFaculty) => {
    const name = window.prompt("Название факультета", f.name);
    if (name == null) return;
    setError(null);
    setMessage(null);
    try {
      await updateAcademicFaculty(f.id, { name: name.trim() || f.name });
      setMessage("Факультет обновлён");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось изменить факультет");
    }
  };

  const onDeleteSpecialty = async (id: number) => {
    if (!window.confirm("Удалить специальность?")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteAcademicSpecialty(id);
      setMessage("Специальность удалена");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось удалить специальность");
    }
  };

  const onEditSpecialty = async (s: AcademicSpecialty) => {
    const code = window.prompt("Код", s.code ?? "") ?? "";
    const name = window.prompt("Название специальности", s.name);
    if (name == null) return;
    const study_mode = window.prompt("Форма обучения", s.study_mode ?? "") ?? "";
    const language = window.prompt("Язык обучения", s.language ?? "") ?? "";
    const tuition = window.prompt("Оплата / бесплатно", s.tuition ?? "") ?? "";
    const admission_quota = window.prompt("Нақшаи қабул / план набора", s.admission_quota ?? "") ?? "";
    setError(null);
    setMessage(null);
    try {
      await updateAcademicSpecialty(s.id, {
        code: code.trim() || null,
        name: name.trim() || s.name,
        study_mode: study_mode.trim() || null,
        language: language.trim() || null,
        tuition: tuition.trim() || null,
        admission_quota: admission_quota.trim() || null,
      });
      setMessage("Специальность обновлена");
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Не удалось изменить специальность");
    }
  };

  const onImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setError("Выберите файл Excel");
      return;
    }
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await importAcademicExcel(excelFile, clearExisting);
      setMessage(
        `Импорт завершён: строк ${res.rows_imported}, добавлено университетов ${res.universities_created}, факультетов ${res.faculties_created}, специальностей ${res.specialties_created}`,
      );
      setExcelFile(null);
      await loadAll();
    } catch (err) {
      setError(isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : "Ошибка импорта");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className={`mt-6 ${sectionCardClass}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-slate-50">Университеты / факультеты / специальности</h2>
            <p className="mt-1 text-sm font-medium text-ink-600 dark:text-slate-300">
              Только реальные данные. Импорт из Excel (несколько листов).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="rounded-2xl bg-white/90 px-4 py-2 text-xs font-extrabold text-ink-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
          >
            {loading ? "Обновление…" : "Обновить"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {message ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/50">
              {message}
            </span>
          ) : null}
          {error ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/50">
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <form onSubmit={onImport} className={`mt-6 ${sectionCardClass}`}>
        <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Импорт Excel</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="file"
            accept=".xlsx"
            className={inputClass}
            onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
          />
          <label className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-bold text-ink-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600">
            <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} />
            Очистить каталог перед импортом
          </label>
        </div>
        <button
          type="submit"
          disabled={importing}
          className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
        >
          {importing ? "Импорт…" : "Загрузить из Excel"}
        </button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form onSubmit={onCreateUniversity} className={sectionCardClass}>
          <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Добавить университет</h3>
          <div className="mt-3 space-y-2">
            <input className={inputClass} placeholder="Название" value={uniName} onChange={(e) => setUniName(e.target.value)} required />
            <input className={inputClass} placeholder="Город" value={uniCity} onChange={(e) => setUniCity(e.target.value)} />
            <input className={inputClass} placeholder="Район" value={uniDistrict} onChange={(e) => setUniDistrict(e.target.value)} />
          </div>
          <button type="submit" className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white dark:bg-indigo-600">
            Добавить
          </button>
        </form>

        <form onSubmit={onCreateFaculty} className={sectionCardClass}>
          <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Добавить факультет</h3>
          <div className="mt-3 space-y-2">
            <select className={inputClass} value={facultyUniversityId || ""} onChange={(e) => setFacultyUniversityId(Number(e.target.value))} required>
              <option value="" disabled>
                Выберите университет
              </option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Название факультета" value={facultyName} onChange={(e) => setFacultyName(e.target.value)} required />
          </div>
          <button type="submit" className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white dark:bg-indigo-600">
            Добавить
          </button>
        </form>

        <form onSubmit={onCreateSpecialty} className={sectionCardClass}>
          <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Добавить специальность</h3>
          <div className="mt-3 space-y-2">
            <select className={inputClass} value={specFacultyId || ""} onChange={(e) => setSpecFacultyId(Number(e.target.value))} required>
              <option value="" disabled>
                Выберите факультет
              </option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Код (необязательно)" value={specCode} onChange={(e) => setSpecCode(e.target.value)} />
            <input className={inputClass} placeholder="Название специальности" value={specName} onChange={(e) => setSpecName(e.target.value)} required />
            <input className={inputClass} placeholder="Форма обучения" value={specMode} onChange={(e) => setSpecMode(e.target.value)} />
            <input className={inputClass} placeholder="Язык обучения" value={specLang} onChange={(e) => setSpecLang(e.target.value)} />
            <input className={inputClass} placeholder="Оплата / бесплатно" value={specTuition} onChange={(e) => setSpecTuition(e.target.value)} />
            <input className={inputClass} placeholder="Нақшаи қабул" value={specAdmission} onChange={(e) => setSpecAdmission(e.target.value)} />
          </div>
          <button type="submit" className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white dark:bg-indigo-600">
            Добавить
          </button>
        </form>
      </div>

      <div className={`mt-6 ${sectionCardClass}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-base font-extrabold text-ink-900 dark:text-slate-50">Текущие данные</h3>
          <input
            className={inputClass + " max-w-xs"}
            placeholder="Поиск…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Университеты</div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {universities.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50/90 px-3 py-2 text-sm ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-600">
                  <div>
                    <div className="font-semibold text-ink-900 dark:text-slate-100">{u.name}</div>
                    <div className="text-xs text-ink-500 dark:text-slate-400">
                      {[u.region, u.city, u.district].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-slate-400">
                      {u.phone ?? "телефон не указан"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void onEditUniversity(u)}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white dark:bg-indigo-600"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteUniversity(u.id)}
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/90 dark:bg-slate-900 dark:text-rose-300 dark:ring-rose-900/50"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Факультеты</div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {faculties.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50/90 px-3 py-2 text-sm ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-600">
                  <div>
                    <div className="font-semibold text-ink-900 dark:text-slate-100">
                      {f.code ? `${f.code} — ` : ""}
                      {f.name}
                    </div>
                    <div className="text-xs text-ink-500 dark:text-slate-400">{f.university_name ?? `university_id: ${f.university_id}`}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void onEditFaculty(f)}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white dark:bg-indigo-600"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteFaculty(f.id)}
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/90 dark:bg-slate-900 dark:text-rose-300 dark:ring-rose-900/50"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-slate-400">Специальности</div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {filteredSpecialties.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50/90 px-3 py-2 text-sm ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-600">
                  <div>
                    <div className="font-semibold text-ink-900 dark:text-slate-100">
                      {s.code ? `${s.code} — ` : ""}
                      {s.name}
                    </div>
                    <div className="text-xs text-ink-500 dark:text-slate-400">
                      {s.university_name} · {s.faculty_code ? `${s.faculty_code} — ` : ""}
                      {s.faculty_name}
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-slate-400">
                      Нақша: {s.admission_quota ?? "—"} · Дараҷа: {s.degree ?? "—"} · Нарх: {s.price ?? "—"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void onEditSpecialty(s)}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white dark:bg-indigo-600"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteSpecialty(s.id)}
                      className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/90 dark:bg-slate-900 dark:text-rose-300 dark:ring-rose-900/50"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
