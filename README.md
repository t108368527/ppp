# PowerX Mock POC

This is a standalone mock POC for the Pair-to-Deploy flow.

It does not call the main PowerX frontend, backend, real hardware, Ray, vLLM, or network APIs. All cluster nodes, model options, benchmark scores, sharding, validation, and deploy states are deterministic mock data in `src/App.tsx`.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5174
```

## Validate

```bash
npm run build
npm run lint
```

## Scope

- Pair state and dashboard landing
- Cluster battle power index
- Deployable model list based on selected mock devices
- Device selection for the current deployment run
- Model selection
- Automatic layer sharding
- Manual layer adjustment with overload guardrails
- Mock deployment state and endpoint display
