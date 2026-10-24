import { useCallback, useEffect, useMemo, useState } from "react";
import {ClipboardList,GitBranch,CheckCircle2,Clock,AlertTriangle,TrendingUp,Lightbulb,ArrowRight,RefreshCw,AlertCircle,} from "lucide-react";
import { Link } from "react-router-dom";
import { getTasks } from "../services/tasksService";
import { getWorkflows } from "../services/workflowsService";
import { getRecommendations } from "../services/recommendationsService";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (!value) return null;

  const datePart = String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().trim();

  if (["done", "completed", "complete"].includes(value)) {
    return "Completed";
  }

  if (["in_progress", "in progress", "in-progress"].includes(value)) {
    return "In Progress";
  }

  if (["blocked"].includes(value)) {
    return "Blocked";
  }

  if (["cancelled", "canceled"].includes(value)) {
    return "Cancelled";
  }

  if (["todo", "pending", "not_started", "not started"].includes(value)) {
    return "Pending";
  }

  return status || "Pending";
}

function isFinished(task) {
  const status = normalizeStatus(task.status);
  return status === "Completed" || status === "Cancelled";
}

function getWorkflowTasks(tasks, workflow) {
  return tasks.filter(
    (task) => String(task.workflowId) === String(workflow.id),
  );
}


function getWorkflowProgress(workflow, tasks) {
  const linkedTasks = getWorkflowTasks(tasks, workflow);

  if (linkedTasks.length === 0) {
    const fallback = Number(workflow.progress);

    return Number.isFinite(fallback)
      ? Math.max(0, Math.min(100, Math.round(fallback)))
      : 0;
  }

  const totalProgress = linkedTasks.reduce((total, task) => {
    const status = normalizeStatus(task.status);

    switch (status) {
      case "Completed":
        return total + 100;

      case "In Progress":
        return total + 50;

      case "Pending":
      case "Blocked":
      case "Cancelled":
      default:
        return total;
    }
  }, 0);

  return Math.round(totalProgress / linkedTasks.length);
}


function getWorkflowStatus(workflow, tasks) {
  const linkedTasks = getWorkflowTasks(tasks, workflow);

  if (linkedTasks.length > 0) {
    if (linkedTasks.every((task) => isFinished(task))) {
      const allCancelled = linkedTasks.every(
        (task) => normalizeStatus(task.status) === "Cancelled",
      );

      return allCancelled ? "Cancelled" : "Completed";
    }

    if (
      linkedTasks.some(
        (task) => normalizeStatus(task.status) === "Blocked",
      )
    ) {
      return "Blocked";
    }

    if (
      linkedTasks.some(
        (task) => normalizeStatus(task.status) === "In Progress",
      )
    ) {
      return "In Progress";
    }

    return "Pending";
  }

  return normalizeStatus(workflow.status);
}

function getStatusVariant(status) {
  switch (normalizeStatus(status)) {
    case "Completed":
      return "success";
    case "In Progress":
      return "info";
    case "Blocked":
      return "danger";
    case "Pending":
      return "warning";
    default:
      return "default";
  }
}

