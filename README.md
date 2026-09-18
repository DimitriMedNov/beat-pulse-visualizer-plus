# Beat Pulse

Interactive heart-rhythm visualizer: pick a rhythm and watch the trace, the heartbeat and
the breathing animation respond in real time.

**Live demo:** https://beat-pulse-visualizer.vercel.app/

## What it does

An ECG-style chart drawn continuously, a selector for different rhythms, a short
explanation of each one, and heart and lung animations synced to the selected rate.
Rendering is split into its own components so the chart redraws without re-rendering the
rest of the page.

## Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui

## Run it locally

```bash
npm install
npm run dev
```

## Note

Educational visualization. It is not a medical device and it does not read any real
patient signal.
