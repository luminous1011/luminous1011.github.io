# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 Token Manager application for XYZW game automation. The application manages game tokens via Base64 decoding, establishes WebSocket connections, and provides a visual interface for token management and game automation.

## Development Commands

### Core Commands
```bash
# Development server (port 3000)
npm run dev

# Production build  
npm run build

# Preview production build
npm run preview

# Lint Vue, JS, TS files with auto-fix
npm run lint

# Format code (Prettier)
npm run format
```

### Installation
```bash
npm install
```

## Architecture Overview

### Core System Design
The application is built around a **token-centric architecture** that replaces traditional user authentication:

1. **Token Management System**: Base64-encoded tokens are imported, decoded, and stored locally
2. **WebSocket Connection Layer**: Automatic WebSocket connections using BON protocol for game communication
3. **Local-First Storage**: All data stored in browser localStorage, no backend dependencies
4. **Protocol Layer**: Custom BON (Binary Object Notation) protocol for game message encoding/decoding

### Key Architectural Components

#### 1. Token Store (`src/stores/tokenStore.js`)
Central state management for token operations:
- **Token Lifecycle**: Import → Parse → Store → Select → Connect
- **Base64 Parsing**: Supports multiple formats (JSON, plain text, prefixed)
- **WebSocket Management**: Automatic connection establishment and status tracking
- **Data Persistence**: localStorage with cross-session state recovery

#### 2. BON Protocol Implementation (`src/utils/bonProtocol.js`)
Custom binary protocol for game communication:
- **Message Encoding/Decoding**: Binary serialization with type safety
- **Game Message Templates**: Predefined message structures for common operations
- **Encryption Layer**: Multi-channel encryption with XOR-based security
- **WebSocket Message Handling**: Structured message parsing and creation

#### 3. WebSocket Client (`src/utils/xyzwWebSocket.js`)
Enhanced WebSocket client based on reference implementation:
- **Command Registry**: Pre-registered game commands with default parameters
- **Queue Management**: Automatic message queuing and batch processing
- **Connection Management**: Auto-reconnection, heartbeat, and status monitoring
- **Promise Support**: Both fire-and-forget and request-response patterns

#### 4. Router Architecture (`src/router/index.js`)
Token-aware navigation system:
- **Access Control**: Route guards based on token availability
- **Smart Redirects**: Automatic routing based on token state
- **Legacy Compatibility**: Redirects from old authentication routes

### Data Flow Architecture

```
Token Import → Base64 Decode → Local Storage → Token Selection → WebSocket Connection → Game Communication
     ↑              ↓              ↓              ↓                    ↓                    ↓
  User Input    JSON/String    Token Store    Router Guards       BON Protocol      Game Messages
```

### State Management Pattern

**Pinia Store Structure**:
- `tokenStore`: Primary token management and WebSocket connections
- `auth`: Simplified authentication state (legacy compatibility)
- `gameRoles`: Role-specific game data management
- `localTokenManager`: Low-level token persistence utilities

## Key Framework Features

### Token Data Structure
```javascript
{
  id: "token_xxx",          // Unique identifier
  name: "主号战士",          // User-defined name
  token: "base64_token",    // Actual token string
  wsUrl: "wss://...",       // WebSocket endpoint
  server: "风云服",         // Game server
  level: 85,                // Character level
  profession: "战士",       // Character class
  createdAt: "2024-...",    // Creation timestamp
  lastUsed: "2024-...",     // Last usage timestamp
  isActive: true            // Activation status
}
```

### WebSocket Connection Flow
1. **Token Selection**: User selects token from management interface
2. **Base64 Parsing**: Extract actual game token from Base64 string
3. **URL Construction**: Build WebSocket URL with token parameter
4. **Client Creation**: Create `XyzwWebSocketClient` instance with game utilities
5. **Connection Establishment**: Automatic connection with heartbeat and queue setup
6. **Message Handling**: Bi-directional communication using command registry

