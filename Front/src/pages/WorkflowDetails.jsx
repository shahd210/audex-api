
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {ArrowLeft,AlertCircle,CalendarDays, CheckCircle2, Clock3, ExternalLink,GitBranch,ListTodo, RefreshCw,} from "lucide-react";
import { getWorkflowById } from "../services/workflowsService";
import { getTasks } from "../services/tasksService";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Blocked: "bg-red-100 text-red-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-slate-200 text-slate-700",
};

const workflowStatusStyles = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-800",
  in_review: "bg-indigo-100 text-indigo-800",
  evidence_requested: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
};

function dateLabel(value) {
  if (!value) return "Not set";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function taskProgress(status) {
  if (status === "Completed") return 100;
  if (status === "In Progress") return 50;
  return 0;
}

export default function WorkflowDetails() {
  const { id } = useParams();

  const [workflow, setWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [workflowData, taskData] = await Promise.all([
          getWorkflowById(id),
          getTasks(),
        ]);

        setWorkflow(workflowData);

        const allTasks = Array.isArray(taskData) ? taskData : [];

        setTasks(
          allTasks.filter(
            (task) => String(task.workflowId) === String(id)
          )
        );
      } catch (err) {
        setError(
          err?.message || "Unable to load workflow details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const progress = tasks.length
    ? Math.round(
        tasks.reduce(
          (sum, task) => sum + taskProgress(task.status),
          0
        ) / tasks.length
      )
    : workflow?.rawStatus === "completed"
      ? 100
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading workflow details...
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link
          to="/workflows"
          className="mb-5 inline-flex items-center gap-2 text-sm text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Workflows
        </Link>

        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={18} />
            Could not load workflow
          </div>

          <p className="mt-2 text-sm">{error}</p>

          <button
            type="button"
            onClick={() => load()}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold ring-1 ring-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  const rawStatus = workflow.rawStatus || "draft";
  const statusLabel = workflow.status || rawStatus;

  return (
    <div className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/workflows"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={17} />
            Back to Workflows
          </Link>

          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <GitBranch size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Workflow #{workflow.id}
              </p>

              <h1 className="mt-1 break-words text-2xl font-bold text-slate-900">
                {workflow.title}
              </h1>

              {workflow.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {workflow.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    workflowStatusStyles[rawStatus] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statusLabel}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {workflow.priority || "Medium"} Priority
                </span>

                {workflow.recommendationId && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Recommendation #{workflow.recommendationId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <CalendarDays size={19} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">
                  Workflow Due Date
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {dateLabel(workflow.dueDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ListTodo size={19} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Tasks</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock3 size={19} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Task Progress</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {progress}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Progress: Completed = 100%, In Progress = 50%, other task
            statuses = 0%.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Workflow Tasks
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review assignments, deadlines, KPI values, and evidence.
              </p>
            </div>

            <Link
              to="/tasks"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Manage Tasks
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ListTodo
                size={30}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-3 font-semibold text-slate-800">
                No tasks linked yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a task from Task Management and assign it to this
                workflow.
              </p>

              <Link
                to="/tasks"
                className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Go to Task Management
              </Link>
            </div>
          ) : (
            tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-900">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[task.status] ||
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Assignee</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-800">
                      {task.assignee || "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Due Date</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {dateLabel(task.dueDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">KPI</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-800">
                      {task.kpi || "Not set"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Target:{" "}
                      {task.kpiTarget === "" || task.kpiTarget == null
                        ? "Not set"
                        : task.kpiTarget}
                      {task.kpiUnit ? ` ${task.kpiUnit}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">KPI Actual</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {task.kpiActual === "" || task.kpiActual == null
                        ? "Not set"
                        : `${task.kpiActual}${
                            task.kpiUnit ? ` ${task.kpiUnit}` : ""
                          }`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Task progress contribution: {taskProgress(task.status)}%
                  </span>

                  {task.evidence ? (
                    <a
                      href={task.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      <CheckCircle2 size={16} />
                      View Evidence
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No evidence linked
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
