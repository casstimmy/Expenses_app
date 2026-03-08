import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  Plus, X, ChevronDown, ChevronUp, Trash2, Edit2, GripVertical,
  CheckCircle, Clock, AlertCircle, Pause, List, BarChart3,
  CheckSquare, LayoutGrid, Square, User,
} from "lucide-react";
import AssetSection from "../components/AssetSection";

const TASK_STATUSES = ["not-started", "in-progress", "completed", "blocked", "on-hold"];
const PROJECT_STATUSES = ["planning", "active", "completed", "on-hold"];

const BOARD_COLUMNS = [
  { key: "not-started", label: "TO DO", accent: "border-gray-300 bg-gray-50" },
  { key: "in-progress", label: "IN PROGRESS", accent: "border-blue-400 bg-blue-50" },
  { key: "completed", label: "DONE", accent: "border-green-400 bg-green-50" },
];

const STATUS_CFG = {
  "not-started": { label: "Not Started", color: "bg-gray-200 text-gray-700", bar: "bg-gray-300" },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", bar: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", bar: "bg-green-500" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700", bar: "bg-red-500" },
  "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-500" },
};

const PROJ_STATUS_CFG = {
  planning: { label: "Planning", color: "bg-purple-100 text-purple-700" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-700" },
};

const VIEW_TABS = [
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "list", label: "List", icon: List },
  { key: "checklist", label: "Checklist", icon: CheckSquare },
  { key: "gantt", label: "Gantt", icon: BarChart3 },
];

function getProgress(project) {
  let t = 0, c = 0;
  for (const cat of project.categories || [])
    for (const task of cat.tasks || []) { t++; if (task.status === "completed") c++; }
  return t > 0 ? Math.round((c / t) * 100) : 0;
}

function allTasks(project) {
  const tasks = [];
  for (const [ci, cat] of (project.categories || []).entries())
    for (const [ti, task] of (cat.tasks || []).entries())
      tasks.push({ ...task, catIdx: ci, taskIdx: ti, catName: cat.name });
  return tasks;
}

