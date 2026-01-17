# Focus Group Platform

A real-time focus group platform with Frank Luntz-style perception tracking.

## Features

- 🎥 **10-participant video conferencing** via LiveKit
- 📊 **Real-time perception tracking** with horizontal slider + emoji buttons
- 📈 **Live visualization** of aggregate participant sentiment
- 🎬 **Session recording** capabilities
- 📱 **Mobile-responsive** design

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your credentials
4. Run development server: `npm run dev`

## Environment Variables

```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

## Tech Stack

- Next.js 14 (App Router)
- LiveKit (WebRTC video)
- Socket.io (real-time data)
- D3.js (visualization)
