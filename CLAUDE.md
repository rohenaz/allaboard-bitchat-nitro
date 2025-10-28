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
bun run lint              # Check for issues
bun run lint:fix          # Auto-fix issues
bun run lint:unsafe       # Apply unsafe fixes
bun run format            # Check formatting
bun run format:fix        # Auto-format code

# Testing
bun test                  # Run all Playwright tests
bun run test:ui           # Run tests with UI
bun run test:debug        # Run tests in debug mode
bun run test:report       # Show test report
bun run test:visual       # Run visual regression tests
bun run test:visual:update # Update visual snapshots

# Build validation
bun run validate          # Full build validation
bun run validate:quick    # Quick validation
bun run validate:visual   # Visual validation
```

## Development Workflow

### Package Manager
**CRITICAL**: Always use `bun` instead of `npm` or `yarn` for all commands.

### Last Known Good State
Reference commit: `f765eefcf95e090b13fa36cce2f5c36ea2c7bba7`

When debugging issues, compare against this commit:
```bash
# View file from last known good state
git show f765eefcf95e090b13fa36cce2f5c36ea2c7bba7:path/to/file

# List changed files
git diff --name-only f765eefcf95e090b13fa36cce2f5c36ea2c7bba7

# View specific changes
git diff f765eefcf95e090b13fa36cce2f5c36ea2c7bba7 path/to/file
```

### Before Pushing
Always run a local build before pushing to ensure nothing is broken.

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
- Base URL configured via `VITE_BMAP_API_URL` environment variable
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
```bash
VITE_BMAP_API_URL=http://localhost:3055
VITE_HANDCASH_APP_ID=<your-app-id>
VITE_HANDCASH_API_URL=https://api.bitchatnitro.com
VITE_SIGMA_CLIENT_ID=bitchat-nitro
VITE_SIGMA_AUTH_URL=https://auth.sigmaidentity.com
BITCHAT_MEMBER_WIF=<your-member-wif>
```

**Note on OAuth Authentication:**
- Sigma Auth uses Bitcoin signature-based authentication (no client_secret needed)
- `BITCHAT_MEMBER_WIF` is the private key used to sign OAuth token requests
- Token requests are signed with the member key and verified via `X-Auth-Token` header

**Note**: HandCash OAuth returns with URL format: `https://bitchatnitro.com/?authToken=<token>`
The app extracts the token from the URL and uses it to login.

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
- **Test Framework**: Playwright for E2E and visual regression testing
- **Test Organization**:
  - `tests/e2e/` - End-to-end tests (OAuth flow, session management, homepage, styling)
  - `tests/visual/` - Visual regression tests with snapshot comparison
  - `tests/visual/components/` - Component-specific visual tests
- **Biome Configuration** (`biome.json`):
  - Formatting: 2 spaces, single quotes, trailing commas, semicolons always
  - Line width: 80 characters
  - Linting: ESLint-like rules with TypeScript support
  - Import organization enabled
  - A11y warnings for accessibility

### Deployment
- Dockerfile available for containerization
- Caddy server configuration for production
- Railway deployment configuration included

## BigBlocks Integration (v0.0.21)

### Overview
BigBlocks is integrated as an enhancement to BitChat's authentication system, providing 96 production-ready Bitcoin UI components while preserving BitChat's existing Discord-like interface.

### Integration Strategy
- **Hybrid Approach**: BigBlocks backend with BitChat UI preserved
- **Gradual Migration**: Can switch features incrementally without breaking existing flows
- **Enhanced Features**: Backup import, advanced signup flows, social components available

### Components Available (v0.0.21 - 96 total)
- **Authentication**: AuthButton, LoginForm, SignupFlow, AuthFlowOrchestrator
- **Social**: PostButton, LikeButton, FollowButton, SocialFeed
- **Wallet**: WalletOverview, SendBSVButton, TokenBalance, HandCashConnector, YoursWalletConnector
- **Profile**: ProfileCard, ProfileEditor, BitcoinAvatar, ProfilePopover
- **Market**: MarketTable, CreateListingButton, BuyListingButton
- **BAP Identity**: Encryption, signing, key rotation components
- **Icons**: HandCashIcon, YoursWalletIcon (added in v0.0.19)
- **Renamed Components**: Now supports both `Bitcoin*` and `BigBlocks*` prefixes for backwards compatibility

### Current Integration
- **Test Component**: `src/components/test/BitcoinBlocksTest.tsx`
  - Basic integration demo (BigBlocks backend + BitChat UI)
  - Advanced features demo (full BigBlocks components)
- **Custom Hook**: `src/hooks/useBitchatAuth.ts`
  - Bridges BigBlocks auth with BitChat Redux state
  - Preserves existing wallet integrations
  - Adds backup import and enhanced signup capabilities

### Dependencies Added
- `bigblocks@0.0.21` - Main component library (latest version)
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

## Better-Auth Integration with Sigma Identity

### Overview
BitChat uses better-auth framework with the genericOAuth plugin to authenticate users via Sigma Identity (external auth server). This replaces the custom OAuth implementation with a standardized approach.

### Architecture
- **External Auth Server**: https://auth.sigmaidentity.com handles all authentication
- **Client Plugin**: Uses better-auth's genericOAuthClient for OAuth 2.0 flow
- **Minimal Client Code**: Auth server handles everything, client just redirects

### Key Files
- `src/lib/auth.ts` - Better-auth client configuration
  - Points to external Sigma auth server (not local API)
  - Uses `oauth2` method for generic OAuth providers
  - Maintains compatibility with existing sigmaAuth function signatures

### Authentication Flow
1. User clicks "Sign in with Bitcoin" 
2. Client redirects to Sigma auth server OAuth endpoint
3. User authenticates with Bitcoin wallet on auth server
4. Auth server redirects back with authorization code
5. Better-auth client automatically exchanges code for session
6. Session stored and user authenticated

### Configuration
Required environment variables:
- `VITE_SIGMA_AUTH_URL` - URL of the Sigma auth server
- `VITE_SIGMA_CLIENT_ID` - OAuth client ID registered with Sigma
- `BITCHAT_MEMBER_WIF` - Member private key for signing token requests (Bitcoin signature-based auth)
- No backend auth routes needed - auth server handles everything

## Code Style & Patterns

### Import Rules
- Use `type` imports when only using as a type: `import type { FC } from 'react'`
- Never import entire React namespace: avoid `import * as React from 'react'`
- Don't import React just for types - import specific types like `FC` directly
- Use for loops instead of `forEach`

### Data Fetching
- **Outside components**: Use regular `fetch` (never axios)
- **Inside components**: Use TanStack Query
- Centralized fetch utility available at `src/api/fetch.ts`

### Bitcoin Libraries
- Use `@bsv/sdk` instead of older `bsv` package
- Use `bsv-bap` for BAP (Bitcoin Attestation Protocol) functionality

### Environment Variables
**CRITICAL**: Never trim environment variables. If a variable is wrong, fail immediately rather than falling back to other names or hardcoded values.

### Commit Messages
Do not include AI-generated tags in commit messages.