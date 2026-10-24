import { useCallback, useEffect, useMemo, useState } from "react";
import {GitBranch,Search,ClipboardList,ArrowUpRight, RefreshCw,Filter,CheckCircle2,Clock3,AlertCircle,CalendarDays,ListTodo,X,Ban,} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import {getWorkflows,cancelWorkflow,} from "../services/workflowsService";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "evidence_requested", label: "Evidence Requested" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" },
];

const CANCELLABLE_STATUSES = [
  "draft",
  "submitted",
  "evidence_requested",
  "approved",
  "in_progress",
];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getStatus = (workflow) => {
  const raw = normalize(workflow.rawStatus || workflow.status);

  const aliases = {
    complete: "completed",
    done: "completed",
    canceled: "cancelled",
  };

  const status = aliases[raw] || raw;

  const validStatuses = [
    "draft",
    "submitted",
    "in_review",
    "evidence_requested",
    "approved",
    "in_progress",
    "completed",
    "rejected",
    "cancelled",
  ];

  return validStatuses.includes(status) ? status : "draft";
};

const getStatusLabel = (status) => {
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    in_review: "In Review",
    evidence_requested: "Evidence Requested",
    approved: "Approved",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return labels[status] || "Draft";
};

const getStatusVariant = (status) => {
  const variants = {
    draft: "default",
    submitted: "info",
    in_review: "info",
    evidence_requested: "warning",
    approved: "success",
    in_progress: "info",
    completed: "success",
    cancelled: "danger",
    rejected: "danger",
  };

  return variants[status] || "default";
};

const getPriority = (workflow) => {
  const raw = normalize(workflow.priority);

  if (["high", "critical", "urgent"].includes(raw)) {
    return "high";
  }

  if (["medium", "moderate", "normal"].includes(raw)) {
    return "medium";
  }

  if (["low", "minor"].includes(raw)) {
    return "low";
  }

  return "medium";
};

const getPriorityVariant = (priority) => {
  const variants = {
    high: "danger",
    medium: "warning",
    low: "info",
  };

  return variants[priority] || "default";
};

const getProgress = (workflow) => {
  const directProgress = Number(workflow.progress);

  if (
    workflow.progress !== null &&
    workflow.progress !== undefined &&
    workflow.progress !== "" &&
    Number.isFinite(directProgress)
  ) {
    return Math.min(100, Math.max(0, directProgress));
  }

  const tasks = Array.isArray(workflow.tasks)
    ? workflow.tasks
    : [];

  if (tasks.length > 0) {
    const totalProgress = tasks.reduce((total, task) => {
      switch (normalize(task.status)) {
        case "completed":
        case "complete":
        case "done":
          return total + 100;

        case "in_progress":
          return total + 50;

        default:
          return total;
      }
    }, 0);

    return Math.round(totalProgress / tasks.length);
  }

  return getStatus(workflow) === "completed" ? 100 : 0;
};

const getRecommendationId = (workflow) =>
  workflow.recommendation_id ??
  workflow.recommendationId ??
  workflow.recommendation?.id ??
  null;

