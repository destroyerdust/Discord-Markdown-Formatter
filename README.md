# Discord Markdown Formatter

A browser-based tool to compose, preview, and format Discord-compatible Markdown. All processing happens client-side with no server communication.

## Features

- **Live Preview** - See your formatted Markdown as you type
- **Discord Timestamp Builder** - Create Discord timestamps with timezone support
- **Syntax Highlighting** - Code blocks with support for JavaScript, TypeScript, Python, JSON, Bash, CSS, and Markdown
- **Draft Management** - Save and load drafts locally
- **Template Gallery** - Pre-built templates for common Discord messages
- **Quick Reference** - Built-in Markdown syntax guide
- **Dark/Light Theme** - Toggle between themes

## Discord-Specific Formatting

Supports Discord's custom Markdown extensions:
- `__text__` - Underline
- `||text||` - Spoiler (click to reveal)
- `<t:EPOCH:STYLE>` - Discord timestamps

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking |

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- markdown-it + Prism.js (Markdown rendering)
- Luxon (date/time handling)
- DOMPurify (HTML sanitization)
