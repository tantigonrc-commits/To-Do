import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ListTodo, Calendar, Search, X } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-400", active: "bg-emerald-500 text-white" },
  medium: { label: "กลาง", badge: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500", bar: "bg-orange-400", active: "bg-orange-500 text-white" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", bar: "bg-rose-400", active: "bg-rose-500 text-white" },
};
const P_ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", tag: "bg-blue-50 text-blue-700", dot: "bg-blue-500", active: "bg-blue-500 text-white" },
  personal: { label: "ส่วนตัว", tag: "bg-violet-50 text-violet-700", dot: "bg-violet-500", active: "bg-violet-500 text-white" },
  shopping: { label: "ช้อปปิ้ง", tag: "bg-pink-50 text-pink-700", dot: "bg-pink-500", active: "bg-pink-500 text-white" },
  health: { label: "สุขภาพ", tag: "bg-teal-50 text-teal-700", dot: "bg-teal-500", active: "bg-teal-500 text-white" },
};
const C_ORDER = Object.keys(CATEGORIES);

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "ยังไม่เสร็จ" },
  { id: "completed", label: "เสร็จแล้ว" },
];

const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const offsetDay = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
};
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
const isOverdue = (t) => !t.done && t.due && t.due < todayStr();

let nextId = 6;

function DueBadge({ todo }) {
  if (!todo.due) return null;
  const today = todayStr();
  let cls = "bg-slate-100 text-slate-600 ring-slate-200";
  let label = fmtDate(todo.due);
  if (!todo.done && todo.due < today) {
    cls = "bg-red-100 text-red-700 ring-red-300";
    label = `เกินกำหนด · ${label}`;
  } else if (!todo.done && todo.due === today) {
    cls = "bg-yellow-100 text-yellow-800 ring-yellow-300";
    label = "วันนี้";
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>
      <Calendar size={12} />
      {label}
    </span>
  );
}