const getTaskCount = (workflow) => {
  if (Array.isArray(workflow.tasks)) {
    return workflow.tasks.length;
  }

  return workflow.tasks_count ?? workflow.tasksCount ?? null;
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className={`mt-3 text-3xl font-bold ${color}`}>
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <Icon size={21} className={color} />
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  workflow,
  onCancel,
  cancelling,
}) {
  const status = getStatus(workflow);
  const priority = getPriority(workflow);
  const progress = getProgress(workflow);
  const recommendationId = getRecommendationId(workflow);
  const taskCount = getTaskCount(workflow);

  const rawStatus = normalize(
    workflow.rawStatus || workflow.status
  );

  const canCancel = CANCELLABLE_STATUSES.includes(rawStatus);

  const dueDate = formatDate(
    workflow.due_date ?? workflow.dueDate
  );

  const createdAt = formatDate(
    workflow.created_at ?? workflow.createdAt
  );

  const dueDateValue = workflow.due_date ?? workflow.dueDate;

  const isOverdue =
    dueDateValue &&
    new Date(dueDateValue).getTime() <
      new Date().setHours(0, 0, 0, 0) &&
    !["completed", "cancelled", "rejected"].includes(status);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GitBranch size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-base font-semibold text-slate-900">
                {workflow.title ||
                  workflow.name ||
                  `Workflow #${workflow.id}`}
              </h2>

              <span className="text-xs text-slate-400">
                #{workflow.id}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">
              {workflow.description || "No description provided."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={getPriorityVariant(priority)}>
                {priority.charAt(0).toUpperCase() +
                  priority.slice(1)}{" "}
                Priority
              </Badge>

              <Badge variant={getStatusVariant(status)}>
                {getStatusLabel(status)}
              </Badge>
            </div>
          </div>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel(workflow)}
            disabled={cancelling}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ban size={16} />

            {cancelling
              ? "Cancelling..."
              : "Cancel Workflow"}
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClipboardList
            size={17}
            className="shrink-0 text-slate-400"
          />

          <span>
            {taskCount === null
              ? "Task count unavailable"
              : `${taskCount} ${
                  taskCount === 1 ? "task" : "tasks"
                }`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays
            size={17}
            className="shrink-0 text-slate-400"
          />

          <span>
            {dueDate ? `Due ${dueDate}` : "No due date"}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            isOverdue
              ? "font-medium text-red-600"
              : "text-slate-500"
          }`}
        >
          {isOverdue ? (
            <AlertCircle size={17} className="shrink-0" />
          ) : (
            <Clock3
              size={17}
              className="shrink-0 text-slate-400"
            />
          )}

          <span>
            {isOverdue
              ? "Overdue"
              : createdAt
                ? `Created ${createdAt}`
                : "Creation date unavailable"}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <ListTodo size={17} />
            Execution Progress
          </span>

          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {progress}%
          </span>
        </div>

        <ProgressBar value={progress} />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {recommendationId
              ? `Linked to Recommendation #${recommendationId}`
              : "No linked recommendation"}
          </span>

          {recommendationId && (
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              View Recommendations
              <ArrowUpRight size={14} />
            </Link>

          )}

<Link
  to={`/workflows/${workflow.id}`}
  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
>
  View Details
  <ArrowUpRight size={16} />
