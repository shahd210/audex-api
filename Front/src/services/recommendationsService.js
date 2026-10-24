
import { apiRequest, unwrapList } from "./api";
import { getWorkflows } from "./workflowsService";
import { getTasks, createTask, updateTask } from "./tasksService";

function priorityFromApi(priority) {
  const value = String(priority ?? "").toLowerCase();

  if (value === "critical" || value === "high") {
    return "High";
  }

  if (value === "medium") {
    return "Medium";
  }

  if (value === "low") {
    return "Low";
  }

  return "Medium";
}

function workflowStatusFromApi(status) {
  const value = String(status ?? "").toLowerCase();

  if (value === "draft" || value === "pending") {
    return "Pending";
  }

  if (value === "active" || value === "in_progress") {
    return "In Progress";
  }

  if (value === "completed" || value === "complete") {
    return "Completed";
  }

  if (value === "cancelled" || value === "canceled") {
    return "Cancelled";
  }

  if (value === "rejected") {
    return "Rejected";
  }

  return "Pending";
}

function mapRecommendation(item) {
  const workflows = Array.isArray(item.workflows_summary)
    ? item.workflows_summary
    : [];

  // Ignore cancelled and rejected workflows when determining
  // whether this recommendation has an active workflow.
  const linkedWorkflow =
    workflows.find((workflow) => {
      const status = String(workflow.status ?? "").toLowerCase();

      return !["cancelled", "canceled", "rejected"].includes(status);
    }) ?? null;

  const recommendationStatus = String(item.status ?? "").toLowerCase();

  const isLinked =
    recommendationStatus === "linked" || Boolean(linkedWorkflow);

  let status = "Pending";

  if (isLinked) {
    status = "Converted";
  } else if (recommendationStatus === "dismissed") {
    status = "Dismissed";
  }

  return {
    id: item.id,
    workspaceId: item.workspace_id,
    department: item.department || "",
    title: item.title || "Untitled Recommendation",
    description: item.summary || item.details || "",
    details: item.details || "",
    category: item.department || "General",
    priority: priorityFromApi(item.priority),
    status,
    suggestedAction: item.details || item.summary || "",
    impact: item.impact || "",
    workflowId: linkedWorkflow?.id ?? null,
    createdAt: item.created_at ?? null,
  };
}

export async function getRecommendations() {
  const payload = await apiRequest("/recommendations?per_page=100");

  return unwrapList(payload).map(mapRecommendation);
}

export async function getRecommendationById(id) {
  const payload = await apiRequest(`/recommendations/${id}`);

  const item =
    payload.recommendation ??
    payload.data?.recommendation ??
    payload.data ??
    payload;

  if (!item || item.id == null) {
    throw new Error("Recommendation not found.");
  }

  return mapRecommendation(item);
}

export async function createWorkflowFromRecommendation(id) {
  const recommendation = await getRecommendationById(id);

  if (recommendation.workflowId) {
    throw new Error(
      "A workflow already exists for this recommendation."
    );
  }

  if (!recommendation.workspaceId) {
    throw new Error(
      "This recommendation has no workspace assigned."
    );
  }

  const payload = await apiRequest("/workflows", {
    method: "POST",
    body: {
      workspace_id: Number(recommendation.workspaceId),
      recommendation_id: Number(recommendation.id),
      title: recommendation.title,
      description:
        recommendation.details || recommendation.description,
      department: recommendation.department,
      type: "other",
      priority: recommendation.priority.toLowerCase(),
    },
  });

  const raw =
    payload.workflow ??
    payload.data?.workflow ??
    payload.data ??
    payload;

  if (raw.id == null) {
    throw new Error(
      "The workflow was not returned by the server."
    );
  }

  return {
    ...raw,
    id: raw.id,
    title: raw.title || recommendation.title,
    description:
      raw.description || recommendation.description,
    recommendationId:
      raw.recommendation_id ?? recommendation.id,
    priority: priorityFromApi(raw.priority),
    status: workflowStatusFromApi(raw.status),
    progress: Number(raw.progress ?? 0),
    createdAt: raw.created_at ?? null,
  };
}

export { getWorkflows };
export { getTasks, createTask, updateTask };
