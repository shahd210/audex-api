import { apiRequest, unwrapList } from "./api";

const titleCase = (value) =>
  String(value || "draft")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const priorityTitle = (value) => {
  const normalized = String(value || "medium").toLowerCase();
  return normalized === "critical"
    ? "High"
    : normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const normalizeWorkflowStatus = (status) => {
  const normalized = String(status || "draft").toLowerCase().trim();
  const statuses = {
    draft: "draft",
    submitted: "submitted",
    in_review: "in_review",
    evidence_requested: "evidence_requested",
    approved: "approved",
    rejected: "rejected",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  return statuses[normalized] || normalized || "draft";
};

export const workflowStatusLabel = (status) => {
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    in_review: "In Review",
    evidence_requested: "Evidence Requested",
    approved: "Approved",
    rejected: "Rejected",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  const normalized = normalizeWorkflowStatus(status);
  return labels[normalized] || titleCase(normalized);
};

export const mapTaskStatus = (status) => {
  const normalized = String(status || "todo").toLowerCase().trim();
  const statuses = {
    todo: "Pending",
    pending: "Pending",
    in_progress: "In Progress",
    "in progress": "In Progress",
    blocked: "Blocked",
    done: "Completed",
    completed: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };
  return statuses[normalized] || titleCase(normalized);
};

// Completed = 100%, In Progress = 50%,
// Pending / Blocked / Cancelled = 0%.
function calculateWorkflowProgress(
  tasks,
  fallbackProgress = 0,
  rawStatus = "draft"
) {
  if (tasks.length > 0) {
    const totalProgress = tasks.reduce((total, task) => {
      switch (mapTaskStatus(task.status)) {
        case "Completed":
          return total + 100;
        case "In Progress":
          return total + 50;
        default:
          return total;
      }
    }, 0);

    return Math.round(totalProgress / tasks.length);
  }

  if (normalizeWorkflowStatus(rawStatus) === "completed") {
    return 100;
  }

  const value = Number(fallbackProgress);

  return Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

export function mapWorkflow(raw, tasks = []) {
  const rawStatus = normalizeWorkflowStatus(raw.status);

  return {
    id: String(raw.id),
    rawId: raw.id,
    workspaceId: raw.workspace_id,
    recommendationId:
      raw.recommendation_id ?? raw.recommendation?.id ?? null,
    title: raw.title || `Workflow #${raw.id}`,
    description: raw.description || "",
    department: raw.department,
    type: raw.type,
    priority: priorityTitle(raw.priority),

    // Workflow lifecycle status comes from the backend.
    status: workflowStatusLabel(rawStatus),
    rawStatus,

    // Execution progress is calculated from linked tasks.
    progress: calculateWorkflowProgress(
      tasks,
      raw.progress,
      rawStatus
    ),

    ownerId: raw.owner_id,
    dueDate: raw.due_date,
    createdAt: raw.created_at,
    tasks,
  };
}

export async function getWorkflows() {
  const payload = await apiRequest("/workflows?per_page=100");
  const rawWorkflows = unwrapList(payload);

  return Promise.all(
    rawWorkflows.map(async (workflow) => {
      let taskPayload;

      try {
        taskPayload = await apiRequest(
          `/workflows/${workflow.id}/tasks?per_page=100`
        );
      } catch (error) {
        throw new Error(
          `Failed to load tasks for workflow "${
            workflow.title || workflow.id
          }": ${
            error?.message || "Unknown API error"
          }`
        );
      }

      const tasks = unwrapList(taskPayload).map((task) => ({
        id: String(task.id),
        workflowId: String(task.workflow_id ?? workflow.id),
        status: mapTaskStatus(task.status),
      }));

      return mapWorkflow(workflow, tasks);
    })
  );
}

export async function getWorkflowById(id) {
  const payload = await apiRequest(`/workflows/${id}`);

  const workflow =
    payload.workflow ||
    payload.data?.workflow ||
    payload.data ||
    payload;

  if (!workflow || workflow.id == null) {
    throw new Error("Workflow not found.");
  }

  // Use tasks included in the workflow response, if available.
  const rawTasks = Array.isArray(workflow.tasks)
    ? workflow.tasks
    : [];

  const tasks = rawTasks.map((task) => ({
    id: String(task.id),
    workflowId: String(task.workflow_id ?? workflow.id),
    status: mapTaskStatus(task.status),
  }));

  return mapWorkflow(workflow, tasks);
}

export async function createWorkflow(data) {
  const payload = await apiRequest("/workflows", {
    method: "POST",
    body: data,
  });

  const workflow =
    payload.workflow ||
    payload.data?.workflow ||
    payload.data ||
    payload;

  if (workflow?.id == null) {
    throw new Error(
      "The API did not return the created workflow."
    );
  }

  return mapWorkflow(
    workflow,
    Array.isArray(workflow.tasks) ? workflow.tasks : []
  );
}

export async function updateWorkflow(id, data) {
  const payload = await apiRequest(`/workflows/${id}`, {
    method: "PUT",
    body: data,
  });

  const workflow =
    payload.workflow ||
    payload.data?.workflow ||
    payload.data ||
    payload;

  if (workflow?.id == null) {
    throw new Error(
      "The API did not return the updated workflow."
    );
  }

  return mapWorkflow(
    workflow,
    Array.isArray(workflow.tasks) ? workflow.tasks : []
  );
}

export async function cancelWorkflow(
  id,
  reason = "Cancelled by user from Workflow Management"
) {
  const payload = await apiRequest(
    `/workflows/${id}/transition`,
    {
      method: "POST",
      body: {
        to: "cancelled",
        reason,
      },
    }
  );

  return (
    payload.workflow ||
    payload.data?.workflow ||
    payload.data ||
    payload
  );
}