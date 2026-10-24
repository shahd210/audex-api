
import { useCallback, useEffect, useMemo, useState } from "react";
import {AlertCircle,CheckCircle2,Clock3,ExternalLink, LoaderCircle,Pencil,Plus,RefreshCw, Search,X,} from "lucide-react";
import {createTask,getTasks,getUsers,updateTask,} from "../services/tasksService";
import { getWorkflows } from "../services/workflowsService";

const STATUS_OPTIONS = [
  "Pending",
  "In Progress",
  "Blocked",
  "Completed",
  "Cancelled",
];

const EMPTY_FORM = {
  title: "",
  description: "",
  workflowId: "",
  assignee: "",
  dueDate: "",
  kpi: "",
  kpiTarget: "",
  kpiUnit: "",
};

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return String(Number(number.toFixed(2)));
}

function formatKpiProgress(task) {
  const actual = task.kpiActual;
  const target = task.kpiTarget;
  const unit = String(task.kpiUnit ?? "").trim();

  const progress = `${formatNumber(actual)} / ${formatNumber(target)}`;

  // Avoid displaying a numeric value as a measurement unit.
  if (!unit || Number.isFinite(Number(unit))) {
    return progress;
  }

  return `${progress} ${unit}`;
}

function getStatusClass(status) {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-700";
    case "Completed":
      return "bg-emerald-100 text-emerald-700";
    case "Blocked":
      return "bg-red-100 text-red-700";
    case "Cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Completed" || task.status === "Cancelled") {
    return false;
  }

  const due = new Date(`${task.dueDate}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due < new Date();
}

function displayDate(value) {
  if (!value) return "Not set";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [evidenceDrafts, setEvidenceDrafts] = useState({});

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);

    setError("");

    try {
      const [taskData, workflowData, userData] = await Promise.all([
        getTasks(),
        getWorkflows(),
        getUsers(),
      ]);

      setTasks(Array.isArray(taskData) ? taskData : []);
      setWorkflows(Array.isArray(workflowData) ? workflowData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tasks;

    return tasks.filter((task) =>
      [
        task.title,
        task.description,
        task.assignee,
        task.workflowTitle,
        task.status,
        task.kpi,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [tasks, search]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      completed: tasks.filter((task) => task.status === "Completed").length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks],
  );

  function showSuccess(message) {
    setSuccess(message);
    setError("");
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function beginEdit(task) {
    clearMessages();
    setEditingTaskId(task.id);

    setEditForm({
      title: task.title || "",
      description: task.description || "",
      assignee: task.assigneeId ? String(task.assigneeId) : "",
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      kpi: task.kpi || "",
      kpiTarget: task.kpiTarget ?? "",
      kpiUnit: task.kpiUnit || "",
      kpiActual: task.kpiActual ?? "",
    });

    setStatusDrafts((current) => ({
      ...current,
      [task.id]: task.status,
    }));

    setEvidenceDrafts((current) => ({
      ...current,
      [task.id]: task.evidence || "",
    }));
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditForm({});
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    clearMessages();

    if (!createForm.workflowId) {
      setError("Please select a workflow.");
      return;
    }

    if (!createForm.assignee) {
      setError("Please select an assignee.");
      return;
    }

    setSaving(true);

    try {
      await createTask(createForm);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);

      await loadData(false);
      showSuccess("Task created successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails(task) {
    clearMessages();
    setSaving(true);

    try {
      await updateTask(task.rawId ?? task.id, {
        title: editForm.title,
        description: editForm.description,
        assignee: editForm.assignee,
        dueDate: editForm.dueDate,
        kpi: editForm.kpi,
        kpiTarget: editForm.kpiTarget,
        kpiUnit: editForm.kpiUnit,
        kpiActual: editForm.kpiActual,
      });

      await loadData(false);
      showSuccess("Task details updated successfully.");
      setEditingTaskId(null);
      setEditForm({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(task, newStatus) {
    clearMessages();

    const previousStatus = task.status;

    setStatusDrafts((current) => ({
      ...current,
      [task.id]: newStatus,
    }));

    setSaving(true);

    try {
      await updateTask(task.rawId ?? task.id, { status: newStatus });
      await loadData(false);
      showSuccess("Task status updated successfully.");
    } catch (err) {
      setStatusDrafts((current) => ({
        ...current,
        [task.id]: previousStatus,
      }));

      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEvidence(task) {
    clearMessages();

    const url = String(evidenceDrafts[task.id] ?? "").trim();

    if (url) {
      try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          setError("Please enter a valid HTTP or HTTPS URL.");
          return;
        }
      } catch {
        setError("Please enter a valid Evidence URL.");
        return;
      }
    }

    if (!url && task.evidence) {
      setError(
        "Please provide an Evidence URL. Clearing the field does not unlink existing evidence.",
      );
      return;
    }

    if (!url) {
      setError("Please enter an Evidence URL.");
      return;
    }

    setSaving(true);

    try {
      await updateTask(task.rawId ?? task.id, { evidence: url });
      await loadData(false);
      showSuccess("Evidence link saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function updateCreateField(field, value) {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <div className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Task Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Assign work, track deadlines, measure KPIs, and record evidence.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setShowCreate(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Create Task
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Tasks", value: stats.total },
            { label: "In Progress", value: stats.inProgress },
            { label: "Completed", value: stats.completed },
            { label: "Overdue", value: stats.overdue },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, assignees, workflows, or status..."
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={22} className="animate-spin" />
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <Clock3 className="mx-auto mb-3 text-slate-400" size={32} />
            <h2 className="font-semibold text-slate-800">
              {search ? "No matching tasks" : "No tasks yet"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Create a task to start tracking work and KPIs."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredTasks.map((task) => {
              const isEditing = editingTaskId === task.id;
              const evidenceUrl =
                evidenceDrafts[task.id] ?? task.evidence ?? "";
              const status = statusDrafts[task.id] ?? task.status;

              return (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-slate-900">
                        {task.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Workflow: {task.workflowTitle || "Unassigned"}
                      </p>

                      {task.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(task.status)}`}
                      >
                        {task.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            cancelEdit();
                          } else {
                            beginEdit(task);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                      >
                        {isEditing ? <X size={16} /> : <Pencil size={16} />}
                        {isEditing ? "Cancel Edit" : "Edit Details"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-5 border-b border-slate-100 pb-5 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-slate-400">Assignee</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">
                        {task.assignee || "Unassigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">Due Date</p>
                      <p
                        className={`mt-1 text-sm font-medium ${isOverdue(task) ? "text-red-600" : "text-slate-800"}`}
                      >
                        {displayDate(task.dueDate)}
                        {isOverdue(task) && (
                          <span className="ml-2 text-xs">(Overdue)</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">KPI</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">
                        {task.kpi || "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">KPI Progress</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">
                        {formatKpiProgress(task)}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                      <h3 className="mb-4 font-semibold text-slate-800">
                        Edit Task Details
                      </h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className={labelClass}>
                          Task Title
                          <input
                            required
                            value={editForm.title ?? ""}
                            onChange={(event) =>
                              updateEditField("title", event.target.value)
                            }
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          Assignee
                          <select
                            value={editForm.assignee ?? ""}
                            onChange={(event) =>
                              updateEditField("assignee", event.target.value)
                            }
                            className={inputClass}
                          >
                            <option value="">Select assignee</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={labelClass}>
                          Due Date
                          <input
                            type="date"
                            value={editForm.dueDate ?? ""}
                            onChange={(event) =>
                              updateEditField("dueDate", event.target.value)
                            }
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          KPI Name
                          <input
                            value={editForm.kpi ?? ""}
                            onChange={(event) =>
                              updateEditField("kpi", event.target.value)
                            }
                            placeholder="e.g. Collection Rate"
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          KPI Target
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={editForm.kpiTarget ?? ""}
                            onChange={(event) =>
                              updateEditField("kpiTarget", event.target.value)
                            }
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          KPI Actual
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={editForm.kpiActual ?? ""}
                            onChange={(event) =>
                              updateEditField("kpiActual", event.target.value)
                            }
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          KPI Unit
                          <input
                            value={editForm.kpiUnit ?? ""}
                            onChange={(event) =>
                              updateEditField("kpiUnit", event.target.value)
                            }
                            placeholder="e.g. %, EGP, students"
                            className={inputClass}
                          />
                        </label>

                        <label className={`${labelClass} md:col-span-2`}>
                          Description
                          <textarea
                            rows={3}
                            value={editForm.description ?? ""}
                            onChange={(event) =>
                              updateEditField(
                                "description",
                                event.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveDetails(task)}
                          disabled={saving || !String(editForm.title || "").trim()}
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Details"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <label className={labelClass}>
                      Update Status
                      <select
                        value={status}
                        disabled={saving}
                        onChange={(event) =>
                          handleStatusChange(task, event.target.value)
                        }
                        className={inputClass}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div>
                      <label className={labelClass} htmlFor={`evidence-${task.id}`}>
                        Evidence URL
                      </label>
                      <input
                        id={`evidence-${task.id}`}
                        type="url"
                        value={evidenceUrl}
                        onChange={(event) =>
                          setEvidenceDrafts((current) => ({
                            ...current,
                            [task.id]: event.target.value,
                          }))
                        }
                        placeholder="https://example.com/evidence"
                        className={inputClass}
                      />

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveEvidence(task)}
                          disabled={saving || !evidenceUrl.trim()}
                          className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Evidence"}
                        </button>

                        {task.evidence && (
                          <a
                            href={task.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Open Evidence
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-7 text-xs text-slate-400">
          Tasks, task details, status updates, KPIs, and evidence links are
          handled through the configured API services.
        </p>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Task
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign a task and define its KPI target.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close create task form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`${labelClass} md:col-span-2`}>
                  Task Title *
                  <input
                    required
                    value={createForm.title}
                    onChange={(event) =>
                      updateCreateField("title", event.target.value)
                    }
                    placeholder="Enter task title"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Workflow *
                  <select
                    required
                    value={createForm.workflowId}
                    onChange={(event) =>
                      updateCreateField("workflowId", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select workflow</option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Assignee *
                  <select
                    required
                    value={createForm.assignee}
                    onChange={(event) =>
                      updateCreateField("assignee", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Due Date *
                  <input
                    type="date"
                    required
                    min={new Date().toLocaleDateString("en-CA")}
                    value={createForm.dueDate}
                    onChange={(event) =>
                      updateCreateField("dueDate", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  KPI Name
                  <input
                    value={createForm.kpi}
                    onChange={(event) =>
                      updateCreateField("kpi", event.target.value)
                    }
                    placeholder="e.g. Collection Rate"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  KPI Target
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={createForm.kpiTarget}
                    onChange={(event) =>
                      updateCreateField("kpiTarget", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  KPI Unit
                  <input
                    value={createForm.kpiUnit}
                    onChange={(event) =>
                      updateCreateField("kpiUnit", event.target.value)
                    }
                    placeholder="e.g. %, EGP, students"
                    className={inputClass}
                  />
                </label>

                <label className={`${labelClass} md:col-span-2`}>
                  Description
                  <textarea
                    rows={3}
                    value={createForm.description}
                    onChange={(event) =>
                      updateCreateField("description", event.target.value)
                    }
                    placeholder="Optional task description"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
