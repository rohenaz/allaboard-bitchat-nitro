# Instructions for creating a product requirements document (PRD)

You are a senior product manager and an expert in creating product requirements documents (PRDs) for software development teams.

Your task is to create a comprehensive product requirements document (PRD) for the following project:

<prd_instructions>

Focus on implementing wallet connection functionality in BitChat Nitro to enable message posting. The system requires both identity/authentication (can use wallet identity key or Bitcoin sign-in with BAP profiles) and wallet connectivity for transaction payments. Sigma-auth handles all wallet connection complexity, BitChat handles posting flow through modal/drawer UI showing transparent signing and payment process.

</prd_instructions>

# PRD: BitChat Nitro Wallet Integration

## 1. Product overview
### 1.1 Document title and version
- PRD: BitChat Nitro Wallet Integration
- Version: v2.0.0

### 1.2 Product summary
BitChat Nitro is an on-chain chat system similar in style to Discord but with all data stored on-chain. The system is working toward supporting encrypted DMs but needs to perfect core functionality first, specifically wallet integration to enable message posting.

This project is part of a broader open protocol ecosystem where different providers can build compatible clients displayed as 'Discord Servers' in the interface. The underlying overlay network is made up of the same data, allowing multiple user interfaces to experience the same decentralized conversations.

The current focus is implementing seamless wallet integration that enables users to post messages while maintaining the transparent, on-chain nature of the platform through Bitcoin's Author Identity Protocol (AIP).

## 2. Goals
### 2.1 Business goals
- Build an on-chain ecosystem that creates demand for additional services including data indexing, propagation, access sales, curation, and protocol development
- Create demonstration apps with documentation to enable others to build compatible clients
- Establish an open protocol where multiple providers can create different user interfaces to experience the same underlying data through an overlay network

### 2.2 User goals
- Enable users to post messages in any channel once wallet is connected
- Allow users without connected identity to display profile information from their wallet
- Sign all messages with AIP (Author Identity Protocol) and broadcast signed transactions while notifying indexer for propagation to other clients

### 2.3 Non-goals
- Not trying to achieve feature parity with Discord or add complex features beyond the current structure
- Focus on basic chat in multiple channels with simple identity association
- Avoid implementing roles or complex moderation systems in this phase

## 3. User personas
### 3.1 Key user types
- Chat users with BAP profiles
- Chat users without BAP profiles
- Wallet-connected users
- Users without wallet connection

### 3.2 Basic persona details
- **BAP Profile Users**: Users with verified on-chain identities who display with subtle lock icons on messages and user card popovers
- **Wallet-Only Users**: Users who connect wallet for posting but use wallet-derived profile information for display
- **Guests**: Users who can read messages but cannot post without wallet connection

### 3.3 Role-based access
- **BAP Profile Users**: Can post messages with verified identity indicators
- **Wallet-Only Users**: Can post messages with wallet-derived profile information
- **Guests**: Can read messages but cannot post without wallet connection

## 4. Functional requirements
- **Sigma-Auth Integration** (Priority: Critical)
  - HTTP-based signing using identity key from sessionStorage
  - Payment routing through connected wallet
- **Modal/Drawer UI** (Priority: High)
  - Shadcn UI drawer to display signing and payment process transparently
  - User setting to hide drawer for experienced users
- **Message Posting Flow** (Priority: High)
  - Seamless posting with transparent process display
  - No page redirects
- **Identity Management** (Priority: High)
  - Display BAP profile when available with wallet profile as fallback
  - Maintain unified authentication session

## 5. User experience
### 5.1. Entry points & first-time user flow
- Users sign in via sigma-auth (may or may not have wallet connected initially)
- First-time posters discover wallet requirement when attempting to send first message

### 5.2. Core experience
- **User types message and clicks send**: User enters message in chat input and attempts to post
  - The interface should be familiar and responsive like traditional chat applications
- **Shadcn drawer appears showing signing and payment process**: Transparent process display opens smoothly
  - The drawer provides clear feedback about what's happening without being intrusive
- **Signing happens via HTTP request with identity key**: Background signing process using stored identity
  - This step should be fast and seamless for the user
- **Payment processed through connected wallet**: Wallet interaction for transaction fees
  - Different wallet types handled appropriately (iframe for browser wallets, API for others)
- **Message appears in chat**: Successful posting with immediate feedback
  - The message should appear quickly with proper attribution and any BAP indicators

### 5.3. Advanced features & edge cases
- User setting to hide process drawer for experienced users
- Graceful handling of different wallet types (browser vs API-based)
- Fallback UI for wallet connection issues

### 5.4. UI/UX highlights
- Transparent process display through drawer
- No page redirects
- Seamless posting experience
- User control over process visibility

## 6. Narrative
A crypto enthusiast discovers BitChat Nitro and signs in with their Bitcoin identity. When they try to post their first message, a sleek drawer appears showing the signing and payment process happening seamlessly. Their message appears in the chat, and they realize they're now part of a decentralized conversation network where their identity and messages are secured on-chain.

## 7. Success metrics
### 7.1. User-centric metrics
- Message posting success rate
- Time to first successful post
- User retention after first post
- User satisfaction with posting process

### 7.2. Business metrics
- Transaction volume
- User conversion from lurker to poster
- Ecosystem growth through compatible client adoption

### 7.3. Technical metrics
- API response times for signing requests
- Error rates in signing/payment flow
- Transaction broadcast success rate

## 8. Technical considerations
### 8.1. Integration points
- Sigma-auth service (auth.sigmaidentity.com) for signing and wallet management
- BSocial API (api.sigmaidentity.com) for message data and signer information
- Various wallet APIs for payment processing
- Bitcoin Schema (bitcoinschema.org) for on-chain data structure reference