</Link>

        </div>
      </div>
    </article>
  );
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [cancellingId, setCancellingId] = useState(null);
  const [workflowToCancel, setWorkflowToCancel] = useState(null);

  const loadWorkflows = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getWorkflows();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : null;

        if (!data) {
          throw new Error(
            "Unexpected workflows response format."
          );
        }

        setWorkflows(data);
      } catch (err) {
        console.error("Failed to load workflows:", err);

        setError(
          err?.message ||
            "Unable to load workflows. Check your connection and try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleCancelWorkflow = async () => {
    if (!workflowToCancel || cancellingId !== null) {
      return;
    }

    const workflow = workflowToCancel;

    setCancellingId(workflow.id);
    setError("");
    setNotice("");

    try {
      await cancelWorkflow(
        workflow.rawId ?? workflow.id
      );

      setWorkflowToCancel(null);

      setNotice(
        `Workflow "${
          workflow.title || workflow.id
        }" was cancelled.`
      );

      await loadWorkflows({ silent: true });
    } catch (err) {
      console.error("Failed to cancel workflow:", err);

      setError(
        err?.message ||
          "Unable to cancel this workflow. Check the allowed status transitions and try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const stats = useMemo(() => {
    const completed = workflows.filter(
      (workflow) => getStatus(workflow) === "completed"
    ).length;

    const inProgress = workflows.filter(
      (workflow) => getStatus(workflow) === "in_progress"
    ).length;

    const pending = workflows.filter((workflow) =>
      [
        "draft",
        "submitted",
        "in_review",
        "evidence_requested",
      ].includes(getStatus(workflow))
    ).length;

    const totalTasks = workflows.reduce(
      (total, workflow) =>
        total + (Number(getTaskCount(workflow)) || 0),
      0
    );

    return {
      total: workflows.length,
      completed,
      inProgress,
      pending,
      totalTasks,
    };
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const title = String(
        workflow.title ?? workflow.name ?? ""
      ).toLowerCase();

      const description = String(
        workflow.description ?? ""
      ).toLowerCase();

      const id = String(workflow.id ?? "");

      const recommendationId = String(
        getRecommendationId(workflow) ?? ""
      );

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        id.includes(query) ||
        recommendationId.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(workflow) === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        getPriority(workflow) === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    workflows,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <p className="text-center text-sm text-slate-500">
          Loading workflows...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <GitBranch size={23} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Workflow Management
            </h1>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage execution workflows, monitor progress, and
            track implementation of recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadWorkflows({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link to="/recommendations">
            <Button>
              <span className="inline-flex items-center gap-2">
                View Recommendations
                <ArrowUpRight size={16} />
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {notice}
          </span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-medium text-red-800">
                Workflow action failed
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadWorkflows()}
            className="self-start rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 sm:self-auto"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Workflows"
          value={stats.total}
          icon={GitBranch}
          color="text-slate-900"
          description="All available workflows"
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock3}
          color="text-blue-600"
          description="Workflows currently executing"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="text-emerald-600"
          description="Workflows marked completed"
        />

        <StatCard
          title="Pending"
          value={stats.pending}
          icon={ClipboardList}
          color="text-amber-600"
          description={`${stats.totalTasks} linked tasks · Draft, submitted, or in review`}
        />
      </div>

      {stats.total > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-slate-900">
                Overall Completion
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Percentage of workflows whose backend status is completed.
              </p>
            </div>

            <span className="text-xl font-bold text-indigo-600">
              {Math.round(
                (stats.completed / stats.total) * 100
              )}
              %
            </span>
          </div>

          <ProgressBar
            value={Math.round(
              (stats.completed / stats.total) * 100
            )}
          />

          <p className="mt-2 text-xs text-slate-400">
            {stats.completed} of {stats.total} workflows completed
          </p>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />

          <h2 className="font-semibold text-slate-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, description or ID..."
              aria-label="Search workflows"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by status"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            aria-label="Filter by priority"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Showing {filteredWorkflows.length} of{" "}
            {workflows.length} workflows
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Workflows
          </h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {filteredWorkflows.length} results
          </span>
        </div>

        {filteredWorkflows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              {hasActiveFilters ? (
                <Search size={27} />
              ) : (
                <GitBranch size={27} />
              )}
            </div>

            <h3 className="font-semibold text-slate-900">
              {hasActiveFilters
                ? "No matching workflows"
                : "No workflows yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters
                ? "No workflows match your current search and filters. Try changing your criteria."
                : "Workflows created from recommendations will appear here. Start by exploring the available recommendations."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <Link to="/recommendations">
                  <Button>
                    <span className="inline-flex items-center gap-2">
                      View Recommendations
                      <ArrowUpRight size={16} />
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onCancel={setWorkflowToCancel}
                cancelling={cancellingId === workflow.id}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400">
        <span>Audex · Workflow Management</span>
        <span>
          Data is loaded from the connected backend API.
        </span>
      </div>

      {workflowToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              cancellingId === null
            ) {
              setWorkflowToCancel(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-workflow-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Ban size={22} />
              </div>

              <div>
                <h2
                  id="cancel-workflow-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Cancel workflow?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Are you sure you want to cancel{" "}
                  <strong>
                    {workflowToCancel.title ||
                      `Workflow #${workflowToCancel.id}`}
                  </strong>
                  ? This action will update the workflow status.
                </p>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancellingId !== null}
                onClick={() => setWorkflowToCancel(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Workflow
              </button>

              <button
                type="button"
                disabled={cancellingId !== null}
                onClick={handleCancelWorkflow}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Ban size={16} />

                {cancellingId !== null
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}