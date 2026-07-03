# Annotation Activity Console

Task activity console dashboard built with Next.js (App Router), React, TypeScript, Redux Toolkit, Tailwind CSS, DOMPurify, and localforage.

## Running the App

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Start Mock Server
```bash
cd mock-server
npm install
npm run mock
```
Runs at `http://localhost:4000`.

### 3. Start Next.js Frontend
```bash
npm run dev
```
Open `http://localhost:3000`.

## Testing

To run the Jest + React Testing Library tests:
```bash
npm test
```

## Decisions
Refer to [DECISIONS.md](DECISIONS.md) for details on state, parsing, and bug audits.
