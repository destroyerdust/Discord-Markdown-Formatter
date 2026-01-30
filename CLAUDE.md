# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord Markdown Formatter is a browser-based React SPA for composing and previewing Discord-compatible Markdown. All processing is client-side with no server communication. Features include live preview, Discord timestamp builder, syntax highlighting, draft management, and template gallery.

## Common Commands

```bash
npm run dev          # Start development server with HMR
npm run build        # TypeScript check + production build
npm run typecheck    # TypeScript type checking only
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all src files
npm run format:check # Prettier check without writing
npm run preview      # Preview production build locally
```

## Architecture

**State Management:** Single Zustand store (`src/store/useAppStore.ts`) manages all application state including editor content, settings, UI modals, and drafts. State persists to localStorage with versioned keys (`:v1` suffix) for migration support.

**Markdown Processing Pipeline:**
1. Editor input → Zustand store → localStorage persistence
2. Preview component receives content via store selector
3. `markdown.ts` renders with custom Discord plugins (underline, spoiler, timestamp)
4. `sanitize.ts` cleans HTML with DOMPurify before rendering

**Custom Markdown Plugins** (in `src/lib/markdown.ts`):
- Underline: `__text__` → `<u>text</u>`
- Spoiler: `||text||` → click-to-reveal span
- Discord Timestamps: `<t:EPOCH:STYLE>` → formatted date/time

**Key Libraries:**
- markdown-it (parser) + Prism.js (syntax highlighting)
- Luxon + @vvo/tzdb (timezone handling)
- DOMPurify (HTML sanitization)
- Tailwind CSS (styling)

## Code Organization

- `src/app/App.tsx` - Root component layout
- `src/components/` - React components (Editor, Preview, Header, modals)
- `src/lib/` - Utilities (markdown, storage, time, sanitize, selection, clipboard)
- `src/store/useAppStore.ts` - Centralized Zustand state management

## TypeScript Configuration

Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`. Unused parameters can use underscore prefix (`_param`) to suppress warnings.

## Code Style

- Prettier: 100 char width, 2 space indent, single quotes, trailing commas (ES5)
- ESLint: TypeScript-aware with React hooks and Prettier integration
- Line endings: LF
