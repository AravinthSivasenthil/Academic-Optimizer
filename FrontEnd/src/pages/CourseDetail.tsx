import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

type Course = {
  id: string;
  name: string;
  code?: string;
  credits: number;
  semester: string;
  category: string;
  instructor?: string;
};

type Assessment = {
  id: string;
  course_id: string;
  name: string;
  type: string;
  weight: number;
  max_score: number;
  score: number | null;
};

type Summary = {
  total_weight: number;
  graded_weight: number;
  current_grade: number | null;
  points_earned: number;
};

const emptyForm = {
  name: "",
  type: "assignment",
  weight: 10,
  max_score: 100,
  score: "" as string | number,
};

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [items, setItems] = useState<Assessment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [target, setTarget] = useState(85);
  const [whatIf, setWhatIf] = useState<any>(null);

  const load = async () => {
    if (!id) return;
    const [c, a, s] = await Promise.all([
      api.get(`/api/courses/${id}`),
      api.get(`/api/assessments`, { params: { course_id: id } }),
      api.get(`/api/assessments/course/${id}/summary`),
    ]);
    setCourse(c.data);
    setItems(a.data);
    setSummary(s.data);
  };

  useEffect(() => {
    load();
  }, [id]);

  const runWhatIf = async () => {
    const r = await api.get(`/api/gpa/whatif/${id}`, { params: { target } });
    setWhatIf(r.data);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      course_id: id,
      name: form.name,
      type: form.type,
      weight: parseFloat(form.weight),
      max_score: parseFloat(form.max_score),
      score: form.score === "" ? null : parseFloat(form.score),
    };
    if (editingId) {
      await api.put(`/api/assessments/${editingId}`, payload);
    } else {
      await api.post(`/api/assessments`, payload);
    }
    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  const edit = (a: Assessment) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      type: a.type,
      weight: a.weight.toString(),
      max_score: a.max_score.toString(),
      score: a.score !== null ? a.score.toString() : "",
    });
  };

  const remove = async (aid: string) => {
    if (!confirm("Delete this assessment?")) return;
    await api.delete(`/api/assessments/${aid}`);
    await load();
  };

  if (!course) return <p>Loading...</p>;

  const weightWarning = summary && summary.total_weight !== 100;

  return (
    <div>
      <Link to="/courses" className="text-sm text-slate-500 hover:underline">
        ← Back to courses
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mt-2">
        {course.code ? `${course.code} — ` : ""}{course.name}
      </h1>
      <p className="text-slate-500 mb-6">
        {course.semester} · {course.credits} credits · {course.category}
        {course.instructor ? ` · ${course.instructor}` : ""}
      </p>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-xs text-slate-500 uppercase">Current Grade</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">
              {summary.current_grade !== null
                ? `${summary.current_grade}%`
                : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Based on {summary.graded_weight}% of graded work
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-xs text-slate-500 uppercase">Points Earned</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">
              {summary.points_earned}
            </div>
            <div className="text-xs text-slate-500 mt-1">out of 100</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-xs text-slate-500 uppercase">Total Weight</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">
              {summary.total_weight}%
            </div>
            {weightWarning && (
              <div className="text-xs text-amber-600 mt-1">
                Should sum to 100%
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">What-If Calculator</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-slate-500">Target course grade (%)</label>
            <input
              type="number"
              step="0.1"
              className="border rounded px-3 py-2 block mt-1"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
            />
          </div>
          <button
            onClick={runWhatIf}
            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700"
          >
            Calculate
          </button>
        </div>
        {whatIf && (
          <div className="mt-4 text-sm">
            {whatIf.required_avg === null ? (
              <p className="text-slate-600">{whatIf.reason}</p>
            ) : whatIf.achievable ? (
              <p className="text-slate-700">
                You need an average of{" "}
                <span className="font-bold">{whatIf.required_avg}%</span> across
                the remaining {whatIf.remaining_weight}% of work to hit{" "}
                {whatIf.target}%.
              </p>
            ) : (
              <p className="text-red-600">
                Target not achievable — you'd need {whatIf.required_avg}% on
                remaining work (must be 0-100).
              </p>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Assessment name (e.g. Midterm)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="border rounded px-3 py-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="assignment">Assignment</option>
          <option value="quiz">Quiz</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="project">Project</option>
        </select>
        <input
          type="number"
          step="0.1"
          className="border rounded px-3 py-2"
          placeholder="Weight %"
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.1"
          className="border rounded px-3 py-2"
          placeholder="Max score"
          value={form.max_score}
          onChange={(e) => setForm({ ...form, max_score: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.1"
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="Your score (leave blank if not graded)"
          value={form.score}
          onChange={(e) => setForm({ ...form, score: e.target.value })}
        />
        <div className="md:col-span-3 flex gap-2">
          <button className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700">
            {editingId ? "Update" : "Add Assessment"}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow divide-y">
        {items.length === 0 && (
          <p className="p-6 text-slate-500">No assessments yet.</p>
        )}
        {items.map((a) => {
          const pct =
            a.score !== null ? ((a.score / a.max_score) * 100).toFixed(1) : "—";
          return (
            <div
              key={a.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div>
                <div className="font-semibold text-slate-800">{a.name}</div>
                <div className="text-sm text-slate-500">
                  {a.type} · {a.weight}% weight · max {a.max_score}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-slate-800">
                    {a.score !== null ? `${a.score} / ${a.max_score}` : "Not graded"}
                  </div>
                  <div className="text-xs text-slate-500">{pct}%</div>
                </div>
                <button
                  onClick={() => edit(a)}
                  className="px-3 py-1 text-sm border rounded hover:bg-slate-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}