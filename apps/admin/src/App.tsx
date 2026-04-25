import { useEffect, useMemo, useState } from "react";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type TicketDto = {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  reporterUser: string | null;
  reporterEmail: string | null;
  reporterOrg: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type View = "dashboard" | "tickets" | "settings";

type ColumnKey =
  | "title"
  | "status"
  | "priority"
  | "reporterUser"
  | "reporterEmail"
  | "reporterOrg"
  | "createdAt"
  | "updatedAt";

type TableConfig = {
  columns: Record<ColumnKey, boolean>;
  compact: boolean;
};

const DEFAULT_TABLE_CONFIG: TableConfig = {
  columns: {
    title: true,
    status: true,
    priority: true,
    reporterUser: false,
    reporterEmail: true,
    reporterOrg: true,
    createdAt: true,
    updatedAt: false,
  },
  compact: false,
};

const STORAGE_KEY = "admin.tableConfig.v1";

function readInitialView(): View {
  const raw = window.location.hash.replace("#", "");
  if (raw === "dashboard" || raw === "tickets" || raw === "settings")
    return raw;
  return "dashboard";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function badgeClass(kind: "status" | "priority", value: string) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

  if (kind === "status") {
    if (value === "OPEN")
      return `${base} bg-[rgba(0,128,255,0.08)] border-[rgba(0,128,255,0.25)] text-[var(--text-h)]`;
    if (value === "IN_PROGRESS")
      return `${base} bg-[rgba(255,165,0,0.12)] border-[rgba(255,165,0,0.3)] text-[var(--text-h)]`;
    return `${base} bg-[rgba(0,180,120,0.12)] border-[rgba(0,180,120,0.3)] text-[var(--text-h)]`;
  }

  if (value === "LOW")
    return `${base} bg-[rgba(0,180,120,0.12)] border-[rgba(0,180,120,0.3)] text-[var(--text-h)]`;
  if (value === "MEDIUM")
    return `${base} bg-[rgba(0,128,255,0.08)] border-[rgba(0,128,255,0.25)] text-[var(--text-h)]`;
  if (value === "HIGH")
    return `${base} bg-[rgba(255,165,0,0.12)] border-[rgba(255,165,0,0.3)] text-[var(--text-h)]`;
  return `${base} bg-[rgba(255,0,70,0.12)] border-[rgba(255,0,70,0.3)] text-[var(--text-h)]`;
}

function App() {
  const apiBaseUrl = useMemo(
    () =>
      (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
      "http://localhost:3000/api/v1",
    []
  );

  const [view, setView] = useState<View>(() => readInitialView());
  const [tickets, setTickets] = useState<TicketDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tableConfig, setTableConfig] = useState<TableConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_TABLE_CONFIG;
      const parsed = JSON.parse(raw) as Partial<TableConfig>;
      return {
        compact: Boolean(parsed.compact),
        columns: { ...DEFAULT_TABLE_CONFIG.columns, ...(parsed.columns ?? {}) },
      };
    } catch {
      return DEFAULT_TABLE_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tableConfig));
  }, [tableConfig]);

  useEffect(() => {
    function onHashChange() {
      setView(readInitialView());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(next: View) {
    window.location.hash = next;
  }

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        setError(null);
        const res = await fetch(`${apiBaseUrl}/admin/tickets`, {
          signal: abort.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as TicketDto[];
        setTickets(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setTickets(null);
      }
    }
    load();
    return () => abort.abort();
  }, [apiBaseUrl]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return null;
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.reporterEmail ?? "").toLowerCase().includes(q) ||
        (t.reporterOrg ?? "").toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
      );
    });
  }, [query, tickets]);

  const dashboard = useMemo(() => {
    const list = tickets ?? [];
    const byStatus: Record<TicketStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    const byPriority: Record<TicketPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    for (const t of list) {
      byStatus[t.status] += 1;
      byPriority[t.priority] += 1;
    }
    const recent = [...list]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return { total: list.length, byStatus, byPriority, recent };
  }, [tickets]);

  const visibleColumns = useMemo(() => {
    const entries = Object.entries(tableConfig.columns) as Array<
      [ColumnKey, boolean]
    >;
    return entries.filter(([, on]) => on).map(([k]) => k);
  }, [tableConfig.columns]);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--bg)] p-4 md:border-b-0 md:border-r">
        <div className="text-base font-bold tracking-[0.2px] text-[var(--text-h)]">
          Ticket Admin
        </div>
        <nav className="flex flex-col gap-2">
          <button
            type="button"
            className={
              view === "dashboard"
                ? "w-full rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] px-3 py-2 text-left text-[var(--accent)]"
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)]"
            }
            onClick={() => navigate("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={
              view === "tickets"
                ? "w-full rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] px-3 py-2 text-left text-[var(--accent)]"
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)]"
            }
            onClick={() => navigate("tickets")}
          >
            Tickets
          </button>
          <button
            type="button"
            className={
              view === "settings"
                ? "w-full rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] px-3 py-2 text-left text-[var(--accent)]"
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)]"
            }
            onClick={() => navigate("settings")}
          >
            Config
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-[var(--border)] pt-3">
          <div className="text-xs text-[var(--text-h)]/80">API</div>
          <div className="break-all font-[var(--mono)] text-xs text-[var(--text)]">
            {apiBaseUrl}
          </div>
        </div>
      </aside>

      <main className="p-5">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-2xl font-bold text-[var(--text-h)]">
              {view === "dashboard"
                ? "Dashboard"
                : view === "tickets"
                ? "Tickets"
                : "Configuración"}
            </h1>
            {tickets ? (
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-h)]">
                {tickets.length} total
              </span>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-3">
            Error: {error}
          </div>
        ) : null}
        {!error && tickets === null ? (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-3">
            Cargando...
          </div>
        ) : null}

        {view === "dashboard" ? (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="mb-2 text-xs text-[var(--text-h)]/80">
                  Tickets
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">
                  {dashboard.total}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="mb-2 text-xs text-[var(--text-h)]/80">Open</div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">
                  {dashboard.byStatus.OPEN}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="mb-2 text-xs text-[var(--text-h)]/80">
                  In progress
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">
                  {dashboard.byStatus.IN_PROGRESS}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="mb-2 text-xs text-[var(--text-h)]/80">
                  Resolved
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">
                  {dashboard.byStatus.RESOLVED}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="mb-3 text-xs text-[var(--text-h)]/80">
                Últimos tickets
              </div>
              {dashboard.recent.length === 0 ? (
                <div className="text-sm text-[var(--text-h)]/80">
                  No hay tickets
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                          Título
                        </th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                          Estado
                        </th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                          Prioridad
                        </th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                          Creado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent.map((t) => (
                        <tr
                          key={t.id}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="max-w-[520px] truncate py-2 pr-3 text-sm text-[var(--text-h)]">
                            {t.title}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={badgeClass("status", t.status)}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={badgeClass("priority", t.priority)}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-2 font-[var(--mono)] text-xs text-[var(--text)]">
                            {formatDate(t.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {view === "tickets" ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <input
                className="w-full min-w-[240px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
                placeholder="Buscar (título, email, org, estado...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filteredTickets ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="mb-3 text-xs text-[var(--text-h)]/80">
                  Listado
                </div>
                {filteredTickets.length === 0 ? (
                  <div className="text-sm text-[var(--text-h)]/80">
                    Sin resultados
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table
                      className={
                        tableConfig.compact
                          ? "w-full border-collapse text-left text-sm"
                          : "w-full border-collapse text-left text-sm"
                      }
                    >
                      <thead>
                        <tr>
                          {visibleColumns.includes("title") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Título
                            </th>
                          ) : null}
                          {visibleColumns.includes("status") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Estado
                            </th>
                          ) : null}
                          {visibleColumns.includes("priority") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Prioridad
                            </th>
                          ) : null}
                          {visibleColumns.includes("reporterUser") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              User
                            </th>
                          ) : null}
                          {visibleColumns.includes("reporterEmail") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Email
                            </th>
                          ) : null}
                          {visibleColumns.includes("reporterOrg") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Org
                            </th>
                          ) : null}
                          {visibleColumns.includes("createdAt") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Creado
                            </th>
                          ) : null}
                          {visibleColumns.includes("updatedAt") ? (
                            <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">
                              Actualizado
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((t) => (
                          <tr
                            key={t.id}
                            className="border-t border-[var(--border)]"
                          >
                            {visibleColumns.includes("title") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "max-w-[520px] truncate py-1 pr-3 text-[var(--text-h)]"
                                    : "max-w-[520px] truncate py-2 pr-3 text-[var(--text-h)]"
                                }
                              >
                                {t.title}
                              </td>
                            ) : null}
                            {visibleColumns.includes("status") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3"
                                    : "py-2 pr-3"
                                }
                              >
                                <span
                                  className={badgeClass("status", t.status)}
                                >
                                  {t.status}
                                </span>
                              </td>
                            ) : null}
                            {visibleColumns.includes("priority") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3"
                                    : "py-2 pr-3"
                                }
                              >
                                <span
                                  className={badgeClass("priority", t.priority)}
                                >
                                  {t.priority}
                                </span>
                              </td>
                            ) : null}
                            {visibleColumns.includes("reporterUser") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3 text-[var(--text)]"
                                    : "py-2 pr-3 text-[var(--text)]"
                                }
                              >
                                {t.reporterUser ?? ""}
                              </td>
                            ) : null}
                            {visibleColumns.includes("reporterEmail") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3 text-[var(--text)]"
                                    : "py-2 pr-3 text-[var(--text)]"
                                }
                              >
                                {t.reporterEmail ?? ""}
                              </td>
                            ) : null}
                            {visibleColumns.includes("reporterOrg") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3 text-[var(--text)]"
                                    : "py-2 pr-3 text-[var(--text)]"
                                }
                              >
                                {t.reporterOrg ?? ""}
                              </td>
                            ) : null}
                            {visibleColumns.includes("createdAt") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3 font-[var(--mono)] text-xs text-[var(--text)]"
                                    : "py-2 pr-3 font-[var(--mono)] text-xs text-[var(--text)]"
                                }
                              >
                                {formatDate(t.createdAt)}
                              </td>
                            ) : null}
                            {visibleColumns.includes("updatedAt") ? (
                              <td
                                className={
                                  tableConfig.compact
                                    ? "py-1 pr-3 font-[var(--mono)] text-xs text-[var(--text)]"
                                    : "py-2 pr-3 font-[var(--mono)] text-xs text-[var(--text)]"
                                }
                              >
                                {formatDate(t.updatedAt)}
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {view === "settings" ? (
          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="mb-3 text-xs text-[var(--text-h)]/80">
                Tabla de tickets
              </div>
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tableConfig.compact}
                    onChange={(e) =>
                      setTableConfig((c) => ({
                        ...c,
                        compact: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-[var(--text)]">
                    Modo compacto
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <div className="text-xs text-[var(--text-h)]/80">
                  Columnas visibles
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    Object.keys(DEFAULT_TABLE_CONFIG.columns) as ColumnKey[]
                  ).map((key) => (
                    <label
                      key={key}
                      className="inline-flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={tableConfig.columns[key]}
                        onChange={(e) =>
                          setTableConfig((c) => ({
                            ...c,
                            columns: { ...c.columns, [key]: e.target.checked },
                          }))
                        }
                      />
                      <span className="font-[var(--mono)] text-xs text-[var(--text)]">
                        {key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-2 text-sm text-[var(--accent)]"
                  onClick={() => setTableConfig(DEFAULT_TABLE_CONFIG)}
                >
                  Restaurar valores por defecto
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
