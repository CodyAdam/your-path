---
name: skill-discover
description: Discover and query skills in the YourPath repository to understand available capabilities. Use when asking "what skills exist?", "what skills can help with X?", "skill catalog", "find skill for Z", or when planning workflows.
---

# Skill Discover

Query skills in the YourPath repo to find capabilities and workflows.

## Discovery Commands

### List all skills

```bash
ls .claude/skills/*/SKILL.md 2>/dev/null | xargs -I {} dirname {} | xargs -I {} basename {}
```

### Read a skill's metadata

```bash
# Quick view (name + description)
head -5 .claude/skills/<skill-name>/SKILL.md

# Full skill
cat .claude/skills/<skill-name>/SKILL.md
```

### Search skills by keyword

```bash
grep -r "<keyword>" .claude/skills/*/SKILL.md 2>/dev/null
```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `skill-creator` | Create new Claude Code skills for YourPath workflows |
| `skill-discover` | This skill — discover available skills |
| `context7` | Look up third-party API & library docs via Context7 MCP |

## YourPath Skill Ideas

Potential skills to create as the project grows:

| Area | Skill Idea | Trigger |
|------|-----------|---------|
| Game Engine | `scenario-builder` | Creating/editing decision tree JSON |
| AI Integration | `evaluation-prompt` | Writing Claude evaluation criteria for nodes |
| Video | `video-pipeline` | Processing/encoding video assets |
| Testing | `game-tester` | Testing game session flows end-to-end |
| Deploy | `deploy` | Building and deploying the monorepo |
