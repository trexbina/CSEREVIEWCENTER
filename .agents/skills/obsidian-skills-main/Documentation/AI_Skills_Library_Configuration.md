---
title: AI Skills Library & System Prompt Configurations
tags:
  - ai-agents
  - configuration
  - documentation
  - tool-builder
---

# 🤖 AI Skills Library & System Prompt Configurations

| Property | Value |
| :--- | :--- |
| **Library Folder** | `.agent/` |
| **Documentation Folder** | `.agent/skills/obsidian-skills-main/Documentation/` |
| **Default Active Skill** | **Agent Tool Builder** |

---

## 📝 Overview

The **AI Skills Library** is configured to centralize custom AI capabilities within the `.agent/` folder. This documentation defines how the AI agent processes skills, the execution rules for prompts, and a structured summary of the default **Agent Tool Builder** skill.

---

## ⚙️ Execution Rules

### 1. Default Behavior
By default, the **Agent Tool Builder** skill is loaded and applied to every prompt. This ensures that any tool design, API definition, or function schema constructed during development adheres to safety and efficiency best practices.

### 2. Scenario-Specific Overrides
If a task requires specialized expertise, you can request an alternative skill folder. For example:
- Mentioning `@[.agent/skills/data-analyst]` will switch the agent context to data analysis, regression modeling, and statistical inference.
- Mentioning `@[.agent/skills/code-reviewer]` will switch the agent context to code quality and review checklists.

---

## 🛠️ Summarized Skill: Agent Tool Builder

The **Agent Tool Builder** defines rules for building high-quality, robust tools that AI agents can interact with reliably.

### 🔑 Core Principles
* **Descriptions Over Code:** The LLM does not see the tool's implementation code—it only reads the schema and descriptions. High-quality descriptions are crucial.
* **Minimize Tools:** Aim for fewer than 20 tools to avoid LLM context confusion.
* **Error Transparency:** Never fail silently. Explicitly return detailed errors so the LLM can self-correct.
* **String Returns:** Tools should return JSON strings rather than raw objects.

### 📋 JSON Schema Guidelines
1. **Detailed Descriptions:** Include what the tool does, expected parameter formats, unit types, examples, and limitations.
2. **Use Enums:** Constrain inputs to exact lists (e.g. `['low', 'medium', 'high']`) to prevent hallucinated values.
3. **Explicitly Require Fields:** Use the `required` array and set `additionalProperties: false` where strict schema compliance is needed.
4. **Tool Use Examples:** Provide 1-5 concrete input/output examples within the tool definition to guide complex object nesting.

### 🚨 Error Handling Architecture
When a tool fails, it must return an informative structure containing:
* `is_error: true`
* `error_type` (e.g., `validation_error`, `rate_limit`, `not_found`)
* A descriptive error message explaining the failure.
* Suggested actions or correct inputs to help the LLM automatically re-try.

### ⚡ Parallel & Asynchronous Execution
* Claude supports calling multiple independent tools simultaneously in a single response.
* All parallel tool results must be submitted back to the model within a single message to maintain proper conversation flow.

### 🔍 Validation Checklist for Tools
- [ ] Tool description is at least 100 characters.
- [ ] All parameters have clear descriptions and expected formats.
- [ ] Try-except block wraps the execution code to catch errors.
- [ ] SQL queries use parameterized queries (never string concatenation).
- [ ] External HTTP requests have timeouts configured.

---

## 📚 Related Documentation
- [[Database_Deployment_Guide]] — Guidelines on managing postgres database deployment steps.
- [[Intellectual_Property_Protection]] — Details on frontend browser restriction implementations.
- [[Home]] — Go back to the Knowledge Base Dashboard.
