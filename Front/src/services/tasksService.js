
import { apiRequest, unwrapList } from "./api";
import { getWorkflows } from "./workflowsService";

const statusToApi = {
  Pending: "todo",
  "In Progress": "in_progress",
  Blocked: "blocked",
  Completed: "done",
  Cancelled: "cancelled",
};

const statusFromApi = {
  todo: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Completed",
  cancelled: "Cancelled",
};

function extractTask(payload) {
  return payload?.task || payload?.data || payload;
}

function mapTask(raw, workflow = {}) {
  const firstEvidence =
    raw?.evidences?.data?.[0] ||
    raw?.evidences?.[0] ||
    raw?.evidence ||
    null;

  return {
    id: String(raw.id),
    rawId: raw.id,
    title: raw.title || "",
    description: raw.description || "",
    workflowId: String(raw.workflow_id ?? workflow.id ?? ""),
    workflowTitle:
      workflow.title ||
      raw.workflow?.title ||
      `Workflow #${raw.workflow_id ?? workflow.id ?? ""}`,
    assigneeId: String(raw.assignee_id ?? raw.assignee?.id ?? ""),
    assignee: raw.assignee?.name || "",
    dueDate: raw.due_date || "",
    kpi: raw.kpi_name || "",
    kpiTarget: raw.kpi_target ?? "",
    kpiUnit: raw.kpi_unit || "",
    kpiActual: raw.kpi_actual ?? "",
    status: statusFromApi[raw.status] || raw.status || "Pending",
    evidence: firstEvidence?.note || "",
    evidenceId: firstEvidence?.id,
    workspaceId:
      workflow.workspaceId ??
      workflow.workspace_id ??
      raw.workflow?.workspace_id,
    department: workflow.department || raw.workflow?.department,
    createdAt: raw.created_at || "",
  };
}

export async function getUsers() {
  const payload = await apiRequest("/users?per_page=100");

  return unwrapList(payload).map((user) => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
    department: user.department,
  }));
}

export async function getTasks() {
  const workflows = await getWorkflows();

  const groups = await Promise.all(
    workflows.map(async (workflow) => {
      const payload = await apiRequest(
        `/workflows/${workflow.id}/tasks?per_page=100`
      );

      return unwrapList(payload).map((task) =>
        mapTask(task, workflow)
      );
    })
  );

  return groups.flat();
}

export async function createTask(taskData) {
  const workflows = await getWorkflows();

  const workflow = workflows.find(
    (item) => String(item.id) === String(taskData.workflowId)
  );

  if (!workflow) {
    throw new Error("Please select a valid workflow.");
  }

  if (!taskData.assignee) {
    throw new Error("Please select a responsible user.");
  }

  const body = {
    title: taskData.title.trim(),
    description: taskData.description?.trim() || null,
    assignee_id: Number(taskData.assignee),
    due_date: taskData.dueDate,
    kpi_name: taskData.kpi?.trim() || null,
  };

  if (String(taskData.kpiTarget).trim() !== "") {
    body.kpi_target = Number(taskData.kpiTarget);
  }

  if (String(taskData.kpiUnit).trim()) {
    body.kpi_unit = taskData.kpiUnit.trim();
  }

  const payload = await apiRequest(
    `/workflows/${workflow.id}/tasks`,
    {
      method: "POST",
      body,
    }
  );

  return mapTask(extractTask(payload), workflow);
}

