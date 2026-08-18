/**
 * guardrails — AGENTS.md is human-owned.
 *
 * Blocks write/edit tool calls targeting any AGENTS.md. Agents must ask the
 * user instead; the user edits AGENTS.md directly. This makes "no edits
 * without explicit user approval" enforced rather than advisory.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function guardrails(pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    if (event.toolName !== "write" && event.toolName !== "edit") {
      return;
    }
    const path = event.input?.path;
    if (typeof path !== "string") {
      return;
    }
    if (path !== "AGENTS.md" && !path.endsWith("/AGENTS.md")) {
      return;
    }
    return {
      block: true,
      reason:
        "AGENTS.md is human-owned. Do not edit it — ask the user to make this change; the user edits AGENTS.md directly.",
    };
  });
}
