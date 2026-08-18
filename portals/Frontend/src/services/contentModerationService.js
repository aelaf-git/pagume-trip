import { MOCK_CONTENT_ITEMS } from "../constants/mockContentData"

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

let contentItems = clone(MOCK_CONTENT_ITEMS)

export async function getContentItems() {
  await delay(300)
  return clone(contentItems)
}

export async function approveContent(id) {
  await delay(400)
  const idx = contentItems.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error("Content not found")
  contentItems[idx].status = "APPROVED"
  contentItems[idx].flagReason = null
  contentItems[idx].editNote = null
  return clone(contentItems[idx])
}

export async function flagContent(id, reason) {
  await delay(400)
  const idx = contentItems.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error("Content not found")
  contentItems[idx].status = "FLAGGED"
  contentItems[idx].flagReason = reason
  contentItems[idx].editNote = null
  return clone(contentItems[idx])
}

export async function requestEdit(id, reason) {
  await delay(400)
  const idx = contentItems.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error("Content not found")
  contentItems[idx].status = "EDIT_REQUESTED"
  contentItems[idx].editNote = reason
  contentItems[idx].flagReason = null
  return clone(contentItems[idx])
}
