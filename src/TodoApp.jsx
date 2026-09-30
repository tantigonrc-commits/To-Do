import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ListTodo } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-400", active: "bg-emerald-500 text-white" },
  medium: { label: "กลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "bg-amber-400", active: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", bar: "bg-red-400", active: "bg-red-500 text-white" },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "active", label: "ยังไม่เสร็จ" },
  { id: "completed", label: "เสร็จแล้ว" },
];

const EMPTY = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานค้างอยู่ ทำได้ดีมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

let nextId = 4;

function TodoItem({ todo, onToggle, onDelete, onEdit, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(todo.text);
    setEditing(true);
  };
  const save = () => {
    const t = draft.trim();
    if (t && t !== todo.text) onEdit(todo.id, t);
    setEditing(false);
  };

  return (
    <li
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        maxHeight: todo.removing ? 0 : 140,
        opacity: todo.removing ? 0 : 1,
        transform: todo.removing ? "translateX(24px)" : "translateX(0)",
        marginBottom: todo.removing ? 0 : 10,
      }}
    >
      <div className="flex items-center gap-3 rounded-xl bg-white shadow-md shadow-slate-200/70 ring-1 ring-slate-100 pl-0 pr-3 py-3 relative overflow-hidden">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
          aria-pressed={todo.done}
          className={`ml-4 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            todo.done ? "bg-indigo-500 border-indigo-500" : "border-slate-300 hover:border-indigo-400 bg-white"
          }`}
        >
          {todo.done && <Check size={15} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full rounded-md border border-indigo-300 px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <span
              onDoubleClick={startEdit}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none transition-colors ${
                todo.done ? "line-through text-slate-400" : "text-slate-800"
              }`}
            >
              {todo.text}
            </span>
          )}
        </div>

        <button
          onClick={() => onCyclePriority(todo.id)}
          title="คลิกเพื่อเปลี่ยนความสำคัญ"
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${p.badge} focus:outline-none focus-visible:ring-2`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </button>

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
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high" },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium" },
    { id: 3, text: "อ่านหนังสือ 20 หน้า", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [{ id: nextId++, text: t, done: false, priority }, ...prev]);
    setText("");
  };

  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const edit = (id, newText) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  const cycle = (id) =>
    setTodos((p) =>
      p.map((t) => (t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t))
    );

  const remove = (id) => {
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => t.id !== id)), 300);
  };

  const clearCompleted = () => {
    setTodos((p) => p.map((t) => (t.done ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => !t.done)), 300);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.filter((t) => t.done).length;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14"
      style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', 'Prompt', system-ui, sans-serif" }}
    >
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <ListTodo size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">รายการที่ต้องทำ</h1>
        </header>

        {/* Add form */}
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-slate-200/70 ring-1 ring-slate-100">
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

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ</span>
            <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
              {ORDER.map((k) => (
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
        </div>

        {/* Filter tabs */}
        <div className="mt-6 mb-4 flex rounded-xl bg-slate-200/60 p-1" role="tablist">
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

        {/* List */}
        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white py-12 px-6 text-center text-slate-400 shadow-md shadow-slate-200/70 ring-1 ring-slate-100">
            {EMPTY[filter]}
          </div>
        ) : (
          <ul>
            {visible.map((t) => (
              <TodoItem
                key={t.id}
                todo={t}
                onToggle={toggle}
                onDelete={remove}
                onEdit={edit}
                onCyclePriority={cycle}
              />
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between px-1 text-sm">
          <span className="text-slate-500">
            เหลืออีก <span className="font-semibold text-slate-800">{remaining}</span> งานที่ยังไม่เสร็จ
          </span>
          <button
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="rounded-lg px-3 py-1.5 font-medium text-red-500 transition-colors hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            ล้างงานที่เสร็จแล้ว{completedCount > 0 && ` (${completedCount})`}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
