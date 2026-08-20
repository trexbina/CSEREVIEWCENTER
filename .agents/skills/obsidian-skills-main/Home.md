---
title: Welcome to Peak Excellence Knowledge Base
tags:
  - dashboard
  - project-management
---

# 🎓 Peak Excellence Knowledge Base

Welcome to the central developer documentation hub for the Peak Excellence platform. This vault is organized using **Obsidian Flavored Markdown** to support deep cross-linking, properties, and callouts.

> [!info] Tip
> Use `Ctrl/Cmd + O` in Obsidian to quickly search and switch between notes!

---

## 🗺️ Documentation Directory

### 🚀 Getting Started
- [[Project_Readme|Project Readme]] — Essential project introduction and dev commands.
- [[Database_Deployment_Guide|Database Deployment Guide]] — Full instructions for setting up PostgreSQL + pgAdmin.

### 🏗️ Architecture & Security
- [[Subject_Builder_Architecture|Subject Builder Architecture]] — Breakdown of routes, builders, database schemas, and modules.
- [[Intellectual_Property_Protection|Intellectual Property Protection & Content Security]] — Security controls used to protect educational resources.
- [[PDF_Viewer_Strategy_And_Tuning|PDF Viewer Strategy & Tuning Guide]] — Implementation details for React-PDF and performance tiers.

---

## 🔄 Platform Context Overview

```mermaid
graph TD
    User([Student/Admin]) -->|Navigates| AppRouter[Next.js App Router]
    
    subgraph Client-Side Dashboard
        AppRouter -->|Admin Route| Subject_Builder_Architecture[Subject Builder UI]
        AppRouter -->|Student Route| ContentView[Content Viewer]
    end

    subgraph Security Layer
        ContentView -->|Blocks Copy/Right-click| Intellectual_Property_Protection[Intellectual Property Protections]
        ContentView -->|Tuned Rendering| PDF_Viewer_Strategy_And_Tuning[React-PDF Viewer Q1/Q2]
    end

    subgraph Database Layer
        Subject_Builder_Architecture -->|Manages Modules/Lessons| APIEndpoint[/api/admin/subjects/.../modules]
        APIEndpoint -->|pg client| Database_Deployment_Guide[(PostgreSQL reviewapp)]
    end

    class Subject_Builder_Architecture internal-link;
    class Intellectual_Property_Protection internal-link;
    class PDF_Viewer_Strategy_And_Tuning internal-link;
    class Database_Deployment_Guide internal-link;
```