### BON Protocol Message Format
```javascript
{
  cmd: "command_name",      // Command identifier
  body: encodedData,        // BON-encoded message body
  ack: 0,                   // Acknowledgment number
  seq: 12345,               // Sequence number
  time: 1234567890          // Timestamp
}
```

## Project Structure

```
src/
├── components/
│   ├── TokenManager.vue      # Primary token management interface
│   ├── DailyTaskCard.vue     # Game task visualization
│   ├── MessageTester.vue     # Protocol debugging tool
│   └── WebSocketTester.vue   # Connection testing utility
├── stores/
│   ├── tokenStore.js         # Core token management state
│   ├── auth.js               # Legacy authentication compatibility
│   ├── gameRoles.js          # Role-specific game data
│   └── localTokenManager.js # Token persistence utilities
├── utils/
│   ├── bonProtocol.js        # BON protocol implementation
│   ├── gameCommands.js       # Game-specific command helpers
│   └── wsAgent.js            # WebSocket connection management
├── views/
│   ├── TokenImport.vue       # Token import/management page
│   ├── Dashboard.vue         # Main game control interface
│   ├── DailyTasks.vue        # Task management interface
│   └── Profile.vue           # User preferences and settings
└── router/index.js           # Token-aware routing configuration
```

## Development Guidelines

### Working with Tokens
- Always use the `tokenStore` for token operations
- Test Base64 parsing with various input formats
- Verify WebSocket connections after token operations
- Handle token validation errors gracefully

### WebSocket Development
- Use the new `XyzwWebSocketClient` class for WebSocket connections
- Send messages with `client.send(cmd, params)` or `client.sendWithPromise(cmd, params)`
- Monitor connection status via `tokenStore.getWebSocketStatus(tokenId)`
- WebSocket client includes automatic reconnection, queued sending, and heartbeat management
- Built-in command registry supports game-specific message formats

### State Management
- Access token data through computed properties (`selectedToken`, `hasTokens`)
- Use reactive WebSocket status via `getWebSocketStatus(tokenId)`
- Persist critical state changes to localStorage automatically
- Handle cross-session state recovery on application startup

### Protocol Implementation
- Follow BON encoding/decoding patterns for message handling
- Use predefined `GameMessages` templates for common operations
- Implement proper type checking for message validation
- Handle protocol errors with fallback to JSON parsing

## Configuration Notes

### Vite Configuration
- Path aliases configured for clean imports (`@/`, `@components/`, etc.)
- Development server runs on port 3000
- Proxy configured for `/api` routes to `http://xyzw.my`
- SCSS preprocessing with global variables

### Browser Compatibility
- Requires modern browser with WebSocket support
- localStorage required for token persistence
- Base64 decoding and TextEncoder/TextDecoder APIs used

### Security Considerations
- All tokens stored locally in browser storage
- WebSocket connections use WSS encryption
- BON protocol includes basic XOR encryption
- Token display masked (shows only first/last 4 characters)

## Testing and Debugging

### Built-in Testing Tools
- **MessageTester.vue**: Test BON protocol message encoding/decoding
- **WebSocketTester.vue**: Debug WebSocket connections and message flow
- Browser DevTools WebSocket monitoring for connection debugging

### Common Development Tasks
- Test token import with various Base64 formats
- Verify WebSocket connection establishment with new client architecture
- Debug game command sending using command registry
- Test Promise-based message responses
- Validate route guards and navigation flow
- Test localStorage persistence across sessions

### Key API Changes
- `tokenStore.sendMessage(tokenId, cmd, params)` - Send game commands
- `tokenStore.sendMessageWithPromise(tokenId, cmd, params)` - Send with response
- `tokenStore.getWebSocketClient(tokenId)` - Get client instance
- WebSocket client provides `send()`, `sendWithPromise()`, and game-specific methods
- Built-in commands: `getRoleInfo()`, `signIn()`, `claimDailyReward()`, etc.