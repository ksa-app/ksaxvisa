import { useState, useMemo } from "react";
import { ArrowUpDown, Copy, Download, ChevronDown, ChevronUp, Search, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusField = "med" | "mofa" | "pc" | "finger" | "visa" | "manpower" | "flight";

interface Candidate {
  id: number;
  name: string;
  passport: string;
  date: string;
  agent: string;
  med: boolean;
  mofa: boolean;
  pc: boolean;
  finger: boolean;
  visa: boolean;
  manpower: boolean;
  flight: boolean;
  cancel: boolean;
}

type SortKey = keyof Candidate | "";
type SortDirection = "asc" | "desc";

interface ColumnConfig {
  key: keyof Candidate;
  label: string;
  sortable: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FIELDS: StatusField[] = ["med", "mofa", "pc", "finger", "visa", "manpower", "flight"];

const STATIC_COLUMNS: ColumnConfig[] = [
  { key: "id",       label: "SL",       sortable: true  },
  { key: "name",     label: "Name",     sortable: true  },
  { key: "passport", label: "Passport", sortable: true  },
  { key: "date",     label: "Date",     sortable: true  },
  { key: "agent",    label: "Agent",    sortable: true  },
];

const STAGE_LABELS: Record<StatusField, string> = {
  med:      "Medical",
  mofa:     "MOFA",
  pc:       "Police Clearance",
  finger:   "Fingerprint",
  visa:     "Visa",
  manpower: "Manpower",
  flight:   "Flight",
};

const INITIAL_DATA: Candidate[] = [
  { id: 1,  name: "Rahim",  passport: "A1234567", date: "2026-04-01", agent: "Agent A", med: true,  mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 2,  name: "Karim",  passport: "B7654321", date: "2026-03-15", agent: "Agent B", med: true,  mofa: true,  pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 3,  name: "Hasan",  passport: "C1122334", date: "2026-02-20", agent: "Agent A", med: true,  mofa: true,  pc: true,  finger: true,  visa: false, manpower: false, flight: false, cancel: false },
  { id: 4,  name: "Jamal",  passport: "D9988776", date: "2026-01-10", agent: "Agent C", med: true,  mofa: true,  pc: true,  finger: true,  visa: true,  manpower: false, flight: false, cancel: false },
  { id: 5,  name: "Kamal",  passport: "E5566778", date: "2026-04-02", agent: "Agent B", med: false, mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 6,  name: "Sohag",  passport: "F2233445", date: "2026-03-28", agent: "Agent A", med: true,  mofa: true,  pc: true,  finger: true,  visa: true,  manpower: true,  flight: false, cancel: false },
  { id: 7,  name: "Rana",   passport: "G6677889", date: "2026-02-05", agent: "Agent C", med: true,  mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 8,  name: "Babul",  passport: "H4455667", date: "2026-01-25", agent: "Agent B", med: true,  mofa: true,  pc: true,  finger: true,  visa: true,  manpower: true,  flight: true,  cancel: false },
  { id: 9,  name: "Nayeem", passport: "I7788990", date: "2026-03-01", agent: "Agent A", med: false, mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: true  },
  { id: 10, name: "Shanto", passport: "J8899001", date: "2026-02-18", agent: "Agent C", med: true,  mofa: true,  pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 11, name: "Tanvir", passport: "K3344556", date: "2026-04-01", agent: "Agent B", med: true,  mofa: true,  pc: true,  finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 12, name: "Imran",  passport: "L9988223", date: "2026-03-12", agent: "Agent A", med: true,  mofa: true,  pc: true,  finger: true,  visa: true,  manpower: false, flight: false, cancel: false },
  { id: 13, name: "Riyad",  passport: "M7766554", date: "2026-02-09", agent: "Agent C", med: false, mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
  { id: 14, name: "Arif",   passport: "N2211334", date: "2026-01-30", agent: "Agent B", med: true,  mofa: true,  pc: true,  finger: true,  visa: true,  manpower: true,  flight: false, cancel: false },
  { id: 15, name: "Sakib",  passport: "O5544332", date: "2026-04-02", agent: "Agent A", med: false, mofa: false, pc: false, finger: false, visa: false, manpower: false, flight: false, cancel: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProgress(candidate: Candidate): number {
  const done = STATUS_FIELDS.filter((f) => candidate[f]).length;
  return Math.round((done / STATUS_FIELDS.length) * 100);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(console.error);
}

function downloadRow(item: Candidate): void {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${item.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
}

function ProgressBar({ value }: ProgressBarProps) {
  const color =
    value === 100 ? "bg-green-500" :
    value >= 60   ? "bg-blue-500"  :
    value >= 30   ? "bg-yellow-400" :
                    "bg-red-400";

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

interface StatusBadgeProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function StatusBadge({ active, onClick, label }: StatusBadgeProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        w-7 h-7 rounded-full text-xs font-bold transition-all duration-150
        ${active
          ? "bg-green-100 text-green-700 border border-green-300 shadow-inner"
          : "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
        }
      `}
    >
      {active ? "✔" : "✖"}
    </button>
  );
}

interface SortIconProps {
  column: SortKey;
  current: SortKey;
  direction: SortDirection;
}

function SortIcon({ column, current, direction }: SortIconProps) {
  if (column !== current) return <ArrowUpDown size={13} className="text-gray-400" />;
  return direction === "asc"
    ? <ChevronUp size={13} className="text-blue-500" />
    : <ChevronDown size={13} className="text-blue-500" />;
}

// ─── Filters bar ─────────────────────────────────────────────────────────────

interface FiltersProps {
  agents: string[];
  search: string;
  filterAgent: string;
  filterStage: StatusField | "";
  filterMonth: string;
  onSearch: (v: string) => void;
  onAgent: (v: string) => void;
  onStage: (v: StatusField | "") => void;
  onMonth: (v: string) => void;
  onReset: () => void;
}

function FiltersBar({
  agents, search, filterAgent, filterStage, filterMonth,
  onSearch, onAgent, onStage, onMonth, onReset,
}: FiltersProps) {
  const hasActive = search || filterAgent || filterStage || filterMonth;

  return (
    <div className="bg-white p-3 rounded-2xl shadow mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Stage */}
        <select
          className="border p-2 rounded text-sm"
          value={filterStage}
          onChange={(e) => onStage(e.target.value as StatusField | "")}
        >
          <option value="">All Stages</option>
          {STATUS_FIELDS.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>

        {/* Agent */}
        <select
          className="border p-2 rounded text-sm"
          value={filterAgent}
          onChange={(e) => onAgent(e.target.value)}
        >
          <option value="">All Agents</option>
          {agents.map((a) => <option key={a}>{a}</option>)}
        </select>

        {/* Month */}
        <input
          type="month"
          className="border p-2 rounded text-sm"
          value={filterMonth}
          onChange={(e) => onMonth(e.target.value)}
        />

        {hasActive && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 border px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
          >
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="border pl-8 pr-3 py-2 rounded text-sm w-56"
          placeholder="Search name / passport…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Main Table Component ─────────────────────────────────────────────────────

interface CandidateTableProps {
  initialCandidates?: Candidate[];
  agentList?: string[];
  pageSize?: number;
}

export default function CandidateTable({
  initialCandidates = INITIAL_DATA,
  agentList         = ["Agent A", "Agent B", "Agent C"],
  pageSize          = 5,
}: CandidateTableProps) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [data,    setData]    = useState<Candidate[]>(initialCandidates);
  const [agents]              = useState<string[]>(agentList);

  const [search,       setSearch]       = useState<string>("");
  const [filterAgent,  setFilterAgent]  = useState<string>("");
  const [filterStage,  setFilterStage]  = useState<StatusField | "">("");
  const [filterMonth,  setFilterMonth]  = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const [page, setPage] = useState<number>(1);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleStatus = (id: number, field: StatusField): void => {
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c))
    );
  };

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const resetFilters = (): void => {
    setSearch("");
    setFilterAgent("");
    setFilterStage("");
    setFilterMonth("");
    setPage(1);
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredData = useMemo<Candidate[]>(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.passport.toLowerCase().includes(q)
      );
    }
    if (filterAgent) result = result.filter((c) => c.agent === filterAgent);
    if (filterStage) result = result.filter((c) => c[filterStage as StatusField]);
    if (filterMonth) result = result.filter((c) => c.date.startsWith(filterMonth));

    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey as keyof Candidate];
        const bv = b[sortKey as keyof Candidate];
        if (av < bv) return sortDir === "asc" ? -1 :  1;
        if (av > bv) return sortDir === "asc" ?  1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, filterAgent, filterStage, filterMonth, sortKey, sortDir]);

  const totalPages   = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard title="Total"    value={data.length} />
          <StatCard title="Pending"  value={data.filter((c) => !STATUS_FIELDS.every((f) => c[f]) && !c.cancel).length} />
          <StatCard title="Complete" value={data.filter((c) => STATUS_FIELDS.every((f) => c[f])).length} />
          <StatCard title="Cancel"   value={data.filter((c) => c.cancel).length} />
        </div>

        {/* Filters */}
        <FiltersBar
          agents={agents}
          search={search}
          filterAgent={filterAgent}
          filterStage={filterStage}
          filterMonth={filterMonth}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          onAgent={(v)  => { setFilterAgent(v); setPage(1); }}
          onStage={(v)  => { setFilterStage(v); setPage(1); }}
          onMonth={(v)  => { setFilterMonth(v); setPage(1); }}
          onReset={resetFilters}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="min-w-full text-sm border-collapse">

              {/* HEAD */}
              <thead className="bg-gray-200 sticky top-0 z-10">
                <tr>
                  {STATIC_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key as SortKey)}
                      className={`p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${col.sortable ? "cursor-pointer hover:bg-gray-300" : ""}`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && (
                          <SortIcon column={col.key as SortKey} current={sortKey} direction={sortDir} />
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Progress column */}
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    Progress
                  </th>

                  {/* Status columns */}
                  {STATUS_FIELDS.map((s) => (
                    <th key={s} className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {s}
                    </th>
                  ))}

                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={STATIC_COLUMNS.length + STATUS_FIELDS.length + 3} className="p-8 text-center text-gray-400">
                      No candidates found.
                    </td>
                  </tr>
                )}

                {paginatedData.map((item, index) => {
                  const progress = getProgress(item);
                  const rowBg    = item.cancel
                    ? "bg-red-50"
                    : progress === 100
                    ? "bg-green-50"
                    : "";

                  return (
                    <tr
                      key={item.id}
                      className={`border-t hover:bg-gray-50 transition-colors ${rowBg}`}
                    >
                      {/* SL */}
                      <td className="p-3 text-gray-500 tabular-nums">
                        {(safePage - 1) * pageSize + index + 1}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-medium text-gray-800">
                        {item.cancel
                          ? <span className="line-through text-gray-400">{item.name}</span>
                          : item.name
                        }
                      </td>

                      {/* Passport */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-700">{item.passport}</span>
                          <button
                            onClick={() => copyToClipboard(item.passport)}
                            title="Copy passport number"
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-gray-600 tabular-nums">{item.date}</td>

                      {/* Agent */}
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {item.agent}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="p-3">
                        <ProgressBar value={progress} />
                      </td>

                      {/* Status badges */}
                      {STATUS_FIELDS.map((field) => (
                        <td key={field} className="p-3 text-center">
                          <div className="flex justify-center">
                            <StatusBadge
                              active={item[field]}
                              onClick={() => toggleStatus(item.id, field)}
                              label={STAGE_LABELS[field]}
                            />
                          </div>
                        </td>
                      ))}

                      {/* Actions */}
                      <td className="p-3">
                        <button
                          onClick={() => downloadRow(item)}
                          title="Download JSON"
                          className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 transition"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            Showing {filteredData.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredData.length)} of {filteredData.length} candidates
          </p>

          <div className="flex items-center gap-1">
            <PaginationBtn label="«" disabled={safePage === 1} onClick={() => setPage(1)} />
            <PaginationBtn label="‹" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)} />
            <span className="px-3 py-1 text-sm">{safePage} / {totalPages}</span>
            <PaginationBtn label="›" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)} />
            <PaginationBtn label="»" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

interface StatCardProps { title: string; value: number; }

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow text-center">
      <p className="text-xs text-gray-500">{title}</p>
      <h2 className="text-lg font-semibold">{value}</h2>
    </div>
  );
}

interface PaginationBtnProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function PaginationBtn({ label, disabled, onClick }: PaginationBtnProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-2 py-1 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
    >
      {label}
    </button>
  );
}