### 8.2. Data storage & privacy
- Identity keys stored in sessionStorage
- Profile data cached from sigma-auth
- No sensitive wallet data stored locally
- All signing operations delegated to sigma-auth

### 8.3. Scalability & performance
- HTTP-based signing for performance
- Iframe optimization for wallet interactions
- Efficient API calls to BSocial API
- Minimal data caching for responsiveness

### 8.4. Potential challenges
- Different wallet types requiring different integration approaches
- Cross-origin iframe issues
- Network latency for signing requests
- Transaction broadcast reliability
- Maintaining session state across wallet interactions

## 9. Milestones & sequencing
### 9.1. Project estimate
- Small: 1 week (7 days)

### 9.2. Team size & composition
- Small Team: 2 people
  - Product manager/developer, 1 AI assistant

### 9.3. Suggested phases
- **Phase 1**: Sigma-auth integration and HTTP signing (2-3 days)
  - Key deliverables: Working API integration, identity key handling, basic signing flow
- **Phase 2**: Drawer UI and payment processing (2-3 days)
  - Key deliverables: Shadcn drawer implementation, wallet payment integration, iframe handling
- **Phase 3**: Polish and user settings (1-2 days)
  - Key deliverables: User settings for drawer visibility, error handling, performance optimization

## 10. User stories
### 10.1. Sign in with Bitcoin identity
- **ID**: US-001
- **Description**: As a user, I want to sign in with my Bitcoin identity so that I can access BitChat Nitro with my on-chain identity
- **Acceptance criteria**:
  - User can sign in via sigma-auth with Bitcoin identity
  - Identity session is maintained independently of wallet connection
  - BAP profile information is displayed when available
  - Wallet-derived profile information is used as fallback

### 10.2. Attempt to post first message
- **ID**: US-002
- **Description**: As a signed-in user, I want to try posting my first message so that I can participate in chat discussions
- **Acceptance criteria**:
  - User can type message in chat input field
  - Send button is available and clickable
  - System detects wallet connection status when send is attempted
  - Clear feedback is provided about wallet requirement

### 10.3. View transparent signing process
- **ID**: US-003
- **Description**: As a user posting a message, I want to see the signing and payment process so that I understand what's happening with my transaction
- **Acceptance criteria**:
  - Shadcn UI drawer opens when message posting begins
  - Drawer displays current step in the process (signing, payment, broadcast)
  - Progress indicators show process status
  - Drawer closes automatically when process completes

### 10.4. Sign message with identity key
- **ID**: US-004
- **Description**: As a user, I want my messages to be signed with my identity key so that they are authenticated via AIP
- **Acceptance criteria**:
  - HTTP request sent to sigma-auth with identity key from sessionStorage
  - Message data is signed using AIP protocol
  - Signature is returned from sigma-auth service
  - Signing process happens without page redirects

### 10.5. Process payment through wallet
- **ID**: US-005
- **Description**: As a user, I want to pay for message transactions through my connected wallet so that my messages can be broadcast on-chain
- **Acceptance criteria**:
  - System detects wallet type (browser vs API-based)
  - Browser wallets are handled via iframe when necessary
  - API-based wallets are handled via direct API calls
  - Payment process is transparent to the user

### 10.6. See posted message in chat
- **ID**: US-006
- **Description**: As a user, I want to see my message appear in the chat after successful posting so that I know it was published on-chain
- **Acceptance criteria**:
  - Message appears in chat feed after successful broadcast
  - Message displays with proper attribution (username or address)
  - BAP profile users show subtle lock icon on messages
  - Message timestamp and identity information are correct

### 10.7. Handle wallet connection errors
- **ID**: US-007
- **Description**: As a user, I want to receive clear feedback when wallet connection fails so that I can resolve the issue
- **Acceptance criteria**:
  - Clear error messages when wallet connection fails
  - Graceful fallback UI for connection issues
  - Option to retry wallet connection
  - No data loss when connection issues occur

### 10.8. Hide process drawer for experienced users
- **ID**: US-008
- **Description**: As an experienced user, I want to hide the signing process drawer so that I can post messages more quickly
- **Acceptance criteria**:
  - User setting available to hide process drawer
  - Setting persists across sessions
  - Minimal feedback still provided when drawer is hidden
  - Option to re-enable drawer display

### 10.9. Disconnect wallet separately from sign out
- **ID**: US-009
- **Description**: As a user, I want to disconnect my wallet without signing out of my identity so that I can manage wallet and identity independently
- **Acceptance criteria**:
  - Wallet disconnect function is separate from identity sign out
  - Confirmation alert appears before disconnecting wallet
  - User remains signed in with identity after wallet disconnect
  - Clear indication of wallet connection status

### 10.10. Handle different wallet types
- **ID**: US-010
- **Description**: As a user with any type of Bitcoin wallet, I want to connect and pay for transactions so that I can post messages regardless of my wallet choice
- **Acceptance criteria**:
  - Support for browser-based wallets via iframe
  - Support for API-based wallets via direct integration
  - Automatic detection of wallet type
  - Consistent user experience across wallet types

### 10.11. Maintain session across wallet interactions
- **ID**: US-011
- **Description**: As a user, I want my session to remain stable during wallet interactions so that I don't lose my place in conversations
- **Acceptance criteria**:
  - Session state maintained during wallet iframe interactions
  - No loss of chat history or position
  - Identity session independent of wallet operations
  - Seamless return to chat after wallet interactions

### 10.12. View wallet connection status
- **ID**: US-012
- **Description**: As a user, I want to see my wallet connection status so that I know whether I can post messages
- **Acceptance criteria**:
  - Clear indication of wallet connection status in UI
  - Tooltip or status indicator shows current state
  - Easy access to wallet connection controls
  - Status updates in real-time when wallet state changes