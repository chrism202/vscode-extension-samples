# Next Steps Roadmap

High-priority follow-up work for the Markdown WYSIWYG Editor extension.

## 1. Markdown Tables
- **Goal:** Round-trip editing of GitHub-flavored tables with visual controls.
- **Key Tasks:** Extend Markdown⇄HTML conversion to include table support, add toolbar buttons for row/column operations, and safeguard serialization so manual edits preserve alignment.
- **Dependencies:** Ensure the `marked` and `turndown` pipelines handle tables or swap in plugins; update webview styling for responsive rendering.
- **Definition of Done:** Users can view, edit, insert, and delete tables without losing structure when saving back to `.md`.

## 2. MCP Connections (Quip & Personal Context Providers)
- **Goal:** Allow writers to pull structured context directly into the AI Assistant panel via Model Context Protocol (MCP).
- **Key Tasks:** Implement MCP client glue code, define Quip connection settings/UI, and expose APIs so additional personal providers can register.
- **Dependencies:** Confirm VS Code extension sandboxing allows outbound MCP connections; document auth and configuration flow.
- **Definition of Done:** Users can authenticate, browse, and inject Quip/personal contexts into `.ai-assistant` files from within the assistant view.

## 3. TK Scanner & Contextual Completions
- **Goal:** Automatically detect “TK” placeholders in markdown, query relevant-context files, and surface suggested completions.
- **Key Tasks:** Build file scanner service (triggered on save and command palette), rank relevant context snippets, and surface suggestions via code actions or AI Assistant prompts.
- **Dependencies:** Requires stable storage format for relevant context files and completion UX decisions (inline vs panel suggestions).
- **Definition of Done:** TK placeholders receive actionable suggestions sourced from relevant context with opt-in apply/ignore workflow.

## Tracking
- Create issues in this repository or your project tracker referencing this file.
- Update progress with checklists or links to design docs as work begins.
