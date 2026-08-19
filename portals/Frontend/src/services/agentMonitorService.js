import { MOCK_AGENT_RUNS, MOCK_WORKFLOWS } from "../constants/mockAgentData"

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export async function getAgentRuns() {
  await delay(400)
  return clone(MOCK_AGENT_RUNS)
}

export async function getWorkflows() {
  await delay(400)
  return clone(MOCK_WORKFLOWS)
}