export async function updateTask(id, updates) {
  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    const payload = await apiRequest(`/tasks/${id}/status`, {
      method: "PATCH",
      body: {
        status: statusToApi[updates.status] || updates.status,
      },
    });

    const updated = extractTask(payload);
    const allTasks = await getTasks();

    const existing = allTasks.find(
      (task) => String(task.id) === String(id)
    );

    const workflow = existing
      ? {
          id: existing.workflowId,
          title: existing.workflowTitle,
          workspaceId: existing.workspaceId,
          department: existing.department,
        }
      : {};

    return mapTask(updated, workflow);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "evidence")) {
    const currentTasks = await getTasks();

    const currentTask = currentTasks.find(
      (task) => String(task.id) === String(id)
    );

    if (!currentTask) {
      throw new Error("Task not found.");
    }

    const evidenceUrl = String(updates.evidence || "").trim();

    if (!evidenceUrl) {
      throw new Error("Please enter an evidence URL.");
    }

    if (!currentTask.workspaceId || !currentTask.department) {
      throw new Error(
        "The task's workspace information is missing, so evidence cannot be linked."
      );
    }

    if (currentTask.evidenceId) {
      await apiRequest(
        `/evidences/${currentTask.evidenceId}/tasks/${id}/unlink`,
        { method: "DELETE" }
      );
    }

    const evidencePayload = await apiRequest("/evidences", {
      method: "POST",
      body: {
        workspace_id: Number(currentTask.workspaceId),
        department: currentTask.department,
        type: "link",
        title: `Evidence link for: ${currentTask.title}`,
        note: evidenceUrl,
      },
    });

    // The API returns { evidence: { ... } }, not { task: { ... } }.
    const evidence =
      evidencePayload?.evidence ||
      evidencePayload?.data?.evidence ||
      evidencePayload?.data ||
      evidencePayload;

    if (evidence?.id == null) {
      throw new Error(
        "The API did not return the created evidence ID."
      );
    }

    await apiRequest(
      `/evidences/${evidence.id}/tasks/${id}/link`,
      {
        method: "POST",
        body: {},
      }
    );

    return {
      ...currentTask,
      evidence: evidence.note || evidenceUrl,
      evidenceId: evidence.id,
    };
  }

  const currentTasks = await getTasks();

  const currentTask = currentTasks.find(
    (task) => String(task.id) === String(id)
  );

  if (!currentTask) {
    throw new Error("Task not found.");
  }

  const workflow = {
    id: currentTask.workflowId,
    title: currentTask.workflowTitle,
    workspaceId: currentTask.workspaceId,
    department: currentTask.department,
  };

  const fieldMap = {
    title: {
      api: "title",
      current: currentTask.title,
      convert: (value) => String(value ?? "").trim(),
    },
    description: {
      api: "description",
      current: currentTask.description,
      convert: (value) => String(value ?? "").trim() || null,
    },
    assignee: {
      api: "assignee_id",
      current: currentTask.assigneeId,
      convert: (value) => Number(value),
    },
    dueDate: {
      api: "due_date",
      current: currentTask.dueDate,
      convert: (value) => value,
    },
    kpi: {
      api: "kpi_name",
      current: currentTask.kpi,
      convert: (value) => String(value ?? "").trim() || null,
    },
    kpiTarget: {
      api: "kpi_target",
      current: currentTask.kpiTarget,
      convert: (value) =>
        String(value ?? "").trim() === ""
          ? null
          : Number(value),
    },
    kpiUnit: {
      api: "kpi_unit",
      current: currentTask.kpiUnit,
      convert: (value) => String(value ?? "").trim() || null,
    },
    kpiActual: {
      api: "kpi_actual",
      current: currentTask.kpiActual,
      convert: (value) =>
        String(value ?? "").trim() === ""
          ? null
          : Number(value),
    },
  };

  const body = {};

  for (const [key, config] of Object.entries(fieldMap)) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) {
      continue;
    }

    const nextValue = config.convert(updates[key]);
    const currentValue = config.current;

    if (
      String(nextValue ?? "") !==
      String(currentValue ?? "")
    ) {
      body[config.api] = nextValue;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "assignee")) {
    if (!Number.isFinite(body.assignee_id) || body.assignee_id <= 0) {
      throw new Error("Please select a valid responsible user.");
    }
  }

  if (Object.keys(body).length === 0) {
    return currentTask;
  }

  const payload = await apiRequest(`/tasks/${id}`, {
    method: "PATCH",
    body,
  });

  return mapTask(extractTask(payload), workflow);
}
