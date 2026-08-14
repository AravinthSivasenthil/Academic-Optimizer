import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Deadline = {
  id: string;
  title: string;
  course_id?: string | null;
  due_date: string;
  notes?: string;
  completed: boolean;
};

type Course = { id: string; name: string; code?: string };

const emptyForm = {
  title: "",
  course_id: "",
  due_date: "",
  notes: "",
};

function bucketOf(d: Deadline): string {
  if (d.completed) return "Completed";
  const now = new Date();
  const due = new Date(d.due_date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 3600 * 1000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 3600 * 1000);

  if (due < startOfToday) return "Overdue";
  if (due < endOfToday) return "Today";
  if (due < endOfWeek) return "This Week";
  return "Later";
}

const BUCKET_ORDER = ["Overdue", "Today", "This Week", "Later", "Completed"];
const BUCKET_STYLES: Record<string, string> = {
  Overdue: "text-red-600",
  Today: "text-amber-600",
  "This Week": "text-slate-800",
  Later: "text-slate-500",
  Completed: "text-slate-400",
};

export default function Deadlines() {
  const [items, setItems] = useState<Deadline[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    const [d, c] = await Promise.all([
      api.get("/api/deadlines"),
      api.get("/api/courses"),
    ]);
    setItems(d.data);
    setCourses(c.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      course_id: form.course_id || null,
      due_date: new Date(form.due_date).toISOString(),
      notes: form.notes || null,
      completed: false,
    };
    await api.post("/api/deadlines", payload);
    setForm(emptyForm);
    await load();
  };

  const toggle = async (id: string) => {
    await api.patch(`/api/deadlines/${id}/toggle`);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this deadline?")) return;
    await api.delete(`/api/deadlines/${id}`);
    await load();
  };

  const courseName = (cid?: string | null) => {
    if (!cid) return null;
    const c = courses.find((x) => x.id === cid);
    return c ? (c.code ? `${c.code} — ${c.name}` : c.name) : null;
  };

  const grouped: Record<string, Deadline[]> = {};
  for (const d of items) {
    const b = bucketOf(d);
    grouped[b] = grouped[b] || [];
    grouped[b].push(d);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Deadlines</h1>

      <form
        onSubmit={submit}
        className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Deadline title (e.g. Submit assignment 3)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
        >
          <option value="">No course (standalone)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ? `${c.code} — ${c.name}` : c.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="border rounded px-3 py-2"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
        <textarea
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="md:col-span-2">
          <button className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700">
            Add Deadline
          </button>
        </div>
      </form>

      {items.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-slate-500">
          No deadlines yet.
        </div>
      )}

      {BUCKET_ORDER.map((bucket) => {
        const list = grouped[bucket];
        if (!list || list.length === 0) return null;
        return (
          <div key={bucket} className="mb-6">
            <h2
              className={`text-sm font-semibold uppercase tracking-wide mb-2 ${BUCKET_STYLES[bucket]}`}
            >
              {bucket} ({list.length})
            </h2>
            <div className="bg-white rounded-xl shadow divide-y">
              {list.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={d.completed}
                      onChange={() => toggle(d.id)}
                      className="mt-1"
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          d.completed
                            ? "line-through text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {d.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(d.due_date).toLocaleString()}
                        {courseName(d.course_id) &&
                          ` · ${courseName(d.course_id)}`}
                      </div>
                      {d.notes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {d.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(d.id)}
                    className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
