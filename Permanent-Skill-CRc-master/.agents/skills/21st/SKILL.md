---
name: 21st-cli-use
description: >-
  Search, install and pull code from the 21st.dev catalog with the `21st` CLI
  (`@21st-dev/cli`): find React/shadcn components, themes and templates, print a
  component's code or a theme's CSS, install an item into the project, or
  generate a new component with 21st AI. Use whenever the user says "search/find
  a component/theme on 21st", "install our team's Button", "add @user/slug",
  "pull that component's code", or wants to find animated React/Tailwind components from 21st.dev.
---

# 21st.dev MCP & CLI — Find, Install & Generate UI Components

The `21st` CLI (`npx @21st-dev/cli`, bin `21st`) and 21st MCP server provide direct access to the 21st.dev catalog of 12,000+ hand-crafted React and Tailwind CSS components.

## Endpoints

- **MCP Endpoint**: `https://21st.dev/api/mcp`
- **Read-Only MCP (Free / Unmetered Search)**: `https://21st.dev/api/mcp/readonly`
- **API Key Setup**: Get key at `https://21st.dev/mcp` or `https://21st.dev/settings/api-keys`.

## Key Commands

```bash
# 1. Search components
npx @21st-dev/cli search "animated button" --limit 10
npx @21st-dev/cli search "pricing table" --type c

# 2. Search brand and UI logos (free, no login required)
npx @21st-dev/cli logo "google meet"
npx @21st-dev/cli logo "supabase"

# 3. Pull component code directly
npx @21st-dev/cli get <component-id>

# 4. Install component into project
npx @21st-dev/cli add <user>/<slug>
```
