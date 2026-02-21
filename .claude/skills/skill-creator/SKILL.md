---
name: skill-creator
description: Create new Claude Code skills for YourPath development workflows. Use when asked to add a new skill, document a repeatable process, or scaffold a workflow.
---

# Skill Creator

Create modular, context-efficient skills for YourPath development.

## Quick Start

To create a new skill:

1. Create directory: `.claude/skills/<skill-name>/`
2. Create `SKILL.md` with frontmatter + instructions
3. Optionally add `scripts/`, `references/`, `assets/`

## Skill Structure

```
.claude/skills/<skill-name>/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: executable helpers
├── references/           # Optional: loaded on-demand docs
└── assets/               # Optional: templates, files for output
```

## SKILL.md Template

```yaml
---
name: skill-name
description: What it does AND when to trigger it. Include specific scenarios like "Use when asked to...", "Use when working with...", "Use when debugging...". This is the ONLY part always in context.
---

# Skill Name

## Quick Start

[Most common usage in 3-5 lines]

## Key Patterns

[Essential patterns with code examples]

## Common Issues

[Troubleshooting for frequent problems]

## Reference

[Links to files, commands, or detailed docs]
```

## Writing Guidelines

### Naming Convention (Required)

The `name` field in frontmatter MUST be:
- **All lowercase**
- **No spaces** - use hyphens (`-`) instead
- **Match the directory name**

```yaml
# GOOD
name: my-new-skill
name: pipeline-helper
name: agent-debug

# BAD
name: My New Skill
name: myNewSkill
name: MY_SKILL
```

### Frontmatter Description (Critical)

The description triggers the skill. Include:
- **What** it does
- **When** to use it (specific scenarios)
- **Keywords** users might say

```yaml
# GOOD - Specific triggers
description: Debug game session issues in YourPath. Use when investigating
video playback failures, decision tree errors, or emotion recognition problems.

# BAD - Too vague
description: Helps with game stuff.
```

### Body Content

- **Concise**: Keep under 500 lines (ideally 200-300)
- **Actionable**: Commands, code snippets, checklists
- **No fluff**: Skip obvious explanations Claude already knows
- **YourPath-specific**: Reference actual files, patterns, conventions

### What to Include

| Include | Example |
|---------|---------|
| Quick commands | `pnpm dev`, `pnpm --filter backend dev` |
| Code templates | Boilerplate with project conventions |
| File references | `useGameSession.ts`, `evaluate.ts` |
| Checklists | Review criteria, debugging steps |
| Anti-patterns | Common mistakes to avoid |

### What NOT to Include

- Generic programming knowledge
- Explanations Claude already has
- Redundant documentation
- README, CHANGELOG, etc.

## YourPath Skill Categories

Consider skills for these areas:

### Game Engine
- Decision tree design patterns
- Video node transitions
- Game state machine debugging

### AI Integration
- Claude API prompt patterns for evaluation
- SER/FER integration
- Emotion score calibration

### Frontend
- Vue 3 Composition API patterns
- Video player component patterns
- Canvas idle animation

### Backend
- Express route patterns
- Scenario JSON validation
- Session management

### Shared
- Type definitions across packages
- Zod schema patterns
- API contract changes

## Existing Skills

| Skill | Purpose |
|-------|---------|
| `skill-creator` | This skill - create new skills |
| `skill-discover` | Discover skills across repos |
| `context7` | Look up third-party API docs |

## Validation Checklist

Before finalizing a skill:

- [ ] Description includes trigger scenarios
- [ ] Body under 500 lines
- [ ] Code examples use YourPath conventions (TypeScript, Vue 3, Express)
- [ ] References actual project files
- [ ] No redundant/obvious content
- [ ] Tested with realistic prompts
