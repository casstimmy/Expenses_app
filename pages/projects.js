import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import {
  Plus, X, ChevronDown, ChevronUp, Trash2, Edit2, GripVertical,
  CheckCircle, Clock, AlertCircle, Pause, List, BarChart3,
  CheckSquare, LayoutGrid, Square, User, Calendar as CalendarIcon,
  Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AssetSection from "../components/AssetSection";
import Layout from "@/components/Layout";

const ReactCalendar = dynamic(() => import("react-calendar"), { ssr: false });

const TASK_STATUSES = ["not-started", "in-progress", "completed", "blocked", "on-hold"];
const PROJECT_STATUSES = ["planning", "active", "completed", "on-hold"];

const BOARD_COLUMNS = [
  { key: "not-started", label: "TO DO", accent: "border-t-gray-400", bg: "bg-gray-50", count: "bg-gray-200 text-gray-700" },
  { key: "in-progress", label: "IN PROGRESS", accent: "border-t-blue-500", bg: "bg-blue-50/30", count: "bg-blue-100 text-blue-700" },
  { key: "completed", label: "DONE", accent: "border-t-green-500", bg: "bg-green-50/30", count: "bg-green-100 text-green-700" },
];

const STATUS_CFG = {
  "not-started": { label: "Not Started", color: "bg-gray-200 text-gray-700", bar: "bg-gray-400" },
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
  { key: "list", label: "List & Calendar", icon: List },
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

/* ── Board view (Kanban with @hello-pangea/dnd) ────────────── */
function BoardView({ project, canEdit, onUpdateTask, onRemoveTask }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tasksByColumn = useMemo(() => {
    const all = allTasks(project);
    return {
      "not-started": all.filter((t) => ["not-started", "blocked", "on-hold"].includes(t.status)),
      "in-progress": all.filter((t) => t.status === "in-progress"),
      completed: all.filter((t) => t.status === "completed"),
    };
  }, [project]);

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;
    const { draggableId, destination } = result;
    const [catIdx, taskIdx] = draggableId.split("-").map(Number);
    const newStatus = destination.droppableId;
    onUpdateTask(project, catIdx, taskIdx, { status: newStatus });
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
        {BOARD_COLUMNS.map((col) => (
          <div key={col.key} className={`rounded-xl border border-gray-200 border-t-4 ${col.accent} ${col.bg} p-3 min-h-[250px]`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-600 tracking-wider">{col.label}</h4>
            </div>
            <p className="text-xs text-gray-400 text-center py-8">Loading...</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
        {BOARD_COLUMNS.map((col) => {
          const tasks = tasksByColumn[col.key] || [];
          return (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl border border-gray-200 border-t-4 ${col.accent} ${snapshot.isDraggingOver ? "bg-blue-50/50 ring-2 ring-blue-200" : col.bg} p-3 min-h-[250px] transition-all`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-600 tracking-wider">{col.label}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.count}`}>{tasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task, index) => {
                      const sc = STATUS_CFG[task.status];
                      const dragId = `${task.catIdx}-${task.taskIdx}`;
                      return (
                        <Draggable draggableId={dragId} index={index} key={dragId} isDragDisabled={!canEdit}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-white rounded-lg border shadow-sm p-3 group transition-all ${snap.isDragging ? "shadow-lg ring-2 ring-blue-300 rotate-1" : "border-gray-200 hover:shadow-md"}`}
                            >
                              <div className="flex items-start gap-2">
                                <GripVertical size={14} className="text-gray-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{task.catName}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    {task.assignee && (
                                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <User size={8} />{task.assignee}
                                      </span>
                                    )}
                                    {task.dueDate && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${new Date(task.dueDate) < new Date() && task.status !== "completed" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                                        <CalendarIcon size={8} />{new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    {task.checklist?.length > 0 && (
                                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        ✓ {task.checklist.filter(c => c.checked).length}/{task.checklist.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {canEdit && (
                                <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition">
                                  {col.key !== "completed" && (
                                    <button onClick={() => onUpdateTask(project, task.catIdx, task.taskIdx, { status: "completed" })} className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded hover:bg-green-100">✓ Done</button>
                                  )}
                                  {col.key === "completed" && (
                                    <button onClick={() => onUpdateTask(project, task.catIdx, task.taskIdx, { status: "not-started" })} className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200">↩ Reopen</button>
                                  )}
                                  <button onClick={() => onRemoveTask(project, task.catIdx, task.taskIdx)} className="text-[10px] text-red-400 hover:text-red-600 ml-auto px-1">✕</button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {tasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-xs text-gray-400 text-center py-8">Drag tasks here</p>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}

/* ── List & Calendar view (react-calendar) ─────────────────── */
function ListView({ project, canEdit, onUpdateTask, onRemoveTask }) {
  const tasks = allTasks(project);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const sorted = useMemo(() => {
    let list = [...tasks];
    if (searchFilter) list = list.filter(t => t.name.toLowerCase().includes(searchFilter.toLowerCase()));
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    return list.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1; if (b.dueDate) return 1;
      return a.startDay - b.startDay;
    });
  }, [tasks, searchFilter, statusFilter]);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (t.dueDate) { const k = new Date(t.dueDate).toDateString(); (map[k] ||= []).push(t); }
    }
    return map;
  }, [tasks]);

  const dayTasks = selectedDate ? (tasksByDate[selectedDate.toDateString()] || []) : [];

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Task List (3 cols) */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex-1">All Tasks ({sorted.length})</h4>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="border rounded-lg pl-7 pr-2 py-1.5 text-xs w-32 sm:w-44" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs">
              <option value="">All</option>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Task</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase hidden md:table-cell">Assignee</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Due</th>
                  {canEdit && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-400">No tasks found</td></tr>
                )}
                {sorted.map((task) => {
                  const sc = STATUS_CFG[task.status];
                  const overdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "completed";
                  return (
                    <tr key={`${task.catIdx}-${task.taskIdx}`} className={`hover:bg-gray-50/50 transition ${overdue ? "bg-red-50/30" : ""}`}>
                      <td className="px-3 py-2.5">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</p>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{task.catName}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {canEdit ? (
                          <select value={task.status} onChange={(e) => onUpdateTask(project, task.catIdx, task.taskIdx, { status: e.target.value })} className={`text-[10px] rounded-full px-2 py-0.5 border-0 ${sc.color} cursor-pointer font-medium`}>
                            {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                          </select>
                        ) : (
                          <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${sc.color}`}>{sc.label}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        {task.assignee ? (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit"><User size={8} />{task.assignee}</span>
                        ) : <span className="text-[10px] text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {task.dueDate ? (
                          <span className={`text-[10px] font-medium ${overdue ? "text-red-600" : "text-gray-500"}`}>{new Date(task.dueDate).toLocaleDateString()}</span>
                        ) : <span className="text-[10px] text-gray-300">—</span>}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-2.5">
                          <button onClick={() => onRemoveTask(project, task.catIdx, task.taskIdx)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={12} /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar (2 cols) */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Calendar</h4>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <ReactCalendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="!w-full !border-0 project-calendar"
              tileContent={({ date }) => {
                const dt = tasksByDate[date.toDateString()];
                if (!dt?.length) return null;
                return (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {dt.slice(0, 3).map((t, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[t.status]?.bar || "bg-gray-300"}`} />
                    ))}
                  </div>
                );
              }}
              tileClassName={({ date }) => {
                const dt = tasksByDate[date.toDateString()];
                return dt?.length ? "has-tasks" : "";
              }}
            />
            {selectedDate && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  {dayTasks.length > 0 && <span className="text-gray-400 font-normal ml-1">({dayTasks.length} task{dayTasks.length > 1 ? "s" : ""})</span>}
                </p>
                {dayTasks.length === 0 ? (
                  <p className="text-[10px] text-gray-400">No tasks due on this day</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {dayTasks.map((t, i) => {
                      const sc = STATUS_CFG[t.status];
                      return (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.bar}`} />
                          <span className={`text-xs flex-1 truncate ${t.status === "completed" ? "line-through text-gray-400" : "text-gray-700"}`}>{t.name}</span>
                          {t.assignee && <span className="text-[9px] text-gray-400">{t.assignee}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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

/* ── Gantt view (date-based timeline with progress) ────────── */
function GanttView({ project, canEdit, onUpdateTask, onRemoveTask, onRemoveCategory, editingTask, setEditingTask }) {
  const [viewMode, setViewMode] = useState("week");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const tasks = useMemo(() => {
    const all = allTasks(project);
    let filtered = all;
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (searchTerm) filtered = filtered.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [project, statusFilter, searchTerm]);

  const { startDate: projStart, columns, colWidth, getColIndex } = useMemo(() => {
    const pStart = project.startDate ? new Date(project.startDate) : new Date();
    pStart.setHours(0, 0, 0, 0);
    const totalDays = project.totalDays || 7;
    const pEnd = new Date(pStart); pEnd.setDate(pEnd.getDate() + totalDays - 1);

    // Also consider task dueDates that may extend beyond
    for (const t of allTasks(project)) {
      if (t.dueDate) {
        const dd = new Date(t.dueDate);
        if (dd > pEnd) pEnd.setTime(dd.getTime());
      }
    }

    const daysBetween = Math.ceil((pEnd - pStart) / 86400000) + 1;
    const cols = [];

    if (viewMode === "day") {
      for (let i = 0; i < daysBetween; i++) {
        const d = new Date(pStart); d.setDate(d.getDate() + i);
        cols.push({ date: new Date(d), label: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) });
      }
      return { startDate: pStart, columns: cols, colWidth: 48, getColIndex: (d) => Math.floor((d - pStart) / 86400000) };
    } else if (viewMode === "week") {
      const weekStart = new Date(pStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // go to Sunday
      let current = new Date(weekStart);
      while (current <= pEnd) {
        const weekEnd = new Date(current); weekEnd.setDate(weekEnd.getDate() + 6);
        cols.push({ date: new Date(current), label: `${current.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` });
        current.setDate(current.getDate() + 7);
      }
      return { startDate: weekStart, columns: cols, colWidth: 80, getColIndex: (d) => Math.floor((d - weekStart) / (7 * 86400000)) };
    } else {
      // month
      let current = new Date(pStart.getFullYear(), pStart.getMonth(), 1);
      while (current <= pEnd) {
        cols.push({ date: new Date(current), label: current.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) });
        current.setMonth(current.getMonth() + 1);
      }
      return {
        startDate: new Date(pStart.getFullYear(), pStart.getMonth(), 1),
        columns: cols, colWidth: 100,
        getColIndex: (d) => (d.getFullYear() - pStart.getFullYear()) * 12 + d.getMonth() - pStart.getMonth(),
      };
    }
  }, [project, viewMode]);

  const todayIdx = getColIndex(new Date());

  const getTaskBarStyle = (task) => {
    const pStart = project.startDate ? new Date(project.startDate) : new Date();
    pStart.setHours(0, 0, 0, 0);

    // Calculate start and end based on startDay/endDay relative to project start
    const taskStart = new Date(pStart);
    taskStart.setDate(taskStart.getDate() + (task.startDay || 1) - 1);
    const taskEnd = new Date(pStart);
    taskEnd.setDate(taskEnd.getDate() + (task.endDay || task.startDay || 1) - 1);

    const startIdx = getColIndex(taskStart);
    const endIdx = getColIndex(taskEnd);

    const left = startIdx * colWidth;
    const width = Math.max((endIdx - startIdx + 1) * colWidth - 4, colWidth * 0.5);

    return { left: Math.max(left, 0), width };
  };

  // Calculate progress for each task
  const getTaskProgress = (task) => {
    if (task.status === "completed") return 100;
    if (task.status === "not-started") return 0;
    if (task.checklist?.length > 0) {
      return Math.round((task.checklist.filter(c => c.checked).length / task.checklist.length) * 100);
    }
    if (task.status === "in-progress") return 50;
    if (task.status === "blocked") return 25;
    return 0;
  };

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[{ k: "day", l: "Day" }, { k: "week", l: "Week" }, { k: "month", l: "Month" }].map(({ k, l }) => (
            <button key={k} onClick={() => setViewMode(k)} className={`px-3 py-1 rounded-md text-xs font-medium transition ${viewMode === k ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border rounded-lg text-xs pl-6 pr-2 py-1.5 w-36" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg text-xs px-2 py-1.5">
          <option value="">All Status</option>
          {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Left panel: task info */}
          <div className="flex-shrink-0 w-64 border-r border-gray-200">
            <div className="h-10 bg-gray-50 border-b border-gray-200 px-3 flex items-center">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Task</span>
            </div>
            {tasks.map((task) => {
              const sc = STATUS_CFG[task.status];
              const progress = getTaskProgress(task);
              return (
                <div key={`${task.catIdx}-${task.taskIdx}`} className="h-12 px-3 flex items-center border-b border-gray-50 hover:bg-gray-50/50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.bar}`} />
                      <p className={`text-xs font-medium truncate ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3.5">
                      {task.assignee && <span className="text-[9px] text-gray-400">{task.assignee}</span>}
                      <span className="text-[9px] text-gray-300">{progress}%</span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setEditingTask({ projId: project._id, catIdx: task.catIdx, taskIdx: task.taskIdx })} className="text-gray-400 hover:text-blue-500 p-0.5"><Edit2 size={10} /></button>
                      <button onClick={() => onRemoveTask(project, task.catIdx, task.taskIdx)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={10} /></button>
                    </div>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && <div className="h-12 px-3 flex items-center text-xs text-gray-400">No tasks</div>}
          </div>

          {/* Right panel: timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Column headers */}
            <div className="flex h-10 bg-gray-50 border-b border-gray-200">
              {columns.map((col, i) => (
                <div key={i} className={`flex-shrink-0 flex items-center justify-center text-[10px] font-medium border-r border-gray-100 ${i === todayIdx ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-500"}`} style={{ width: colWidth }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Task bars */}
            {tasks.map((task) => {
              const sc = STATUS_CFG[task.status];
              const bar = getTaskBarStyle(task);
              const progress = getTaskProgress(task);
              return (
                <div key={`${task.catIdx}-${task.taskIdx}`} className="relative h-12 border-b border-gray-50" style={{ minWidth: columns.length * colWidth }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {columns.map((_, i) => (
                      <div key={i} className={`flex-shrink-0 border-r border-gray-50 ${i === todayIdx ? "bg-blue-50/30" : ""}`} style={{ width: colWidth }} />
                    ))}
                  </div>
                  {/* Bar */}
                  <div
                    className="absolute top-2 h-8 rounded-md shadow-sm flex items-center overflow-hidden cursor-default"
                    style={{ left: bar.left + 2, width: bar.width }}
                    title={`${task.name} (${progress}%)`}
                  >
                    {/* Background */}
                    <div className={`absolute inset-0 ${sc.bar} opacity-20 rounded-md`} />
                    {/* Progress fill */}
                    <div className={`absolute inset-y-0 left-0 ${sc.bar} opacity-60 rounded-md`} style={{ width: `${progress}%` }} />
                    {/* Label */}
                    <span className="relative z-10 text-[10px] font-medium text-gray-800 px-2 truncate">{task.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {TASK_STATUSES.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded ${STATUS_CFG[s].bar}`} />
            <span className="text-[10px] text-gray-500">{STATUS_CFG[s].label}</span>
          </div>
        ))}
      </div>
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
  const [staffNames, setStaffNames] = useState([]);

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (staff) {
      try { const p = JSON.parse(staff); setIsLoggedIn(true); setStaffName(p.name || ""); } catch { setIsLoggedIn(false); }
    }
    fetchProjects();
    fetch("/api/staff/names").then(r => r.ok ? r.json() : []).then(setStaffNames).catch(() => {});
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
    <Layout>
      <Head>
        <title>Project Tracker — BizSuits</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
          {!isLoggedIn && (
            <div className="flex items-center gap-2 mb-4 bg-white rounded-lg border border-gray-200 px-4 py-3 w-fit">
              <User size={14} className="text-gray-400" />
              <input type="text" placeholder="Enter your name to contribute..." value={guestName} onChange={(e) => setGuestName(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm w-52 sm:w-64" />
            </div>
          )}
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
                    <select value={newProject.assignedTo} onChange={(e) => setNewProject(p => ({ ...p, assignedTo: e.target.value }))} className="border p-2 rounded-lg w-full">
                      <option value="">Assign to staff...</option>
                      {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
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
                                    <select value={newTask.assignee} onChange={(e) => setNewTask(p => ({ ...p, assignee: e.target.value }))} className="border rounded px-2 py-1.5 text-xs w-full">
                                      <option value="">{getUserName() ? `Assignee (default: ${getUserName()})` : "Select assignee..."}</option>
                                      {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
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
    </Layout>
  );
}
