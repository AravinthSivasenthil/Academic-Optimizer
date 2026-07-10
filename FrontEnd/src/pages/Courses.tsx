import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

type Course = {
  id: string;
  name: string;
  code?: string;
  credits: number;
  instructor?: string;
  semester: string;
  category: string;
};

const emptyForm = {
  name: "",
  code: "",
  credits: 3,
  instructor: "",
  semester: "",
  category: "core",
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/api/courses");
    setCourses(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/courses/${editingId}`, form);
      } else {
        await api.post("/api/courses", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const edit = (c: Course) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      code: c.code || "",
      credits: c.credits,
      instructor: c.instructor || "",
      semester: c.semester,
      category: c.category,
    });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await api.delete(`/api/courses/${id}`);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Courses</h1>

      <form
        onSubmit={submit}
        className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          className="border rounded px-3 py-2"
          placeholder="Course name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Code (e.g. CS201)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <input
          type="number"
          step="0.5"
          className="border rounded px-3 py-2"
          placeholder="Credits"
          value={form.credits}
          onChange={(e) =>
            setForm({ ...form, credits: parseFloat(e.target.value) })
          }
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Instructor"
          value={form.instructor}
          onChange={(e) => setForm({ ...form, instructor: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Semester (e.g. Fall 2025)"
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="core">Core</option>
          <option value="major">Major</option>
          <option value="elective">Elective</option>
        </select>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700"
          >
            {editingId ? "Update Course" : "Add Course"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow divide-y">
        {courses.length === 0 && (
          <p className="p-6 text-slate-500">No courses yet. Add one above.</p>
        )}
        {courses.map((c) => (
          <div
            key={c.id}
            className="p-4 flex items-center justify-between hover:bg-slate-50"
          >
            <Link to={`/courses/${c.id}`} className="flex-1">
              <div className="font-semibold text-slate-800">
                {c.code ? `${c.code} — ` : ""}{c.name}
              </div>
              <div className="text-sm text-slate-500">
                {c.semester} · {c.credits} credits · {c.category}
                {c.instructor ? ` · ${c.instructor}` : ""}
              </div>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => edit(c)}
                className="px-3 py-1 text-sm border rounded hover:bg-slate-100"
              >
                Edit
              </button>
              <button
                onClick={() => remove(c.id)}
                className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}