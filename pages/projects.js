import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Plus, X, ChevronDown, ChevronUp, Trash2, Edit2,
  CheckCircle, Clock, AlertCircle, Pause, Lock,
} from "lucide-react";

const TASK_STATUSES = ["not-started", "in-progress", "completed", "blocked", "on-hold"];
const PROJECT_STATUSES = ["planning", "active", "completed", "on-hold"];

const TASK_STATUS_CONFIG = {
  "not-started": { label: "Not Started", color: "bg-gray-200 text-gray-700", bar: "bg-gray-300", icon: Clock },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", bar: "bg-blue-500", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", bar: "bg-green-500", icon: CheckCircle },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700", bar: "bg-red-500", icon: AlertCircle },
  "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-500", icon: Pause },
};

const PROJECT_STATUS_CONFIG = {
  planning: { label: "Planning", color: "bg-purple-100 text-purple-700" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  "on-hold": { label: "On Hold", color: "bg-yellow-100 text-yellow-700" },
};

function getProjectProgress(project) {
  let totalTasks = 0;
  let completedTasks = 0;
  for (const cat of project.categories || []) {
    for (const task of cat.tasks || []) {
      totalTasks++;
      if (task.status === "completed") completedTasks++;
    }
  }
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

export default function ProjectTracker() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState("");

  // New project form
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    totalDays: 7,
    startDate: new Date().toISOString().split("T")[0],
  });

  // Add category form
  const [addingCategoryTo, setAddingCategoryTo] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Add task form
  const [addingTaskTo, setAddingTaskTo] = useState(null); // { projId, catIdx }
  const [newTask, setNewTask] = useState({ name: "", startDay: 1, endDay: 1, assignee: "" });

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    setIsLoggedIn(!!staff);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewProject({ name: "", description: "", totalDays: 7, startDate: new Date().toISOString().split("T")[0] });
        fetchProjects();
        setMessage("Project created!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveProject = async (project) => {
    try {
      await fetch(`/api/projects/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const addCategory = async (project) => {
    if (!newCategoryName.trim()) return;
    const updated = {
      ...project,
      categories: [...(project.categories || []), { name: newCategoryName.trim(), tasks: [] }],
    };
    await saveProject(updated);
    setAddingCategoryTo(null);
    setNewCategoryName("");
  };

  const removeCategory = async (project, catIdx) => {
    if (!confirm("Remove this category and all its tasks?")) return;
    const cats = [...project.categories];
    cats.splice(catIdx, 1);
    await saveProject({ ...project, categories: cats });
  };

  const addTask = async (project, catIdx) => {
    if (!newTask.name.trim()) return;
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks.push({
      name: newTask.name.trim(),
      startDay: parseInt(newTask.startDay) || 1,
      endDay: parseInt(newTask.endDay) || 1,
      assignee: newTask.assignee,
      status: "not-started",
      notes: "",
    });
    await saveProject({ ...project, categories: cats });
    setAddingTaskTo(null);
    setNewTask({ name: "", startDay: 1, endDay: 1, assignee: "" });
  };

  const updateTaskStatus = async (project, catIdx, taskIdx, newStatus) => {
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks[taskIdx].status = newStatus;
    await saveProject({ ...project, categories: cats });
  };

  const updateTask = async (project, catIdx, taskIdx, taskData) => {
    const cats = JSON.parse(JSON.stringify(project.categories));
    Object.assign(cats[catIdx].tasks[taskIdx], taskData);
    await saveProject({ ...project, categories: cats });
    setEditingTask(null);
  };

  const removeTask = async (project, catIdx, taskIdx) => {
    if (!confirm("Remove this task?")) return;
    const cats = JSON.parse(JSON.stringify(project.categories));
    cats[catIdx].tasks.splice(taskIdx, 1);
    await saveProject({ ...project, categories: cats });
  };

  const updateProjectStatus = async (project, newStatus) => {
    await saveProject({ ...project, status: newStatus });
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
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              BizSuits™
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/assets" className="text-xs text-gray-500 hover:text-blue-600 transition">Assets</Link>
              {!isLoggedIn && (
                <Link href="/" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition">
                  <Lock size={12} /> Staff Login
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Project Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">Track project progress with Gantt-style timelines</p>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                {showCreateForm ? "Close" : "New Project"}
              </button>
            )}
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>
          )}

          {/* Create Project Form */}
          {showCreateForm && isLoggedIn && (
            <form onSubmit={handleCreateProject} className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-blue-700 mb-4">New Project</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Project Name *"
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
                <input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject((p) => ({ ...p, startDate: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={newProject.totalDays}
                    onChange={(e) => setNewProject((p) => ({ ...p, totalDays: parseInt(e.target.value) || 7 }))}
                    className="border p-2 rounded-lg w-20"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>
              <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition text-sm">
                Create Project
              </button>
            </form>
          )}

          {/* Projects */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-lg">No projects yet</p>
              {isLoggedIn && <p className="text-sm mt-1">Create your first project above</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const progress = getProjectProgress(project);
                const isExpanded = expandedProject === project._id;
                const pConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.active;

                return (
                  <div key={project._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Project Header */}
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition"
                      onClick={() => setExpandedProject(isExpanded ? null : project._id)}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${pConfig.color}`}>
                            {pConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* Progress Bar */}
                          <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-48">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : progress > 0 ? "bg-yellow-500" : "bg-gray-300"}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{progress}%</span>
                          </div>
                          {isLoggedIn && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteProject(project._id); }}
                              className="text-red-400 hover:text-red-600 transition p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 ml-7">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 ml-7">
                        Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"} · {project.totalDays} day plan · Created by {project.createdBy || "Unknown"}
                      </p>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {/* Project Status Controls */}
                        {isLoggedIn && (
                          <div className="px-4 sm:px-5 pt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500">Status:</span>
                            {PROJECT_STATUSES.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateProjectStatus(project, s)}
                                className={`text-xs px-2 py-1 rounded-full transition ${project.status === s ? PROJECT_STATUS_CONFIG[s].color + " font-medium" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                              >
                                {PROJECT_STATUS_CONFIG[s].label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Gantt Chart */}
                        <div className="p-4 sm:p-5 overflow-x-auto">
                          <table className="w-full border-collapse text-xs min-w-[600px]">
                            <thead>
                              <tr>
                                <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-36">Task Category</th>
                                <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-48">Activity</th>
                                <th className="text-left py-2 px-2 border-b border-gray-200 text-gray-500 font-medium w-20">Status</th>
                                {Array.from({ length: project.totalDays }, (_, i) => (
                                  <th key={i} className="text-center py-2 px-1 border-b border-gray-200 text-gray-500 font-medium w-14">
                                    Day {i + 1}
                                  </th>
                                ))}
                                {isLoggedIn && <th className="w-16 border-b border-gray-200" />}
                              </tr>
                            </thead>
                            <tbody>
                              {(project.categories || []).map((cat, catIdx) => (
                                <React.Fragment key={catIdx}>
                                  {cat.tasks.length === 0 ? (
                                    <tr className="border-b border-gray-100">
                                      <td className="py-2 px-2 font-semibold text-gray-700 bg-gray-50">{cat.name}</td>
                                      <td colSpan={project.totalDays + 2 + (isLoggedIn ? 1 : 0)} className="py-2 px-2 text-gray-400 italic">
                                        No tasks yet
                                        {isLoggedIn && (
                                          <button
                                            onClick={() => removeCategory(project, catIdx)}
                                            className="ml-2 text-red-400 hover:text-red-600"
                                          >
                                            <Trash2 size={10} className="inline" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ) : (
                                    cat.tasks.map((task, taskIdx) => {
                                      const statusConf = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG["not-started"];
                                      const isEditingThis = editingTask?.projId === project._id && editingTask?.catIdx === catIdx && editingTask?.taskIdx === taskIdx;

                                      return (
                                        <tr key={taskIdx} className="border-b border-gray-100 hover:bg-gray-50/50">
                                          {taskIdx === 0 && (
                                            <td
                                              rowSpan={cat.tasks.length}
                                              className="py-2 px-2 font-semibold text-gray-700 align-top bg-gray-50 border-r border-gray-100"
                                            >
                                              {cat.name}
                                              {isLoggedIn && (
                                                <button
                                                  onClick={() => removeCategory(project, catIdx)}
                                                  className="block mt-1 text-red-400 hover:text-red-600"
                                                >
                                                  <Trash2 size={10} />
                                                </button>
                                              )}
                                            </td>
                                          )}
                                          <td className="py-1.5 px-2 text-gray-700">
                                            {isEditingThis ? (
                                              <input
                                                type="text"
                                                defaultValue={task.name}
                                                onBlur={(e) => updateTask(project, catIdx, taskIdx, { name: e.target.value })}
                                                className="border rounded px-1 py-0.5 w-full text-xs"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className={task.status === "completed" ? "line-through text-gray-400" : ""}>{task.name}</span>
                                            )}
                                            {task.assignee && <span className="block text-gray-400 text-[10px]">→ {task.assignee}</span>}
                                          </td>
                                          <td className="py-1.5 px-2">
                                            {isLoggedIn ? (
                                              <select
                                                value={task.status}
                                                onChange={(e) => updateTaskStatus(project, catIdx, taskIdx, e.target.value)}
                                                className={`text-[10px] rounded-full px-1.5 py-0.5 border-0 ${statusConf.color} cursor-pointer`}
                                              >
                                                {TASK_STATUSES.map((s) => (
                                                  <option key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</option>
                                                ))}
                                              </select>
                                            ) : (
                                              <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${statusConf.color}`}>
                                                {statusConf.label}
                                              </span>
                                            )}
                                          </td>
                                          {/* Day cells - Gantt bars */}
                                          {Array.from({ length: project.totalDays }, (_, dayIdx) => {
                                            const day = dayIdx + 1;
                                            const inRange = day >= task.startDay && day <= task.endDay;
                                            return (
                                              <td key={dayIdx} className="py-1.5 px-0.5 text-center">
                                                {inRange && (
                                                  <div className={`h-5 rounded ${statusConf.bar} opacity-80`} />
                                                )}
                                              </td>
                                            );
                                          })}
                                          {isLoggedIn && (
                                            <td className="py-1.5 px-1 text-center">
                                              <div className="flex gap-1 justify-center">
                                                <button
                                                  onClick={() => setEditingTask({ projId: project._id, catIdx, taskIdx })}
                                                  className="text-gray-400 hover:text-blue-500"
                                                >
                                                  <Edit2 size={10} />
                                                </button>
                                                <button
                                                  onClick={() => removeTask(project, catIdx, taskIdx)}
                                                  className="text-gray-400 hover:text-red-500"
                                                >
                                                  <Trash2 size={10} />
                                                </button>
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })
                                  )}

                                  {/* Add Task Row */}
                                  {isLoggedIn && addingTaskTo?.projId === project._id && addingTaskTo?.catIdx === catIdx && (
                                    <tr className="border-b border-gray-100 bg-blue-50/30">
                                      <td className="py-1.5 px-2" />
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="text"
                                          placeholder="Task name"
                                          value={newTask.name}
                                          onChange={(e) => setNewTask((p) => ({ ...p, name: e.target.value }))}
                                          className="border rounded px-1.5 py-0.5 w-full text-xs"
                                          autoFocus
                                        />
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <input
                                          type="text"
                                          placeholder="Assignee"
                                          value={newTask.assignee}
                                          onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))}
                                          className="border rounded px-1.5 py-0.5 w-full text-xs"
                                        />
                                      </td>
                                      <td className="py-1.5 px-2" colSpan={Math.max(1, Math.floor(project.totalDays / 2))}>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-gray-500">Day</span>
                                          <input
                                            type="number"
                                            min={1}
                                            max={project.totalDays}
                                            value={newTask.startDay}
                                            onChange={(e) => setNewTask((p) => ({ ...p, startDay: e.target.value }))}
                                            className="border rounded px-1 py-0.5 w-10 text-xs"
                                          />
                                          <span className="text-[10px] text-gray-500">to</span>
                                          <input
                                            type="number"
                                            min={1}
                                            max={project.totalDays}
                                            value={newTask.endDay}
                                            onChange={(e) => setNewTask((p) => ({ ...p, endDay: e.target.value }))}
                                            className="border rounded px-1 py-0.5 w-10 text-xs"
                                          />
                                        </div>
                                      </td>
                                      <td className="py-1.5 px-2" colSpan={project.totalDays - Math.floor(project.totalDays / 2) + (isLoggedIn ? 1 : 0)}>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => addTask(project, catIdx)}
                                            className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-700"
                                          >
                                            Add
                                          </button>
                                          <button
                                            onClick={() => setAddingTaskTo(null)}
                                            className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs hover:bg-gray-400"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Controls */}
                        {isLoggedIn && (
                          <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-2">
                            {(project.categories || []).map((cat, catIdx) => (
                              <button
                                key={catIdx}
                                onClick={() => {
                                  setAddingTaskTo({ projId: project._id, catIdx });
                                  setNewTask({ name: "", startDay: 1, endDay: 1, assignee: "" });
                                }}
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                              >
                                + Task in {cat.name}
                              </button>
                            ))}

                            {addingCategoryTo === project._id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Category name"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  className="border rounded px-2 py-1 text-xs w-40"
                                  autoFocus
                                />
                                <button
                                  onClick={() => addCategory(project)}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => { setAddingCategoryTo(null); setNewCategoryName(""); }}
                                  className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingCategoryTo(project._id)}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
                              >
                                + Category
                              </button>
                            )}
                          </div>
                        )}

                        {/* Legend */}
                        <div className="px-4 sm:px-5 pb-4 flex flex-wrap gap-3">
                          {TASK_STATUSES.map((s) => {
                            const conf = TASK_STATUS_CONFIG[s];
                            return (
                              <div key={s} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded ${conf.bar}`} />
                                <span className="text-[10px] text-gray-500">{conf.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