/* ── Board view (Kanban with drag-and-drop) ────────────────── */
function BoardView({ project, canEdit, onUpdateTask, onRemoveTask }) {
  const dragItem = useRef(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
      {BOARD_COLUMNS.map((col) => {
        const tasks = allTasks(project).filter((t) => {
          if (col.key === "not-started") return ["not-started", "blocked", "on-hold"].includes(t.status);
          return t.status === col.key;
        });
        return (
          <div
            key={col.key}
            className={`rounded-xl border-2 ${col.accent} p-3 min-h-[200px]`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragItem.current) {
                const newStatus = col.key === "not-started" ? "not-started" : col.key;
                onUpdateTask(project, dragItem.current.catIdx, dragItem.current.taskIdx, { status: newStatus });
                dragItem.current = null;
              }
            }}
          >
            <h4 className="text-xs font-bold text-gray-600 mb-3 tracking-wider">
              {col.label} <span className="text-gray-400">({tasks.length})</span>
            </h4>
            <div className="space-y-2">
              {tasks.map((task) => {
                const sc = STATUS_CFG[task.status];
                return (
                  <div
                    key={`${task.catIdx}-${task.taskIdx}`}
                    draggable
                    onDragStart={() => { dragItem.current = { catIdx: task.catIdx, taskIdx: task.taskIdx }; }}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{task.catName}</p>
                        {task.assignee && <p className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-0.5"><User size={8} />{task.assignee}</p>}
                        {task.dueDate && <p className="text-[10px] text-gray-400 mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                        {task.checklist?.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">✓ {task.checklist.filter(c => c.checked).length}/{task.checklist.length}</p>}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                        {col.key !== "completed" && <button onClick={() => onUpdateTask(project, task.catIdx, task.taskIdx, { status: "in-progress" })} className="text-[10px] text-blue-500 hover:underline">→ Progress</button>}
                        {col.key !== "completed" && <button onClick={() => onUpdateTask(project, task.catIdx, task.taskIdx, { status: "completed" })} className="text-[10px] text-green-500 hover:underline">→ Done</button>}
                        {col.key === "completed" && <button onClick={() => onUpdateTask(project, task.catIdx, task.taskIdx, { status: "not-started" })} className="text-[10px] text-gray-500 hover:underline">← Reopen</button>}
                        <button onClick={() => onRemoveTask(project, task.catIdx, task.taskIdx)} className="text-[10px] text-red-400 hover:underline ml-auto">Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Drop tasks here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── List & Calendar view ──────────────────────────────────── */
function ListView({ project, canEdit, onUpdateTask, onRemoveTask }) {
  const tasks = allTasks(project);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sorted = [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1; if (b.dueDate) return 1;
    return a.startDay - b.startDay;
  });

  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const firstDay = new Date(calMonth.y, calMonth.m, 1);
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const monthName = firstDay.toLocaleString("default", { month: "long", year: "numeric" });

  const tasksByDate = {};
  for (const t of tasks) {
    if (t.dueDate) { const k = new Date(t.dueDate).toDateString(); (tasksByDate[k] ||= []).push(t); }
  }

  return (
    <div className="p-4">
      {/* Task List */}
      <h4 className="text-sm font-semibold text-gray-700 mb-3">All Tasks</h4>
      <div className="space-y-1 mb-6">
        {sorted.length === 0 && <p className="text-xs text-gray-400">No tasks yet</p>}
        {sorted.map((task) => {
          const sc = STATUS_CFG[task.status];
          const overdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "completed";
          return (
            <div key={`${task.catIdx}-${task.taskIdx}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${overdue ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"} hover:shadow-sm transition`}>
              {canEdit ? (
                <select value={task.status} onChange={(e) => onUpdateTask(project, task.catIdx, task.taskIdx, { status: e.target.value })} className={`text-[10px] rounded-full px-1.5 py-0.5 border-0 ${sc.color} cursor-pointer`}>
                  {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                </select>
              ) : (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${sc.color}`}>{sc.label}</span>
              )}
              <span className={`flex-1 ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</span>
              <span className="text-[10px] text-gray-400">{task.catName}</span>
              {task.assignee && <span className="text-[10px] text-blue-500 flex items-center gap-0.5"><User size={8} />{task.assignee}</span>}
              {task.dueDate && <span className={`text-[10px] ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>{new Date(task.dueDate).toLocaleDateString()}</span>}
              {canEdit && <button onClick={() => onRemoveTask(project, task.catIdx, task.taskIdx)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>}
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Calendar</h4>
        <div className="flex gap-2">
          <button onClick={() => setCalMonth(p => ({ y: p.m === 0 ? p.y - 1 : p.y, m: p.m === 0 ? 11 : p.m - 1 }))} className="text-xs text-gray-500 hover:text-blue-600">← Prev</button>
          <span className="text-xs font-medium text-gray-600">{monthName}</span>
          <button onClick={() => setCalMonth(p => ({ y: p.m === 11 ? p.y + 1 : p.y, m: p.m === 11 ? 0 : p.m + 1 }))} className="text-xs text-gray-500 hover:text-blue-600">Next →</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="bg-gray-50 text-center text-[10px] text-gray-500 font-medium py-1">{d}</div>)}
        {Array.from({ length: startWeekday }).map((_, i) => <div key={`e${i}`} className="bg-white h-16" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = new Date(calMonth.y, calMonth.m, i + 1);
          const dayTasks = tasksByDate[d.toDateString()] || [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div key={i} className={`bg-white h-16 p-1 ${isToday ? "ring-2 ring-blue-400 ring-inset" : ""}`}>
              <p className={`text-[10px] ${isToday ? "text-blue-600 font-bold" : "text-gray-500"}`}>{i + 1}</p>
              {dayTasks.slice(0, 2).map((t, ti) => <div key={ti} className={`text-[8px] truncate rounded px-0.5 mt-0.5 ${STATUS_CFG[t.status]?.bar || "bg-gray-300"} text-white`}>{t.name}</div>)}
              {dayTasks.length > 2 && <p className="text-[8px] text-gray-400">+{dayTasks.length - 2}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Checklist view ────────────────────────────────────────── */
function ChecklistView({ project, canEdit, onUpdateTask, onSaveProject }) {
  const [newItemText, setNewItemText] = useState({});

  const addChecklistItem = async (catIdx, taskIdx, text) => {
    if (!text.trim()) return;
    const cats = JSON.parse(JSON.stringify(project.categories));
    if (!cats[catIdx].tasks[taskIdx].checklist) cats[catIdx].tasks[taskIdx].checklist = [];
    cats[catIdx].tasks[taskIdx].checklist.push({ text: text.trim(), checked: false });
    await onSaveProject({ ...project, categories: cats });
  };

  const toggleChecklistItem = async (catIdx, taskIdx, checkIdx) => {
    const cats = JSON.parse(JSON.stringify(project.categories));
    const cl = cats[catIdx].tasks[taskIdx].checklist;
    if (cl?.[checkIdx]) cl[checkIdx].checked = !cl[checkIdx].checked;
    await onSaveProject({ ...project, categories: cats });
  };

  const removeChecklistItem = async (catIdx, taskIdx, checkIdx) => {
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks[taskIdx].checklist.splice(checkIdx, 1);
    await onSaveProject({ ...project, categories: cats });
  };

  return (
    <div className="p-4 space-y-4">
      {(project.categories || []).map((cat, catIdx) => (
        <div key={catIdx}>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{cat.name}</h4>
          {(cat.tasks || []).map((task, taskIdx) => {
            const cl = task.checklist || [];
            const done = cl.filter(c => c.checked).length;
            const key = `${catIdx}-${taskIdx}`;
            return (
              <div key={taskIdx} className="bg-white rounded-lg border border-gray-100 p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  {canEdit ? (
                    <button onClick={() => onUpdateTask(project, catIdx, taskIdx, { status: task.status === "completed" ? "not-started" : "completed" })} className="flex-shrink-0">
                      {task.status === "completed" ? <CheckCircle size={16} className="text-green-500" /> : <Square size={16} className="text-gray-300" />}
                    </button>
                  ) : (
                    task.status === "completed" ? <CheckCircle size={16} className="text-green-500" /> : <Square size={16} className="text-gray-300" />
                  )}
                  <span className={`text-sm font-medium flex-1 ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</span>
                  {task.assignee && <span className="text-[10px] text-blue-500 flex items-center gap-0.5"><User size={8} />{task.assignee}</span>}
                  {cl.length > 0 && <span className="text-[10px] text-gray-400">{done}/{cl.length}</span>}
                </div>
                <div className="ml-6 space-y-1">
                  {cl.map((item, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 group">
                      <button onClick={() => canEdit && toggleChecklistItem(catIdx, taskIdx, cIdx)} disabled={!canEdit} className={!canEdit ? "cursor-default" : ""}>
                        {item.checked ? <CheckSquare size={14} className="text-green-500" /> : <Square size={14} className="text-gray-300" />}
                      </button>
                      <span className={`text-xs flex-1 ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>{item.text}</span>
                      {canEdit && <button onClick={() => removeChecklistItem(catIdx, taskIdx, cIdx)} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500"><X size={12} /></button>}
                    </div>
                  ))}
                  {canEdit && (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text" placeholder="Add checklist item..."
                        value={newItemText[key] || ""}
                        onChange={(e) => setNewItemText(p => ({ ...p, [key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && (newItemText[key] || "").trim()) { addChecklistItem(catIdx, taskIdx, newItemText[key]); setNewItemText(p => ({ ...p, [key]: "" })); } }}
                        className="border rounded px-2 py-0.5 text-xs flex-1"
                      />
                      <button onClick={() => { if ((newItemText[key] || "").trim()) { addChecklistItem(catIdx, taskIdx, newItemText[key]); setNewItemText(p => ({ ...p, [key]: "" })); } }} className="text-xs text-blue-600 hover:underline">Add</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {cat.tasks.length === 0 && <p className="text-xs text-gray-400 mb-2">No tasks in this category</p>}
        </div>
      ))}
    </div>
  );
}

/* ── Gantt view ────────────────────────────────────────────── */
function GanttView({ project, canEdit, onUpdateTask, onRemoveTask, onRemoveCategory, editingTask, setEditingTask }) {
  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-36">Category</th>
            <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-44">Task</th>
            <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-20">Status</th>
            {Array.from({ length: project.totalDays }, (_, i) => (
              <th key={i} className="text-center py-2 px-1 border-b border-gray-200 text-gray-500 font-medium w-10">D{i + 1}</th>
            ))}
            {canEdit && <th className="w-14 border-b border-gray-200" />}
          </tr>
        </thead>
        <tbody>
          {(project.categories || []).map((cat, catIdx) => (
            <React.Fragment key={catIdx}>
              {cat.tasks.length === 0 ? (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 font-semibold text-gray-700 bg-gray-50">{cat.name}</td>
                  <td colSpan={project.totalDays + 2 + (canEdit ? 1 : 0)} className="py-2 px-2 text-gray-400 italic">
                    No tasks
                    {canEdit && <button onClick={() => onRemoveCategory(project, catIdx)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 size={10} className="inline" /></button>}
                  </td>
                </tr>
              ) : (
                cat.tasks.map((task, taskIdx) => {
                  const sc = STATUS_CFG[task.status] || STATUS_CFG["not-started"];
                  const isEditing = editingTask?.projId === project._id && editingTask?.catIdx === catIdx && editingTask?.taskIdx === taskIdx;
                  return (
                    <tr key={taskIdx} className="border-b border-gray-100 hover:bg-gray-50/50">
                      {taskIdx === 0 && (
                        <td rowSpan={cat.tasks.length} className="py-2 px-2 font-semibold text-gray-700 align-top bg-gray-50 border-r border-gray-100">
                          {cat.name}
                          {canEdit && <button onClick={() => onRemoveCategory(project, catIdx)} className="block mt-1 text-red-400 hover:text-red-600"><Trash2 size={10} /></button>}
                        </td>
                      )}
                      <td className="py-1.5 px-2 text-gray-700">
                        {isEditing ? (
                          <input type="text" defaultValue={task.name} onBlur={(e) => { onUpdateTask(project, catIdx, taskIdx, { name: e.target.value }); setEditingTask(null); }} className="border rounded px-1 py-0.5 w-full text-xs" autoFocus />
                        ) : (
                          <span className={task.status === "completed" ? "line-through text-gray-400" : ""}>{task.name}</span>
                        )}
                        {task.assignee && <span className="block text-gray-400 text-[10px]">→ {task.assignee}</span>}
                      </td>
                      <td className="py-1.5 px-2">
                        {canEdit ? (
                          <select value={task.status} onChange={(e) => onUpdateTask(project, catIdx, taskIdx, { status: e.target.value })} className={`text-[10px] rounded-full px-1.5 py-0.5 border-0 ${sc.color} cursor-pointer`}>
                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                          </select>
                        ) : (
                          <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${sc.color}`}>{sc.label}</span>
                        )}
                      </td>
                      {Array.from({ length: project.totalDays }, (_, dayIdx) => {
                        const day = dayIdx + 1;
                        const inRange = day >= task.startDay && day <= task.endDay;
                        return <td key={dayIdx} className="py-1.5 px-0.5 text-center">{inRange && <div className={`h-5 rounded ${sc.bar} opacity-80`} />}</td>;
                      })}
                      {canEdit && (
                        <td className="py-1.5 px-1 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => setEditingTask({ projId: project._id, catIdx, taskIdx })} className="text-gray-400 hover:text-blue-500"><Edit2 size={10} /></button>
                            <button onClick={() => onRemoveTask(project, catIdx, taskIdx)} className="text-gray-400 hover:text-red-500"><Trash2 size={10} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ProjectTracker() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState("");
  const [pageTab, setPageTab] = useState("projects");
  const [projectView, setProjectView] = useState("board");

  const [newProject, setNewProject] = useState({
    name: "", description: "", totalDays: 7, assignedTo: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [addingCategoryTo, setAddingCategoryTo] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingTaskTo, setAddingTaskTo] = useState(null);
  const [newTask, setNewTask] = useState({ name: "", startDay: 1, endDay: 1, assignee: "", dueDate: "" });

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (staff) {
      try { const p = JSON.parse(staff); setIsLoggedIn(true); setStaffName(p.name || ""); } catch { setIsLoggedIn(false); }
    }
    fetchProjects();
  }, []);

  const getUserName = () => isLoggedIn ? staffName : guestName;
  const canEdit = isLoggedIn || guestName.trim().length > 0;

  const fetchProjects = async () => {
    try { const res = await fetch("/api/projects"); if (res.ok) setProjects(await res.json()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    if (!canEdit) return flash("Please enter your name first");
    try {
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newProject, guestName: getUserName() }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewProject({ name: "", description: "", totalDays: 7, assignedTo: "", startDate: new Date().toISOString().split("T")[0] });
        fetchProjects();
        flash("Project created!");
      }
    } catch (err) { console.error(err); }
  };

  const saveProject = async (project) => {
    try {
      await fetch(`/api/projects/${project._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) });
      fetchProjects();
    } catch (err) { console.error(err); }
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try { await fetch(`/api/projects/${id}`, { method: "DELETE" }); fetchProjects(); } catch (err) { console.error(err); }
  };

  const addCategory = async (project) => {
    if (!newCategoryName.trim()) return;
    await saveProject({ ...project, categories: [...(project.categories || []), { name: newCategoryName.trim(), tasks: [] }] });
    setAddingCategoryTo(null); setNewCategoryName("");
  };

  const removeCategory = async (project, catIdx) => {
    if (!confirm("Remove this category and all its tasks?")) return;
    const cats = [...project.categories]; cats.splice(catIdx, 1);
    await saveProject({ ...project, categories: cats });
  };

  const addTask = async (project, catIdx) => {
    if (!newTask.name.trim()) return;
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks.push({
      name: newTask.name.trim(), startDay: parseInt(newTask.startDay) || 1, endDay: parseInt(newTask.endDay) || 1,
      assignee: newTask.assignee || getUserName(), status: "not-started", notes: "",
      dueDate: newTask.dueDate || undefined, checklist: [],
    });
    await saveProject({ ...project, categories: cats });
    setAddingTaskTo(null);
    setNewTask({ name: "", startDay: 1, endDay: 1, assignee: "", dueDate: "" });
  };

  const updateTaskField = async (project, catIdx, taskIdx, updates) => {
    const cats = JSON.parse(JSON.stringify(project.categories));
    Object.assign(cats[catIdx].tasks[taskIdx], updates);
    await saveProject({ ...project, categories: cats });
    setEditingTask(null);
  };

  const removeTask = async (project, catIdx, taskIdx) => {
    if (!confirm("Remove this task?")) return;
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks.splice(taskIdx, 1);
    await saveProject({ ...project, categories: cats });
  };

  return (
    <>
      <Head>
        <title>Project Tracker — BizSuits</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">BizSuits™</span>
            {!isLoggedIn && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <input type="text" placeholder="Enter your name..." value={guestName} onChange={(e) => setGuestName(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm w-40 sm:w-56" />
              </div>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
          {/* Page Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button onClick={() => setPageTab("projects")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${pageTab === "projects" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>📊 Projects</button>
            <button onClick={() => setPageTab("assets")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${pageTab === "assets" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>📋 Assets</button>
          </div>

          {pageTab === "assets" ? (
            <AssetSection isLoggedIn={isLoggedIn || guestName.trim().length > 0} />
          ) : (
            <>
              {/* Projects Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Project Tracker</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage projects with Board, List, Checklist & Gantt views</p>
                </div>
                {canEdit && (
                  <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                    {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                    {showCreateForm ? "Close" : "New Project"}
                  </button>
                )}
              </div>

              {!isLoggedIn && !guestName.trim() && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  Enter your name in the top-right to add projects and tasks.
                </div>
              )}

              {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}

              {/* Create Project Form */}
              {showCreateForm && canEdit && (
                <form onSubmit={handleCreateProject} className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-gray-100">
                  <h2 className="text-lg font-semibold text-blue-700 mb-4">New Project</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input type="text" placeholder="Project Name *" value={newProject.name} onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))} className="border p-2 rounded-lg w-full" required />
                    <input type="text" placeholder="Description" value={newProject.description} onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))} className="border p-2 rounded-lg w-full" />
                    <input type="text" placeholder="Assign to (staff name)" value={newProject.assignedTo} onChange={(e) => setNewProject(p => ({ ...p, assignedTo: e.target.value }))} className="border p-2 rounded-lg w-full" />
                    <input type="date" value={newProject.startDate} onChange={(e) => setNewProject(p => ({ ...p, startDate: e.target.value }))} className="border p-2 rounded-lg w-full" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={90} value={newProject.totalDays} onChange={(e) => setNewProject(p => ({ ...p, totalDays: parseInt(e.target.value) || 7 }))} className="border p-2 rounded-lg w-20" />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                  </div>
                  <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition text-sm">Create Project</button>
                </form>
              )}

              {/* View Tabs */}
              <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
                {VIEW_TABS.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setProjectView(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${projectView === key ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* Projects list */}
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : projects.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-lg">No projects yet</p>
                  {canEdit && <p className="text-sm mt-1">Create your first project above</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const progress = getProgress(project);
                    const isExpanded = expandedProject === project._id;
                    const pc = PROJ_STATUS_CFG[project.status] || PROJ_STATUS_CFG.active;

                    return (
                      <div key={project._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Project Header */}
                        <div className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => setExpandedProject(isExpanded ? null : project._id)}>
                          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isExpanded ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
                              <h3 className="text-lg font-semibold text-gray-800 truncate">{project.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${pc.color}`}>{pc.label}</span>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-48">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : progress > 0 ? "bg-yellow-500" : "bg-gray-300"}`} style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{progress}%</span>
                              </div>
                              {isLoggedIn && <button onClick={(e) => { e.stopPropagation(); deleteProject(project._id); }} className="text-red-400 hover:text-red-600 transition p-1"><Trash2 size={16} /></button>}
                            </div>
                          </div>
                          {project.description && <p className="text-sm text-gray-500 mt-1 ml-7">{project.description}</p>}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1 ml-7">
                            <span>Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</span>
                            <span>· {project.totalDays} day plan</span>
                            <span>· By {project.createdBy || "Unknown"}</span>
                            {project.assignedTo && <span className="text-blue-500">· Assigned to {project.assignedTo}</span>}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {/* Status Controls */}
                            {canEdit && (
                              <div className="px-4 sm:px-5 pt-3 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500">Status:</span>
                                {PROJECT_STATUSES.map((s) => (
                                  <button key={s} onClick={() => saveProject({ ...project, status: s })} className={`text-xs px-2 py-1 rounded-full transition ${project.status === s ? PROJ_STATUS_CFG[s].color + " font-medium" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                                    {PROJ_STATUS_CFG[s].label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* View Content */}
                            {projectView === "board" && <BoardView project={project} canEdit={canEdit} onUpdateTask={updateTaskField} onRemoveTask={removeTask} />}
                            {projectView === "list" && <ListView project={project} canEdit={canEdit} onUpdateTask={updateTaskField} onRemoveTask={removeTask} />}
                            {projectView === "checklist" && <ChecklistView project={project} canEdit={canEdit} onUpdateTask={updateTaskField} onSaveProject={saveProject} />}
                            {projectView === "gantt" && <GanttView project={project} canEdit={canEdit} onUpdateTask={updateTaskField} onRemoveTask={removeTask} onRemoveCategory={removeCategory} editingTask={editingTask} setEditingTask={setEditingTask} />}

                            {/* Add Task / Category Controls */}
                            {canEdit && (
                              <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                                {(project.categories || []).map((cat, catIdx) => (
                                  <button key={catIdx} onClick={() => { setAddingTaskTo({ projId: project._id, catIdx }); setNewTask({ name: "", startDay: 1, endDay: 1, assignee: "", dueDate: "" }); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">
                                    + Task in {cat.name}
                                  </button>
                                ))}
                                {addingCategoryTo === project._id ? (
                                  <div className="flex items-center gap-1">
                                    <input type="text" placeholder="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="border rounded px-2 py-1 text-xs w-40" autoFocus />
                                    <button onClick={() => addCategory(project)} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">Add</button>
                                    <button onClick={() => { setAddingCategoryTo(null); setNewCategoryName(""); }} className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingCategoryTo(project._id)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition">+ Category</button>
                                )}
                              </div>
                            )}

                            {/* Add Task Form */}
                            {canEdit && addingTaskTo?.projId === project._id && (
                              <div className="px-4 sm:px-5 pb-4">
                                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                  <h4 className="text-xs font-semibold text-blue-700 mb-2">New Task in {project.categories[addingTaskTo.catIdx]?.name}</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    <input type="text" placeholder="Task name *" value={newTask.name} onChange={(e) => setNewTask(p => ({ ...p, name: e.target.value }))} className="border rounded px-2 py-1.5 text-xs w-full" autoFocus />
                                    <input type="text" placeholder={`Assignee (default: ${getUserName() || "you"})`} value={newTask.assignee} onChange={(e) => setNewTask(p => ({ ...p, assignee: e.target.value }))} className="border rounded px-2 py-1.5 text-xs w-full" />
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-500">Day</span>
                                      <input type="number" min={1} max={project.totalDays} value={newTask.startDay} onChange={(e) => setNewTask(p => ({ ...p, startDay: e.target.value }))} className="border rounded px-1 py-1.5 w-10 text-xs" />
                                      <span className="text-[10px] text-gray-500">to</span>
                                      <input type="number" min={1} max={project.totalDays} value={newTask.endDay} onChange={(e) => setNewTask(p => ({ ...p, endDay: e.target.value }))} className="border rounded px-1 py-1.5 w-10 text-xs" />
                                    </div>
                                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask(p => ({ ...p, dueDate: e.target.value }))} className="border rounded px-2 py-1.5 text-xs w-full" />
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => addTask(project, addingTaskTo.catIdx)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Add Task</button>
                                    <button onClick={() => setAddingTaskTo(null)} className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-300">Cancel</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Legend */}
                            <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-3">
                              {TASK_STATUSES.map((s) => (
                                <div key={s} className="flex items-center gap-1.5">
                                  <div className={`w-2.5 h-2.5 rounded ${STATUS_CFG[s].bar}`} />
                                  <span className="text-[10px] text-gray-500">{STATUS_CFG[s].label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
