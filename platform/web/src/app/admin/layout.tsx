import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Админ · специальности</div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin/upload"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Загрузка Excel
            </Link>
            <Link
              href="/admin/table"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Таблица
            </Link>
            <Link href="/" className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400">
              На главную
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
