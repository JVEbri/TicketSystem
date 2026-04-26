import { useEffect, useMemo, useState } from "react";
import { api, API_BASE_URL } from "../lib/api";
import type { Ticket, TicketStatus, TicketPriority, PaginatedResponse } from "../types";
import { formatTicketRef } from "../types";

type View = "dashboard" | "tickets" | "settings";

const STORAGE_KEY = "admin.tableConfig.v1";
const STORAGE_FILTERS_KEY = "admin.ticketFilters.v1";

type TableConfig = {
  columns: Record<string, boolean>;
  compact: boolean;
};

type TicketFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  q?: string;
  sortBy: "createdAt" | "updatedAt" | "title" | "status" | "priority";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
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

const DEFAULT_FILTERS: TicketFilters = {
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
};

function readInitialView(): View {
  const hash = window.location.hash.replace("#", "");
  if (hash === "dashboard" || hash === "tickets" || hash === "settings") return hash;
  return "dashboard";
}

function loadFilters(): TicketFilters {
  try {
    const raw = localStorage.getItem(STORAGE_FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(filters: TicketFilters) {
  localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(filters));
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function getColumnLabel(key: string): string {
  const labels: Record<string, string> = {
    title: 'Título',
    status: 'Estado',
    priority: 'Prioridad',
    reporterUser: 'User',
    reporterEmail: 'Email',
    reporterOrg: 'Org',
    createdAt: 'Creado',
    updatedAt: 'Actualizado',
  };
  return labels[key] || key;
}

function badgeClass(kind: "status" | "priority", value: string) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

  if (kind === "status") {
    if (value === "OPEN") return `${base} bg-blue-100 border-blue-300 text-blue-800`;
    if (value === "IN_PROGRESS") return `${base} bg-yellow-100 border-yellow-300 text-yellow-800`;
    return `${base} bg-green-100 border-green-300 text-green-800`;
  }

  if (value === "LOW") return `${base} bg-green-100 border-green-300 text-green-800`;
  if (value === "MEDIUM") return `${base} bg-blue-100 border-blue-300 text-blue-800`;
  if (value === "HIGH") return `${base} bg-orange-100 border-orange-300 text-orange-800`;
  return `${base} bg-red-100 border-red-300 text-red-800`;
}

function SortHeader({ column, currentSort, sortOrder, onSort }: { column: string; currentSort: string; sortOrder: string; onSort: (col: string) => void }) {
  const isActive = currentSort === column;
  return (
    <th className="pb-2 text-left text-xs font-semibold text-[var(--text-h)]">
      <button
        type="button"
        className={`flex items-center gap-1 hover:text-[var(--accent)] ${isActive ? 'text-[var(--accent)]' : ''}`}
        onClick={() => onSort(column)}
      >
        {getColumnLabel(column)}
        {isActive && <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

export function Dashboard() {
  const [view, setView] = useState<View>(() => readInitialView());
  const [ticketsResponse, setTicketsResponse] = useState<PaginatedResponse<Ticket> | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  const [filters, setFilters] = useState<TicketFilters>(() => loadFilters());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tableConfig));
  }, [tableConfig]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

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
    async function load() {
      try {
        setError(null);
        const data = await api.getTickets(filters);
        setTicketsResponse(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setTicketsResponse(null);
      }
    }
    load();
  }, [filters]);

  const dashboard = useMemo(() => {
    const list = ticketsResponse?.data ?? [];
    const byStatus: Record<TicketStatus, number> = {
      OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0,
    };
    const byPriority: Record<TicketPriority, number> = {
      LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0,
    };
    for (const t of list) {
      byStatus[t.status] += 1;
      byPriority[t.priority] += 1;
    }
    const recent = [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    return { total: list.length, byStatus, byPriority, recent };
  }, [ticketsResponse?.data]);

  const visibleColumns = useMemo(() => {
    return Object.entries(tableConfig.columns)
      .filter(([, on]) => on)
      .map(([k]) => k);
  }, [tableConfig.columns]);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--surface)] p-4 md:border-b-0 md:border-r">
        <div className="text-base font-bold tracking-[0.2px] text-[var(--text-h)]">Ticket Admin</div>
        <nav className="flex flex-col gap-2">
          <button
            type="button"
            className={
              view === "dashboard"
                ? "w-full rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] px-3 py-2 text-left text-[var(--accent)] hover:bg-[var(--accent-bg)]"
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--surface)]"
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
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--surface)]"
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
                : "w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--surface)]"
            }
            onClick={() => navigate("settings")}
          >
            Config
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-[var(--border)] pt-3">
          <div className="text-xs text-[var(--text-muted)]">API</div>
          <div className="break-all font-mono text-xs text-[var(--text)]">{API_BASE_URL}</div>
        </div>
      </aside>

      <main className="p-5">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-2xl font-bold text-[var(--text-h)]">
              {view === "dashboard" ? "Dashboard" : view === "tickets" ? "Tickets" : "Configuración"}
            </h1>
            {ticketsResponse ? (
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-h)]">
                {ticketsResponse.total} total
              </span>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-[var(--error)] bg-red-50 px-3 py-2 text-sm text-[var(--error)]">Error: {error}</div>
        ) : !error && ticketsResponse === null ? (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">Cargando...</div>
        ) : null}

        {view === "dashboard" ? (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-2 text-xs text-[var(--text-muted)]">Tickets</div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">{dashboard.total}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-2 text-xs text-[var(--text-muted)]">Open</div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">{dashboard.byStatus.OPEN}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-2 text-xs text-[var(--text-muted)]">In progress</div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">{dashboard.byStatus.IN_PROGRESS}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-2 text-xs text-[var(--text-muted)]">Resolved</div>
                <div className="text-3xl font-extrabold text-[var(--text-h)]">{dashboard.byStatus.RESOLVED}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-3 text-xs text-[var(--text-h)]/80">Últimos tickets</div>
              {dashboard.recent.length === 0 ? (
                <div className="text-sm text-[var(--text-h)]/80">No hay tickets</div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">Título</th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">Estado</th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">Prioridad</th>
                        <th className="pb-2 text-xs font-semibold text-[var(--text-h)]">Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent.map((t) => (
                        <tr key={t.id} className="border-t border-[var(--border)]">
                          <td className="max-w-[520px] truncate py-2 pr-3 text-sm text-[var(--text-h)]">{t.title}</td>
                          <td className="py-2 pr-3">
                            <span className={badgeClass("status", t.status)}>{t.status}</span>
                          </td>
                          <td className="py-2 pr-3">
                            <span className={badgeClass("priority", t.priority)}>{t.priority}</span>
                          </td>
                          <td className="py-2 font-mono text-xs text-[var(--text)]">{formatDate(t.createdAt)}</td>
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
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="w-full min-w-[200px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                placeholder="Buscar..."
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
              />
              <select
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as TicketStatus || undefined, page: 1 }))}
              >
                <option value="">Estado: todos</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as TicketPriority || undefined, page: 1 }))}
              >
                <option value="">Prioridad: todas</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {ticketsResponse ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--text)] font-medium"
                      value={String(filters.limit)}
                      onChange={(e) => setFilters((f) => ({ ...f, limit: parseInt(e.target.value, 10), page: 1 }))}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="0">Todos</option>
                    </select>
                    <span>de {ticketsResponse.total}</span>
                  </div>
                  {ticketsResponse.totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--accent-bg)] disabled:opacity-50"
                        disabled={ticketsResponse.page <= 1}
                        onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                      >
                        ←
                      </button>
                      <span>{ticketsResponse.page}/{ticketsResponse.totalPages}</span>
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--accent-bg)] disabled:opacity-50"
                        disabled={ticketsResponse.page >= ticketsResponse.totalPages}
                        onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
                {ticketsResponse.data.length === 0 ? (
                  <div className="text-sm text-[var(--text-h)]/80">Sin resultados</div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          <th className="pb-2 text-left text-xs font-semibold text-[var(--text-h)]">Ref</th>
                          {visibleColumns.includes("title") && <SortHeader column="title" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("status") && <SortHeader column="status" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("priority") && <SortHeader column="priority" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("reporterUser") && <SortHeader column="reporterUser" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("reporterEmail") && <SortHeader column="reporterEmail" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("reporterOrg") && <SortHeader column="reporterOrg" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          {visibleColumns.includes("createdAt") && <SortHeader column="createdAt" currentSort={filters.sortBy} sortOrder={filters.sortOrder} onSort={(col) => setFilters((f) => ({ ...f, sortBy: col as any, sortOrder: f.sortBy === col ? (f.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc' }))} />}
                          <th className="pb-2 text-left text-xs font-semibold text-[var(--text-h)]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketsResponse.data.map((t, idx) => (
<tr key={t.id} className="border-t border-[var(--border)]">
                          <td className={tableConfig.compact ? "py-1 pr-3 font-mono text-xs text-[var(--accent)]" : "py-2 pr-3 font-mono text-xs text-[var(--accent)]"}>
                            {formatTicketRef(t.reference)}
                          </td>
                          {visibleColumns.includes("title") && (
                            <td className={tableConfig.compact ? "max-w-[520px] truncate py-1 pr-3 text-[var(--text-h)]" : "max-w-[520px] truncate py-2 pr-3 text-[var(--text-h)]"}>
                              {t.title}
                            </td>
                          )}
                            {visibleColumns.includes("status") && (
                              <td className={tableConfig.compact ? "py-1 pr-3" : "py-2 pr-3"}>
                                <span className={badgeClass("status", t.status)}>{t.status}</span>
                              </td>
                            )}
                            {visibleColumns.includes("priority") && (
                              <td className={tableConfig.compact ? "py-1 pr-3" : "py-2 pr-3"}>
                                <span className={badgeClass("priority", t.priority)}>{t.priority}</span>
                              </td>
                            )}
                            {visibleColumns.includes("reporterUser") && (
                              <td className={tableConfig.compact ? "py-1 pr-3 text-[var(--text)]" : "py-2 pr-3 text-[var(--text)]"}>
                                {t.reporterUser ?? ""}
                              </td>
                            )}
                            {visibleColumns.includes("reporterEmail") && (
                              <td className={tableConfig.compact ? "py-1 pr-3 text-[var(--text)]" : "py-2 pr-3 text-[var(--text)]"}>
                                {t.reporterEmail ?? ""}
                              </td>
                            )}
                            {visibleColumns.includes("reporterOrg") && (
                              <td className={tableConfig.compact ? "py-1 pr-3 text-[var(--text)]" : "py-2 pr-3 text-[var(--text)]"}>
                                {t.reporterOrg ?? ""}
                              </td>
                            )}
{visibleColumns.includes("createdAt") && (
                              <td className={tableConfig.compact ? "py-1 pr-3 font-mono text-xs text-[var(--text)]" : "py-2 pr-3 font-mono text-xs text-[var(--text)]"}>
                                {formatDate(t.createdAt)}
                              </td>
                            )}
                            <td className={tableConfig.compact ? "py-1 pr-3" : "py-2 pr-3"}>
                              <select
                                className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                                value={t.status}
                                onChange={async (e) => {
                                  try {
                                    await api.updateTicketStatus(t.id, e.target.value);
                                    setFilters((f) => ({ ...f }));
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : 'Error updating');
                                  }
                                }}
                              >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                            </td>
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
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-3 text-xs text-[var(--text-h)]/80">Tabla de tickets</div>
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tableConfig.compact}
                    onChange={(e) => setTableConfig((c) => ({ ...c, compact: e.target.checked }))}
                  />
                  <span className="text-sm text-[var(--text)]">Modo compacto</span>
                </label>
              </div>

              <div className="mt-4">
                <div className="text-xs text-[var(--text-h)]/80">Columnas visibles</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.keys(DEFAULT_TABLE_CONFIG.columns).map((key) => (
                    <label key={key} className="inline-flex cursor-pointer items-center gap-2">
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
                      <span className="font-mono text-xs text-[var(--text)]">{key}</span>
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