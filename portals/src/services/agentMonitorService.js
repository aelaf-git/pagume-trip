import { api } from "./api";

export async function getDashboardStats() {
  return api.get("/admin/dashboard/stats");
}

export async function getAgentRuns() {
  const rows = await api.get("/admin/agent-runs");
  return rows.map((r) => {
    let status = r.status || "COMPLETED";
    if (status === "completed") status = "COMPLETED";
    return {
      id: String(r.id),
      agent: r.agent,
      task: r.task,
      inputParams: r.input_params || {},
      toolsCalled: r.tools_called || [],
      toolResults: r.tool_results || [],
      decisions: r.decisions || [],
      duration:
        r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—",
      tokenUsage: r.token_usage || {},
      status,
      createdAt: r.created_at,
    };
  });
}


export async function getWorkflows() {
  return [];
}
