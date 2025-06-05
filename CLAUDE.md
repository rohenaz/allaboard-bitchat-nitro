# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Bitchat Nitro is a real-time chat application built on Bitcoin SV blockchain. It's an alternative interface to the original Bitchat, providing a modern Discord-like experience with Bitcoin-based authentication and messaging.

## Development Commands

```bash
# Install dependencies
bun install

# Development server (hot reload)
bun dev

# Production build
bun run build

# Preview production build
bun run preview

# Run with Caddy server
bun start

# Code quality
bun run lint         # Check for issues
bun run lint:fix     # Auto-fix issues
bun run format       # Check formatting
bun run format:fix   # Auto-format code
```

## Architecture Overview

### State Management
The app uses Redux Toolkit with multiple slices organized by feature:
- `sessionReducer` - User authentication and wallet state
- `channelsReducer` - Channel list and metadata
- `chatReducer` - Messages and reactions
- `memberListReducer` - Users, friends, and friend requests
- `serverReducer` - Server list management
- UI state: `sidebarReducer`, `settingsReducer`, `profileReducer`

### Real-time Communication
- Uses Server-Sent Events (EventSource) instead of WebSockets
- Middleware at `src/middleware/socketMiddleware.jsx` handles incoming events
- Event types: `message`, `like`, `friend`, `pin_channel`
- Audio notifications play for new messages

### Bitcoin Integration
The app wraps multiple Bitcoin providers in `src/main.tsx`:
```
<YoursProvider>
  <HandcashProvider>
    <BmapProvider>
      <BapProvider>
        <BitcoinProvider>
```

Key integrations:
- **Yours Wallet** - Primary wallet provider
- **HandCash** - Alternative wallet
- **BAP** (Bitcoin Attestation Protocol) - Identity management
- **BMAP** - Bitcoin data indexing

### API Communication
- Centralized fetch utility: `src/api/fetch.ts`
- Base URL configured via `VITE_API_URL` environment variable
- Authentication via `X-Auth-Token` header
- Endpoints organized by feature: `/api/user.ts`, `/api/channel.ts`

### Component Structure
- `/components/authForm/` - Login/signup flows
- `/components/dashboard/` - Main app UI components
- `/components/common/` - Shared UI components
- `/components/settings/` - Settings interface
- Styled using both styled-components and TailwindCSS v4

### Build Configuration
- **Vite** as build tool with React plugin
- **TypeScript** with strict mode
- **Biome** for linting/formatting (replaces ESLint/Prettier)
- Node polyfills for crypto operations
- TailwindCSS v4 with Vite plugin

### Environment Variables
Required in `.env`:
```
VITE_API_URL=http://localhost:3055
VITE_HANDCASH_APP_ID=<your-app-id>
VITE_HANDCASH_API_URL=https://api.bitchatnitro.com
```

### Key Patterns

1. **Authentication Flow**
   - Users authenticate via Bitcoin wallets (Yours/HandCash)
   - Session stored in Redux and localStorage
   - Auto-reconnect on page refresh

2. **Message Handling**
   - Messages stored on Bitcoin blockchain
   - Local Redux store for UI state
   - Real-time updates via EventSource

3. **File Handling**
   - File uploads supported in messages
   - Markdown rendering for message content
   - Emoji picker integration

4. **Theme Support**
   - Theme context provider
   - Theme switcher component
   - Persisted theme preference

### Testing & Quality
- Biome configuration in `biome.json`
- Formatting: 2 spaces, single quotes, trailing commas
- Linting: ESLint-like rules with TypeScript support
- No dedicated test framework configured yet

### Deployment
- Dockerfile available for containerization
- Caddy server configuration for production
- Railway deployment configuration included

## BigBlocks Integration (v0.0.12)

### Overview
BigBlocks is integrated as an enhancement to BitChat's authentication system, providing 96 production-ready Bitcoin UI components while preserving BitChat's existing Discord-like interface.

### Integration Strategy
- **Hybrid Approach**: BigBlocks backend with BitChat UI preserved
- **Gradual Migration**: Can switch features incrementally without breaking existing flows
- **Enhanced Features**: Backup import, advanced signup flows, social components available

### Components Available
- **Authentication**: AuthButton, LoginForm, SignupFlow, AuthFlowOrchestrator
- **Social**: PostButton, LikeButton, FollowButton, SocialFeed
- **Wallet**: WalletOverview, SendBSVButton, TokenBalance
- **Profile**: ProfileCard, ProfileEditor, BitcoinAvatar
- **Market**: MarketTable, CreateListingButton, BuyListingButton
- **BAP Identity**: Encryption, signing, key rotation components

### Current Integration
- **Test Component**: `src/components/test/BitcoinBlocksTest.tsx`
  - Basic integration demo (BigBlocks backend + BitChat UI)
  - Advanced features demo (full BigBlocks components)
- **Custom Hook**: `src/hooks/useBitchatAuth.ts`
  - Bridges BigBlocks auth with BitChat Redux state
  - Preserves existing wallet integrations
  - Adds backup import and enhanced signup capabilities

### Dependencies Added
- `bigblocks@0.0.12` - Main component library
- `js-1sat-ord@0.1.82` - Ordinals support
- `@tanstack/react-query@5.79.0` - Data fetching
- `lucide-react@0.511.0` - Icons

### Configuration
- Vite config updated to externalize Next.js modules
- BigBlocks config file: `bigblocks.config.json`
- Integration preserves all existing styling and theming

### Next Steps
- Backend API integration for BigBlocks auth endpoints
- Gradual replacement of auth flows with enhanced versions
- Optional integration of social and wallet components