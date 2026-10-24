import { useCallback, useEffect, useState } from "react";
import {Search, Lightbulb,ArrowRight,ChevronDown,ChevronUp, GitBranch,RefreshCw,CheckCircle2,AlertCircle,ExternalLink,Target, TrendingUp,Filter,X,} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import {getRecommendations,createWorkflowFromRecommendation,} from "../services/recommendationsService";

const priorityVariants = {
  High: "danger",
  Medium: "warning",
  Low: "info",
};

function getPriorityVariant(priority) {
  return priorityVariants[priority] || "default";
}

function getRecommendationStatus(item) {
  if (item.workflowId || item.status === "Converted") {
    return "Converted";
  }

  return item.status || "Pending";
}

function getStatusVariant(status) {
  if (status === "Converted") return "success";
  if (status === "In Progress") return "info";
  if (status === "Completed") return "success";

  return "default";
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRecommendations();

      if (!Array.isArray(data)) {
        throw new Error("Invalid recommendations data received.");
      }

      setRecommendations(data);
    } catch (err) {
      setError(
        err.message || "Failed to load recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const pendingCount = recommendations.filter(
    (item) => getRecommendationStatus(item) === "Pending"
  ).length;

  const convertedCount = recommendations.filter(
    (item) => getRecommendationStatus(item) === "Converted"
  ).length;

  const highPriorityCount = recommendations.filter(
    (item) => item.priority === "High"
  ).length;

  const filteredRecommendations = recommendations.filter((item) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      [
        item.title,
        item.description,
        item.category,
        item.suggestedAction,
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchText)
      );

    const matchesPriority =
      priorityFilter === "All" || item.priority === priorityFilter;

    const status = getRecommendationStatus(item);

    const matchesStatus =
      statusFilter === "All" || status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  async function handleCreateWorkflow(item) {
    if (
      creatingId !== null ||
      getRecommendationStatus(item) === "Converted"
    ) {
      return;
    }

    setCreatingId(item.id);
    setError("");
    setSuccess("");

    try {
      const workflow = await createWorkflowFromRecommendation(item.id);

      if (!workflow || workflow.id == null) {
        throw new Error(
          "The workflow response is missing its ID. Please refresh and check whether it was created."
        );
      }

      setRecommendations((current) =>
        current.map((recommendation) =>
          recommendation.id === item.id
            ? {
                ...recommendation,
                status: "Converted",
                workflowId: workflow.id,
              }
            : recommendation
        )
      );

      setSuccess(
        `Workflow #${workflow.id} was created for "${item.title}".`
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not create the workflow. Please try again."
      );
    } finally {
      setCreatingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setPriorityFilter("All");
    setStatusFilter("All");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    priorityFilter !== "All" ||
    statusFilter !== "All";

  if (loading) {
    return (
      <div
        className="flex min-h-[300px] flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <RefreshCw
          size={30}
          className="animate-spin text-indigo-600"
        />
        <p className="text-sm text-slate-500">
          Loading recommendations...
        </p>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle
          size={36}
          className="mx-auto mb-3 text-red-500"
        />

        <h1 className="text-xl font-bold text-slate-900">
          Unable to load recommendations
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <div className="mt-5">
          <Button onClick={loadRecommendations}>
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb size={24} className="text-indigo-600" />

            <h1 className="text-2xl font-bold text-slate-900">
              Recommendations
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review AI-driven insights, evaluate suggested actions, and
            convert recommendations into actionable workflows that can
            be assigned and tracked.
          </p>
        </div>

        <Link to="/workflows" className="shrink-0">
          <Button variant="secondary">
            <GitBranch size={16} className="mr-2" />
            View Workflows
            <ExternalLink size={15} className="ml-2" />
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Recommendations
            </p>

            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Lightbulb size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {recommendations.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Available recommendations
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Target size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-amber-600">
            {pendingCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Awaiting workflow creation
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Converted to Workflows
            </p>

            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-emerald-600">
            {convertedCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Linked to execution workflows
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              High Priority
            </p>

            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <TrendingUp size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-red-600">
            {highPriorityCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Recommendations requiring attention
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">
              Something went wrong
            </p>
            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="rounded p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Workflow created successfully
            </p>
            <p className="mt-1">{success}</p>
          </div>

          <Link
            to="/workflows"
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            View
          </Link>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="rounded p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />

          <h2 className="font-semibold text-slate-800">
            Find Recommendations
          </h2>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              aria-label="Search recommendations"
              placeholder="Search by title, description, category, or action..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Converted">Converted</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={clearFilters}
            >
              <X size={16} className="mr-2" />
              Clear
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Showing {filteredRecommendations.length} of{" "}
          {recommendations.length} recommendations
        </p>
      </section>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Search size={26} className="text-slate-400" />
          </div>

          <h2 className="font-semibold text-slate-800">
            {recommendations.length === 0
              ? "No recommendations available"
              : "No matching recommendations"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {recommendations.length === 0
              ? "Recommendations will appear here when they are available from the data source."
              : "Try another search term or change your filters to find the recommendation you need."}
          </p>

          {hasActiveFilters ? (
            <div className="mt-5">
              <Button
                variant="secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="mt-5">
              <Button
                variant="secondary"
                onClick={loadRecommendations}
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh Recommendations
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((item) => {
            const expanded = expandedId === item.id;
            const status = getRecommendationStatus(item);
            const converted = status === "Converted";
            const creating = creatingId === item.id;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                {/* Recommendation Header */}
                <div className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Lightbulb size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-slate-900">
                            {item.title || "Untitled Recommendation"}
                          </h2>
                        </div>

                        {item.category && (
                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {item.category}
                          </p>
                        )}

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.description ||
                            "No description available for this recommendation."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge
                            variant={getPriorityVariant(item.priority)}
                          >
                            {item.priority || "Unspecified"} Priority
                          </Badge>

                          <Badge variant={getStatusVariant(status)}>
                            {status}
                          </Badge>

                          {converted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <CheckCircle2 size={13} />
                              Workflow linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        setExpandedId(expanded ? null : item.id)
                      }
                      aria-expanded={expanded}
                      className="shrink-0"
                    >
                      {expanded ? "Hide Details" : "View Details"}

                      {expanded ? (
                        <ChevronUp
                          size={16}
                          className="ml-2"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          className="ml-2"
                        />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Recommendation Details */}
                  {expanded && (
                    <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <Target
                            size={17}
                            className="text-indigo-600"
                          />

                          <h3 className="text-sm font-semibold text-slate-800">
                            Suggested Action
                          </h3>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.suggestedAction ||
                            "No suggested action is available."}
                        </p>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp
                            size={17}
                            className="text-emerald-600"
                          />

                          <h3 className="text-sm font-semibold text-slate-800">
                            Expected Impact
                          </h3>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.impact ||
                            "Expected impact has not been specified."}
                        </p>
                      </div>

                      {converted && (
                        <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">
                              Linked Workflow
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Workflow ID: {item.workflowId}
                            </p>
                          </div>

                          <Link to="/workflows">
                            <Button variant="secondary">
                              View Workflows
                              <ArrowRight
                                size={16}
                                className="ml-2"
                              />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommendation Actions */}
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Recommendation #{item.id}
                    </p>

                    {converted ? (
                      <p className="mt-1 text-xs text-emerald-700">
                        Workflow #{item.workflowId} is linked to this recommendation.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">
                        Convert this recommendation into an actionable workflow.
                      </p>
                    )}
                  </div>

                  {converted ? (
                    <Link to="/workflows">
                      <Button variant="secondary">
                        <GitBranch
                          size={16}
                          className="mr-2"
                        />
                        View Workflow List
                        <ArrowRight
                          size={16}
                          className="ml-2"
                        />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      disabled={creatingId !== null}
                      onClick={() => handleCreateWorkflow(item)}
                    >
                      {creating ? (
                        <>
                          <RefreshCw
                            size={16}
                            className="mr-2 animate-spin"
                          />
                          Creating Workflow...
                        </>
                      ) : (
                        <>
                          <GitBranch
                            size={16}
                            className="mr-2"
                          />
                          Create Workflow
                          <ArrowRight
                            size={16}
                            className="ml-2"
                          />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Refresh */}
      {recommendations.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={loading || creatingId !== null}
            onClick={loadRecommendations}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </Button>
        </div>
      )}
    </div>
  );
}