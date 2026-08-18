/**
 * guardrails — AGENTS.md is human-owned.
 *
 * Blocks agent attempts to modify any AGENTS.md:
 *  - write/edit tool calls targeting an AGENTS.md path
 *  - bash commands that both mention AGENTS.md and carry a write intent
 *    (>, >>, sed -i, tee, mv, rm, python, ...)
 *
 * Agents must ask the user instead; the user edits AGENTS.md directly.
 * Read-only bash mentions (e.g. `grep AGENTS.md .`) pass — prefer the
 * read/grep tools anyway.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const AGENTS_MD = "AGENTS.md";
const WRITE_HINTS = [
  ">>", "> ", "sed", "tee", "mv", "cp ", "rm ", "python", "perl",
  "ruby", "touch", "dd ", "install", "truncate", "cat >", "sd ",
];

function isAgentsMdPath(path: unknown): boolean {
  return typeof path === "string" && (path === AGENTS_MD || path.endsWith("/" + AGENTS_MD));
}

function isWriteIntent(command: string): boolean {
  return WRITE_HINTS.some((hint) => command.includes(hint));
}

export default function guardrails(pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    const input = event.input;

    if (event.toolName === "write" || event.toolName === "edit") {
      if (isAgentsMdPath(input?.path)) {
        return {
          block: true,
          reason:
            "AGENTS.md is human-owned. Do not edit it — ask the user to make this change; the user edits AGENTS.md directly.",
        };
      }
    }

    if (event.toolName === "bash" && typeof input?.command === "string") {
      const command = input.command;
      if (command.includes(AGENTS_MD) && isWriteIntent(command)) {
        return {
          block: true,
          reason:
            "AGENTS.md is human-owned — edits are made by the user, not agents. If you meant to read AGENTS.md, use the read tool.",
        };
      }
    }
  });
}