function getErrorMessage(error) {
  return error?.message || "Failed to load dashboard data. Please try again.";
}

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [tasksData, workflowsData, recommendationsData] =
        await Promise.all([
          getTasks(),
          getWorkflows(),
          getRecommendations(),
        ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
      setRecommendations(
        Array.isArray(recommendationsData) ? recommendationsData : [],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const today = useMemo(() => parseLocalDate(getLocalDate()), []);

  const taskStats = useMemo(() => {
    const completed = tasks.filter(
      (task) => normalizeStatus(task.status) === "Completed",
    ).length;

    const inProgress = tasks.filter(
      (task) => normalizeStatus(task.status) === "In Progress",
    ).length;

    const pending = tasks.filter(
      (task) => normalizeStatus(task.status) === "Pending",
    ).length;

    const blocked = tasks.filter(
      (task) => normalizeStatus(task.status) === "Blocked",
    ).length;

    const overdue = tasks.filter((task) => {
      if (isFinished(task) || !today) return false;

      const dueDate = parseLocalDate(task.dueDate);
      return dueDate !== null && dueDate < today;
    }).length;

    const dueSoon = tasks.filter((task) => {
      if (isFinished(task) || !today) return false;

      const dueDate = parseLocalDate(task.dueDate);

      if (!dueDate || dueDate < today) return false;

      const daysLeft = Math.round(
        (dueDate.getTime() - today.getTime()) / 86400000,
      );

      return daysLeft <= 3;
    }).length;

    const completionRate =
      tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending,
      blocked,
      overdue,
      dueSoon,
      completionRate,
    };
  }, [tasks, today]);

  const pendingRecommendations = useMemo(
    () =>
      recommendations.filter(
        (recommendation) =>
          normalizeStatus(recommendation.status) === "Pending",
      ),
    [recommendations],
  );

  const activeWorkflows = useMemo(
    () =>
      workflows.filter((workflow) => {
        const status = getWorkflowStatus(workflow, tasks);
        return status !== "Completed" && status !== "Cancelled";
      }).length,
    [workflows, tasks],
  );

  const stats = [
    {
      title: "Total Tasks",
      value: taskStats.total,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Completed Tasks",
      value: taskStats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "In Progress",
      value: taskStats.inProgress,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Active Workflows",
      value: activeWorkflows,
      icon: GitBranch,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of recommendations, workflows, and task execution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">
                Unable to refresh dashboard data
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="mt-3 text-sm font-semibold text-red-800 underline disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Execution overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Task Execution</h2>
              <p className="mt-1 text-sm text-gray-500">
                Completion based on task statuses from the API
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Overall completion
              </span>
              <span className="font-semibold text-gray-900">
                {taskStats.completionRate}%
              </span>
            </div>

            <ProgressBar value={taskStats.completionRate} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-green-700">Completed</p>
              <p className="mt-1 text-xl font-bold text-green-800">
                {taskStats.completed}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-700">In Progress</p>
              <p className="mt-1 text-xl font-bold text-blue-800">
                {taskStats.inProgress}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="mt-1 text-xl font-bold text-yellow-800">
                {taskStats.pending}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-700">Blocked</p>
              <p className="mt-1 text-xl font-bold text-red-800">
                {taskStats.blocked}
              </p>
            </div>
          </div>

          {tasks.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">
              No tasks are available yet. Create tasks under a workflow to
              start tracking progress.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="font-semibold text-gray-900">Deadlines</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
              <div>
                <p className="text-sm text-red-700">Overdue tasks</p>
                <p className="mt-1 text-2xl font-bold text-red-800">
                  {taskStats.overdue}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-orange-50 p-4">
              <div>
                <p className="text-sm text-orange-700">Due within 3 days</p>
                <p className="mt-1 text-2xl font-bold text-orange-800">
                  {taskStats.dueSoon}
                </p>
              </div>
              <Clock className="h-6 w-6 text-orange-500" />
            </div>

            <p className="text-xs text-gray-500">
              Completed and cancelled tasks are excluded from deadline alerts.
            </p>
          </div>
        </Card>
      </div>

      {/* Workflows */}
      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Recent Workflows</h2>
            <p className="mt-1 text-sm text-gray-500">
              Progress calculated from linked tasks
            </p>
          </div>

          <Link
            to="/workflows"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="py-8 text-center">
            <GitBranch className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">No workflows yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Convert a recommendation into a workflow to get started.
            </p>
            <Link
              to="/recommendations"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              View recommendations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.slice(0, 4).map((workflow) => {
              const progress = getWorkflowProgress(workflow, tasks);
              const status = getWorkflowStatus(workflow, tasks);
              const linkedTasks = getWorkflowTasks(tasks, workflow);

              return (
                <div
                  key={workflow.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {workflow.title || `Workflow #${workflow.id}`}
                      </h3>
                      {workflow.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {workflow.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {linkedTasks.length} linked{" "}
                        {linkedTasks.length === 1 ? "task" : "tasks"}
                      </p>
                    </div>

                    <Badge variant={getStatusVariant(status)}>{status}</Badge>
                  </div>

                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold text-gray-800">
                      {progress}%
                    </span>
                  </div>

                  <ProgressBar value={progress} showLabel={false} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pending recommendations */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold text-gray-900">
              Pending Recommendations
            </h2>
          </div>

          <Link
            to="/recommendations"
            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {pendingRecommendations.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No pending recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRecommendations.slice(0, 3).map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {recommendation.title || "Untitled recommendation"}
                  </h3>
                  {recommendation.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {recommendation.description}
                    </p>
                  )}
                </div>

                <Badge variant={getStatusVariant(recommendation.status)}>
                  {normalizeStatus(recommendation.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <span>Audex · Dashboard</span>
        <span>Data is loaded from the connected backend API.</span>
      </div>
    </div>
  );
}

export default Dashboard;