function Donut({ segments, total, percent }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        {total > 0 &&
          segments.map((s) => {
            if (!s.value) return null;
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.key}
                cx="40" cy="40" r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                style={{ transition: "all 0.4s ease" }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {percent}%
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, onSave, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ text: todo.text, due: todo.due, category: todo.category });
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];
  const c = CATEGORIES[todo.category];

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft({ text: todo.text, due: todo.due, category: todo.category });
    setEditing(true);
  };
  const save = () => {
    const text = draft.text.trim();
    if (text) onSave(todo.id, { text, due: draft.due, category: draft.category });
    setEditing(false);
  };
  const fieldCls =
    "rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <li
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        maxHeight: todo.removing ? 0 : 220,
        opacity: todo.removing ? 0 : 1,
        transform: todo.removing ? "translateX(24px)" : "translateX(0)",
        marginBottom: todo.removing ? 0 : 10,
      }}
    >
      <div className="flex items-start gap-3 rounded-xl bg-white shadow-md shadow-slate-200/70 ring-1 ring-slate-100 pr-3 py-3 relative overflow-hidden">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
          aria-pressed={todo.done}
          className={`ml-4 mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            todo.done ? "bg-indigo-500 border-indigo-500" : "border-slate-300 hover:border-indigo-400 bg-white"
          }`}
        >
          {todo.done && <Check size={15} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div
              className="space-y-2"
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && save()}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
            >
              <input
                ref={inputRef}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                className={`w-full ${fieldCls} text-base text-slate-800 border-indigo-300`}
              />
              <div className="flex flex-wrap gap-2">
                <input
                  type="date"
                  value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                  className={fieldCls}
                />
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className={fieldCls}
                >
                  {C_ORDER.map((k) => (
                    <option key={k} value={k}>{CATEGORIES[k].label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              <span
                onDoubleClick={startEdit}
                title="ดับเบิลคลิกเพื่อแก้ไข"
                className={`block break-words cursor-text select-none transition-colors ${
                  todo.done ? "line-through text-slate-400" : "text-slate-800"
                }`}
              >
                {todo.text}
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => onCyclePriority(todo.id)}
                  title="คลิกเพื่อเปลี่ยนความสำคัญ"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${p.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.tag}`}>{c.label}</span>
                <DueBadge todo={todo} />
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          aria-label="ลบงาน"
          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: offsetDay(-2) },
    { id: 2, text: "ประชุมทีมตอนบ่าย", done: false, priority: "medium", category: "work", due: offsetDay(0) },
    { id: 3, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium", category: "shopping", due: offsetDay(2) },
    { id: 4, text: "วิ่งเช้า 30 นาที", done: true, priority: "low", category: "health", due: offsetDay(0) },
    { id: 5, text: "อ่านหนังสือ 20 หน้า", done: false, priority: "low", category: "personal", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((p) => [{ id: nextId++, text: t, done: false, priority, category, due }, ...p]);
    setText("");
    setDue("");
  };
  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const save = (id, patch) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const cycle = (id) =>
    setTodos((p) =>
      p.map((t) => (t.id === id ? { ...t, priority: P_ORDER[(P_ORDER.indexOf(t.priority) + 1) % 3] } : t))
    );
  const remove = (id) => {
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => t.id !== id)), 300);
  };
  const clearCompleted = () => {
    setTodos((p) => p.map((t) => (t.done ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => !t.done)), 300);
  };

  // stats
  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const overdueCount = todos.filter(isOverdue).length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, color: "#10b981" },
    { key: "active", label: "กำลังทำ", value: activeCount, color: "#6366f1" },
    { key: "overdue", label: "เกินกำหนด", value: overdueCount, color: "#ef4444" },
  ];

  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (filter === "all" || (filter === "active" ? !t.done : t.done)) &&
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const emptyMsg = q
    ? `ไม่พบงานที่ตรงกับ “${query.trim()}”`
    : todos.length === 0
    ? "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย"
    : filter === "active"
    ? "ไม่มีงานค้างอยู่ ทำได้ดีมาก!"
    : "ไม่มีงานในหมวดนี้";

  const card = "rounded-2xl bg-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-100";

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Prompt', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <ListTodo size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">รายการที่ต้องทำ</h1>
        </header>

        <div className="grid gap-5 md:grid-cols-[240px_1fr] items-start">
          {/* Sidebar */}
          <aside className="space-y-5">
            <section className={`${card} p-4`}>
              <h2 className="font-semibold text-slate-800 mb-3">สถิติ</h2>
              <div className="flex items-center gap-4">
                <Donut segments={segments} total={total} percent={percent} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500">งานทั้งหมด</p>
                  <p className="text-2xl font-bold text-slate-800 leading-tight">{total}</p>
                  <p className="text-xs text-slate-500">เสร็จแล้ว {percent}%</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {segments.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </span>
                    <span className="font-medium text-slate-800">{s.value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <nav className={`${card} p-2`} aria-label="หมวดหมู่">
              <div className="flex md:flex-col gap-1 overflow-x-auto">
                {[["all", "ทุกหมวดหมู่", total, "bg-slate-400"]]
                  .concat(C_ORDER.map((k) => [k, CATEGORIES[k].label, todos.filter((t) => t.category === k).length, CATEGORIES[k].dot]))
                  .map(([id, label, count, dot]) => (
                    <button
                      key={id}
                      onClick={() => setCatFilter(id)}
                      aria-pressed={catFilter === id}
                      className={`shrink-0 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        catFilter === id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        {label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{count}</span>
                    </button>
                  ))}
              </div>
            </nav>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className={`${card} p-4`}>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="วันนี้ต้องทำอะไรบ้าง?"
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={add}
                  disabled={!text.trim()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่มงาน</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">ความสำคัญ</span>
                  <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
                    {P_ORDER.map((k) => (
                      <button
                        key={k}
                        onClick={() => setPriority(k)}
                        aria-pressed={priority === k}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          priority === k ? PRIORITIES[k].active + " shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {PRIORITIES[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  กำหนดส่ง
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">หมวดหมู่</span>
                {C_ORDER.map((k) => (
                  <button
                    key={k}
                    onClick={() => setCategory(k)}
                    aria-pressed={category === k}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      category === k ? CATEGORIES[k].active : "bg-slate-100 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {CATEGORIES[k].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-5">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างการค้นหา"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="mt-4 mb-4 flex rounded-xl bg-slate-200/60 p-1" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    filter === f.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className={`${card} py-12 px-6 text-center text-slate-400`}>{emptyMsg}</div>
            ) : (
              <ul>
                {visible.map((t) => (
                  <TodoItem key={t.id} todo={t} onToggle={toggle} onDelete={remove} onSave={save} onCyclePriority={cycle} />
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between px-1 text-sm">
              <span className="text-slate-500">
                เหลืออีก <span className="font-semibold text-slate-800">{remaining}</span> งานที่ยังไม่เสร็จ
              </span>
              <button
                onClick={clearCompleted}
                disabled={doneCount === 0}
                className="rounded-lg px-3 py-1.5 font-medium text-red-500 transition-colors hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                ล้างงานที่เสร็จแล้ว{doneCount > 0 && ` (${doneCount})`}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
