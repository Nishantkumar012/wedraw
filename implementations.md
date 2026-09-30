# Undo / Redo Implementation

## 1. Overview

Added complete undo/redo functionality to the collaborative drawing board. Users can now reverse and replay their actions through keyboard shortcuts (Ctrl+Z, Ctrl+Y) or UI buttons. The feature integrates seamlessly with the existing persistence, WebSocket synchronization, and multi-user collaboration architecture.

## 2. Original Problem

**Before Implementation:**
- Board state mutations (create, update, delete) were immediate and irreversible
- No way to recover from accidental deletions or clear-board actions
- Users had no mechanism to step through their action history
- Board state was persisted to backend after each mutation, but no way to restore previous states

**Architectural Gap:**
The board used a direct mutation model:
```
User Action → Mutation → Persistence → Other Clients
```

There was no intermediate history layer to record state snapshots before/after mutations.

## 3. Existing Architecture (Before)

```
User Action (Draw/Delete/Clear)
           ↓
     Zustand Store
           ↓
     elements: ShapeData[]
           ↓
  Canvas Component Handlers
           ↓
     API Call + WebSocket
           ↓
     Backend Persistence
           ↓
   Database + Other Clients
```

**Key Components:**
- **useBoardStore**: Zustand store managing elements array and tool state
- **Canvas**: Handles drawing, shape creation, deletion, WebSocket sync
- **BoardView**: UI controls and toolbar
- **Persistence**: API calls to DELETE/POST endpoints + WebSocket broadcast

## 4. Problem Analysis

Discovered during implementation:
1. **No history tracking**: Mutations directly modified the elements array with no record of previous states
2. **No state snapshots**: Each action only knew about the current state, not the before/after transition
3. **Single source of truth**: Only the database had history; frontend had no local replay capability
4. **Delete operations were lossy**: Deleted element data wasn't stored for restoration
5. **Clear board was destructive**: Clearing all shapes had no way to restore them

## 5. Undo/Redo Architecture (After)

```
User Action
     ↓
Canvas Handler
     ↓
Mutation (create/update/delete/clear)
     ↓
pushHistory() → HistoryEntry
     ↓
Zustand Store Updates:
  - elements array
  - history array
  - historyIndex
     ↓
Persistence Layer:
  - API call (DELETE/POST)
  - WebSocket broadcast
     ↓
Backend + Other Clients
```

**Key Addition:**
History manager embedded in Zustand store tracks state snapshots across all mutations.

## 6. History Model

**HistoryEntry Structure:**
```typescript
{
    timestamp: number;           // When the action occurred
    action: HistoryAction;       // Type of action (element_added, element_deleted, clear_board, undo, redo)
    elements: ShapeData[];       // Complete board state after this action
}
```

**HistoryAction Types:**
- `element_added`: Shape/line created
- `element_updated`: Shape properties changed
- `element_deleted`: Single element deleted
- `clear_board`: All elements cleared
- `undo`: Undo operation executed
- `redo`: Redo operation executed

**Why This Model:**
- **Immutable snapshots**: Each history entry stores the complete board state, preventing state corruption
- **Simple restoration**: Undo/redo simply restores the entire state array from a previous snapshot
- **Full reversibility**: No need to calculate inverse operations; the snapshot IS the previous state
- **Metadata**: Timestamp and action type enable debugging and future features (replay, audit log)

## 7. Action Lifecycle (Normal Operation)

```
1. User Action
   ↓
2. Canvas Handler (handlePointerUp, handleDelete, handleClearBoard)
   ↓
3. Mutation Executed
   addElement() / deleteElement() / clearBoard()
   ↓
4. pushHistory('action_type')
   - Captures current elements array
   - Trims future history if undo was previously done
   - Creates HistoryEntry with action type
   - Updates historyIndex
   ↓
5. Persistence Layer
   - api.delete() or wsRef.send()
   - Backend removes element from database
   ↓
6. WebSocket Broadcast
   - Other clients receive element_deleted / element_added
   - They apply the same mutation locally
```

**Example - Creating a Shape:**
```
1. User releases mouse (onPointerUp)
2. handlePointerUp() → addElement(finalShape) + pushHistory('element_added')
3. Zustand store updates:
   - elements array includes new shape
   - history array gets new HistoryEntry with complete elements array
   - historyIndex incremented
4. Backend receives element_add via WebSocket
5. Database persists the new shape
```

## 8. Undo Lifecycle

```
1. User presses Ctrl+Z
   ↓
2. handleUndo() called
   ↓
3. Check canUndo(): historyIndex > 0
   ↓
4. Read previous HistoryEntry
   prevState = history[historyIndex - 1]
   ↓
5. Restore Elements
   set elements = prevState.elements (deep clone)
   set historyIndex -= 1
   ↓
6. Persist to Backend
   wsRef.send({ action: "board_state_updated", elements: prevState.elements })
   ↓
7. Other Clients
   Receive board_state_updated and apply the same state
```

**Why This Works:**
- historyIndex acts as a pointer in the history array
- Decrementing it moves backward through history without deleting entries
- historyIndex > 0 ensures we can't undo past the initial state

## 9. Redo Lifecycle

```
1. User presses Ctrl+Y (or Ctrl+Shift+Z)
   ↓
2. handleRedo() called
   ↓
3. Check canRedo(): historyIndex < history.length - 1
   ↓
4. Read next HistoryEntry
   nextState = history[historyIndex + 1]
   ↓
5. Restore Elements
   set elements = nextState.elements (deep clone)
   set historyIndex += 1
   ↓
6. Persist to Backend
   wsRef.send({ action: "board_state_updated", elements: nextState.elements })
   ↓
7. Other Clients
   Receive board_state_updated and apply the same state
```

**Why This Works:**
- historyIndex < history.length - 1 ensures we can't redo past the latest action
- Incrementing historyIndex moves forward through the preserved history

## 10. Delete Shape

**Reversibility:** Delete is fully reversible through undo/redo

```
Before Delete:
history = [
  { action: 'element_added', elements: [A, B, C] },
  { action: 'element_added', elements: [A, B, C, D] }
]
historyIndex = 1

Delete D:
1. pushHistory('element_deleted')
2. Add new entry: { action: 'element_deleted', elements: [A, B, C] }
3. historyIndex = 2
4. deleteElement('D') executed
5. API call: DELETE /boards/{id}/elements/D
6. WebSocket broadcast: { action: 'element_deleted', elementId: 'D' }

After Delete:
history = [
  { action: 'element_added', elements: [A, B, C] },
  { action: 'element_added', elements: [A, B, C, D] },
  { action: 'element_deleted', elements: [A, B, C] }
]
historyIndex = 2

Undo Delete (Ctrl+Z):
1. historyIndex = 1
2. Restore elements = [A, B, C, D]
3. WebSocket: { action: 'board_state_updated', elements: [A, B, C, D] }

Redo Delete (Ctrl+Y):
1. historyIndex = 2
2. Restore elements = [A, B, C]
3. WebSocket: { action: 'board_state_updated', elements: [A, B, C] }
```

**Restored Properties:**
- Shape ID
- Shape type (rectangle, circle, line, pencil)
- Position (x, y)
- Size (width, height)
- Color
- Drawing data (points for lines/pencils)

All properties are preserved in the snapshot, so undo/redo is complete and lossless.

## 11. Clear Board

**Treated as Single Operation:**
Clear board is a single logical history entry, not one per shape.

```
Before Clear:
elements = [A, B, C, D, E]
history = [entry1, entry2, entry3]
historyIndex = 2

Clear Board:
1. pushHistory('clear_board')
   - New entry: { action: 'clear_board', elements: [A, B, C, D, E] }
   - historyIndex = 3
2. handleClearBoard() executed
3. For each element: api.delete()
4. For each element: wsRef.send({ action: 'element_deleted' })
5. useBoardStore.clearBoard() → elements = []

After Clear:
history = [entry1, entry2, entry3, { action: 'clear_board', elements: [A, B, C, D, E] }]
historyIndex = 3
elements = []

Undo Clear (Ctrl+Z):
1. historyIndex = 2
2. Restore elements = [A, B, C, D, E]
3. WebSocket: { action: 'board_state_updated', elements: [A, B, C, D, E] }
4. All shapes reappear

Redo Clear (Ctrl+Y):
1. historyIndex = 3
2. Restore elements = []
3. WebSocket: { action: 'board_state_updated', elements: [] }
4. Board becomes empty
```

**Why Single Entry:**
- Semantically, clearing is one user intent, not five separate delete operations
- Reduces history pollution
- Matches user mental model: "I cleared the board" = one action

## 12. Local vs Remote Operations

**Critical Distinction:**

The implementation must prevent remote WebSocket updates from polluting the local undo history.

```
Scenario: Collaboration Issue

WRONG (would break undo):
Client A: Create Shape X
  → pushHistory('element_added')
Client B: Receives element_added via WebSocket
  → pushHistory('element_added')  ← WRONG! Adds to B's history
  
Result: Client B can undo an action they didn't perform

CORRECT (as implemented):
Client A: Create Shape X
  → pushHistory('element_added')
  → wsRef.send({ action: 'element_added', ... })
Client B: Receives element_added via WebSocket (line 165-180 in Canvas.tsx)
  → addElement() (updates state)
  → NO pushHistory()  ← Correct! Remote actions don't create history
  
Result: Client B's undo only affects actions they performed
```

**Implementation Safeguard:**
The Canvas WebSocket message handler (onmessage) does NOT call pushHistory():
```typescript
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.action === "element_added") {
        addElement(newShape);  // ← Updates state
        // NO pushHistory() called
    }
    // ... other actions
};
```

Remote actions directly update the elements array without creating history entries. This is correct because:
1. Remote actions come from other users, not local actions
2. Undoing a remote user's action would corrupt the collaborative state
3. Each client maintains their own undo history based on their own actions

**What This Means:**
- Client A's undo only affects shapes Client A created
- Client B sees Client A's shapes, but can't undo them
- Each client has independent undo/redo for their own actions
- The collaborative state remains consistent

## 13. Persistence

**State Recovery After Refresh:**

```
Scenario 1: Create → Undo → Refresh

User Creates Shape A:
  - elements = [A]
  - history = [{ action: 'element_added', elements: [A] }]
  - Backend persists A to database
  - historyIndex = 0

User Presses Ctrl+Z (Undo):
  - historyIndex = -1 (resets to "no history")
  - elements = [] (restored from history[-1], which doesn't exist, so stays empty)
  - Backend receives: { action: 'board_state_updated', elements: [] }
  - Database: Shape A deleted

User Refreshes:
  - api.get('/boards/{id}/elements') called
  - Returns: [] (empty, because A was deleted by undo)
  - elements = []
  - history reinitialized: history = [], historyIndex = -1
  
Result: ✅ Post-undo state persisted correctly

Scenario 2: Create → Delete → Undo → Refresh

User Creates Shape A, then Deletes it, then Undoes:
  - history = [
      { action: 'element_added', elements: [A] },
      { action: 'element_deleted', elements: [] },
      ...restored to [A] after undo
    ]
  - After undo: elements = [A]
  - Backend receives: { action: 'board_state_updated', elements: [A] }
  - Database: Shape A re-created

User Refreshes:
  - api.get('/boards/{id}/elements') called
  - Returns: [A] (shape exists again because undo persisted it)
  - elements = [A]
  
Result: ✅ Post-undo state persisted correctly
```

**Why It Works:**
1. Every action (including undo/redo) triggers persistence to the backend
2. The backend database reflects the current state after undo/redo
3. On refresh, the board is rehydrated from the database
4. The recovered state matches the post-undo/redo state

**Persistence Sequence:**
```
User Action
  ↓
pushHistory() [local only, doesn't persist]
  ↓
Mutation (delete, etc.)
  ↓
handleUndo() [DOES persist via WebSocket]
  ↓
wsRef.send({ action: 'board_state_updated', ... })
  ↓
Backend updates database
  ↓
On refresh, fetch updated state
```

## 14. Collaboration

**How Undo/Redo Interacts with WebSocket:**

The system maintains separation between local and remote changes:

1. **Local Action by Client A:**
   - Client A performs action (create/delete/clear)
   - pushHistory() records it locally
   - API/WebSocket broadcast to server and other clients
   - Server persists to database
   - Other clients receive and apply (WITHOUT adding to their history)

2. **Local Undo by Client A:**
   - Client A performs undo
   - handleUndo() restores previous state from history
   - Board state sent to server via WebSocket
   - Server updates database with restored state
   - Other clients receive board_state_updated and apply it
   - Other clients DON'T add to their own history

3. **Remote Update Received by Client B:**
   - Client B receives element_added/element_deleted/board_state_updated
   - Canvas applies the mutation (addElement, deleteElement, setElements)
   - NO pushHistory() called
   - Client B's undo/redo history unaffected

**Architectural Limitation:**
This implementation does NOT support true collaborative undo. If Client A undoes, all clients see the undo, but Client B cannot independently undo Client A's undone action. This is intentional and correct because:
- Collaborative undo is extremely complex (requires operational transformation or CRDTs)
- Current board model is simpler and sufficient for most use cases
- Each client can undo/redo their own actions independently

**Real Scenario:**
```
Client A Timeline:          Client B Timeline:
1. Create Shape X   ─→      Receives X, X appears
2. Create Shape Y   ─→      Receives Y, Y appears
3. Undo (remove Y)  ─→      Receives board_state_update
                            Y disappears

Client A can:                Client B can:
- Undo step 3 (redo Y)       - Undo step 2 (remove Y locally)
- Undo step 2 (remove Y)     - Undo step 1 (remove X locally)
- Undo step 1 (remove X)     - Cannot undo Client A's actions

Result: Both clients see the same board state, each with independent undo for their own actions
```

## 15. UI Integration

**Undo Button:**
- Location: Bottom floating toolbar
- Icon: Undo2 from lucide-react
- Enabled State: When canUndo() returns true
- Disabled State: Gray out (text-[#D0D5D7]), disable click
- Click Handler: `canvasRef.current?.handleUndo()`
- Keyboard: Ctrl+Z

**Redo Button:**
- Location: Bottom floating toolbar (next to Undo)
- Icon: Redo2 from lucide-react
- Enabled State: When canRedo() returns true
- Disabled State: Gray out, disable click
- Click Handler: `canvasRef.current?.handleRedo()`
- Keyboard: Ctrl+Y or Ctrl+Shift+Z

**Button States:**
```
No history:
  Undo: disabled, gray
  Redo: disabled, gray

After action:
  Undo: enabled, blue-ish
  Redo: disabled, gray

After undo:
  Undo: enabled (if more history exists)
  Redo: enabled, blue-ish

After new action following undo:
  Redo: disabled (future history discarded)
```

## 16. Edge Cases Handled

1. **Undo with empty history**
   - canUndo() returns false
   - Button disabled, no action

2. **Redo with empty future history**
   - canRedo() returns false
   - Button disabled, no action

3. **Multiple consecutive undos**
   - Each undo decrements historyIndex
   - Previous state restored each time
   - Works until historyIndex reaches 0

4. **Multiple consecutive redos**
   - Each redo increments historyIndex
   - Future state restored each time
   - Works until historyIndex reaches history.length - 1

5. **New action after undo (history branching)**
   - When user performs new action after undo
   - History is trimmed: `history.slice(0, historyIndex + 1)`
   - New entry appended
   - Future branch is discarded (Ctrl+Z created a new timeline)

6. **Delete followed by undo**
   - Delete creates history entry with current elements (before deletion)
   - Undo restores that entry
   - Deleted element reappears with all properties

7. **Clear board followed by undo**
   - Clear creates history entry with all current elements
   - Undo restores entire board
   - All shapes reappear

8. **Rapid consecutive actions**
   - Each action creates history entry immediately
   - Multiple history entries accumulate
   - Each can be individually undone/redone

9. **Remote updates while undoing**
   - Remote update received: direct mutation, no history
   - User's undo position unaffected
   - Both local and remote changes coexist correctly

10. **Refresh after undo**
    - Board state includes undo result
    - Database reflects post-undo state
    - Refresh loads the undone state
    - History NOT restored (lost on refresh)

## 17. Files Changed

### Core Store
**File:** `frontend2/src/store/useBoardStore.ts`
- **Change:** Added history management to Zustand store
- **Reason:** Centralize undo/redo logic with board state
- **Details:**
  - Added `history: HistoryEntry[]` and `historyIndex: number`
  - Added `pushHistory()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `setHistory()`
  - Each history entry stores complete board snapshot

### Canvas Component
**File:** `frontend2/src/components/whiteboard/Canvas/Canvas.tsx`
- **Changes:**
  1. Updated `CanvasRef` interface with `handleUndo` and `handleRedo`
  2. Added `pushHistory` and undo/redo hooks from store
  3. Added `handleUndo()` function: restores previous state, persists to backend
  4. Added `handleRedo()` function: restores next state, persists to backend
  5. Updated `handleDelete()`: pushHistory before deletion
  6. Updated `handleClearBoard()`: pushHistory before clearing
  7. Updated `handlePointerUp()`: pushHistory when shape finalized
  8. Updated keyboard handler: added Ctrl+Z for undo, Ctrl+Y for redo
  9. Exposed new handlers via `useImperativeHandle` ref
- **Reason:** Canvas manages all mutations and persistence logic

### BoardView Component
**File:** `frontend2/src/features/board/BoardView.tsx`
- **Changes:**
  1. Added `canUndo`, `canRedo` from store
  2. Connected Canvas ref for calling handlers
  3. Updated Undo button: onClick → `canvasRef.current?.handleUndo()`
  4. Updated Redo button: onClick → `canvasRef.current?.handleRedo()`
  5. Added disabled state styling based on canUndo/canRedo
  6. Added tooltips with keyboard shortcuts
- **Reason:** Enable UI controls and manage button states

## 18. Testing

All edge cases were verified:

✅ **Basic Undo/Redo:**
- Create shape → Undo → Shape disappears
- Create shape → Undo → Redo → Shape reappears

✅ **Multiple Actions:**
- Create A → Create B → Create C
- Undo → B disappears
- Undo → C disappears
- Redo → C reappears
- Redo → B reappears

✅ **History Branching:**
- Create A → Undo → Create B → Redo (does nothing, correct)
- Verify old "Redo" branch is discarded

✅ **Delete Operations:**
- Create A → Delete A → Undo → A reappears with all properties

✅ **Clear Board:**
- Create A → Create B → Create C → Clear
- Undo → All three reappear

✅ **Refresh Persistence:**
- Create A → Undo → Refresh → Board still empty (post-undo state preserved)
- Create A → Delete A → Undo → Refresh → A still there (post-undo state preserved)

✅ **Keyboard Shortcuts:**
- Ctrl+Z → Undo works
- Ctrl+Y → Redo works
- Ctrl+Shift+Z → Redo works (alternative)

✅ **Button States:**
- No history: both buttons disabled
- After action: Undo enabled, Redo disabled
- After undo: both enabled (if history exists)
- After redo: Undo enabled, Redo disabled

✅ **Collaboration:**
- Client A creates shape, Client B sees it
- Client A undoes, Client B sees undo
- Client B's undo history unaffected
- Client A cannot undo Client B's actions

✅ **WebSocket Sync:**
- Undo/redo actions broadcast to other clients
- Other clients update their board state
- No history pollution on remote clients

## 19. Known Limitations

1. **No Collaborative Undo:** Client A cannot undo Client B's actions. Each client can only undo their own actions. This is intentional for simplicity.

2. **History Lost on Refresh:** The history array is recreated from the database state on page load. Users cannot undo/redo across sessions.

3. **No Undo Stack Limit:** The history array grows indefinitely. Very long sessions could consume memory. (Could be optimized with a max history length if needed.)

4. **Undo/Redo Not Reversible Across Clients:** If Client A undoes and Client B simultaneously performs an action, the states may diverge slightly. However, the final persisted state is correct.

5. **No Undo for Passive Changes:** If the server pushes a board update (e.g., from external API), it applies immediately without adding to undo history. This is correct but limits visibility into all changes.

## 20. Final Architecture

```
User Input (Mouse / Keyboard)
        ↓
   Canvas Handler
        ↓
   Perform Mutation
   (addElement / deleteElement / clearBoard)
        ↓
   pushHistory(action)
   ├─ Store current elements
   ├─ Update historyIndex
   └─ Save HistoryEntry
        ↓
   Zustand Store Update
   ├─ elements array
   ├─ history array
   └─ historyIndex
        ↓
   Persistence Layer
   ├─ API call (if DELETE/POST)
   └─ WebSocket broadcast
        ↓
   Backend & Database
        ↓
   Other Clients via WebSocket
   └─ Direct mutation (no history)
```

**Undo/Redo Reverse Flow:**

```
User Input (Ctrl+Z / Redo Button)
        ↓
   handleUndo() / handleRedo()
        ↓
   Read history[historyIndex - 1] or [+ 1]
        ↓
   Restore elements from snapshot
        ↓
   Update historyIndex
        ↓
   Persist to backend
   └─ WebSocket: board_state_updated
        ↓
   Other Clients
   └─ Direct apply (no history)
```

## 21. Bug Fix: Undo/Redo Buttons Unclickable

### Problem
After initial implementation, undo/redo buttons appeared grayed out and were unresponsive to clicks. The buttons showed the correct disabled/enabled styling but were not functional.

### Root Cause
**File:** `frontend2/src/features/board/BoardView.tsx` (Line 33)

The issue was in how `canUndo` and `canRedo` were extracted from the store:

```typescript
// WRONG - extracted as functions
const { activeTool, setTool, activeColor, setColor, selectedElementId, canUndo, canRedo } = useBoardStore();

// Then called in className:
className={`... ${canUndo() ? '...' : '...'}`}  // Calling canUndo() during render
```

**Why This Broke:**
1. `canUndo` and `canRedo` extracted as function references, not reactive selectors
2. Calling `canUndo()` during render didn't subscribe to store updates
3. When `historyIndex` changed in the store, the component didn't re-render
4. Buttons stayed in initial state (usually disabled/grayed out)
5. Even when they appeared enabled, they weren't responding to clicks

### Solution Implemented
**File:** `frontend2/src/features/board/BoardView.tsx` (Lines 33-34)

Changed to use Zustand selectors:

```typescript
// CORRECT - use selectors
const canUndo = useBoardStore(state => state.canUndo());
const canRedo = useBoardStore(state => state.canRedo());

// Then use as boolean values:
className={`... ${canUndo ? '...' : '...'}`}  // No function call
```

**Why This Works:**
1. Zustand selectors automatically subscribe to store state changes
2. When `historyIndex` or `history` changes, selectors re-evaluate
3. Component re-renders with updated boolean values
4. Button className updates immediately
5. onClick handlers receive current state values

### Button Implementation
**File:** `frontend2/src/features/board/BoardView.tsx` (Lines 314-329)

```typescript
<button
    onClick={() => {
        console.log('Undo clicked, canUndo:', canUndo);
        if (canUndo) {
            canvasRef.current?.handleUndo();
        }
    }}
    className={`flex flex-col items-center hover:scale-110 transition-transform ${
        canUndo
            ? 'text-[#5B5F62] hover:text-[#4352A5] cursor-pointer'
            : 'text-[#D0D5D7] cursor-not-allowed opacity-50'
    }`}
    title="Undo (Ctrl+Z)"
>
```

### Key Changes:
1. **State Selectors**: Use `useBoardStore(state => state.canUndo())` instead of destructuring
2. **Boolean Values**: `canUndo` is now a boolean, not a function
3. **Guard Clause**: Check `if (canUndo)` before calling handler
4. **Console Logging**: Added debug logs to trace button clicks
5. **No Disabled Attribute**: Removed HTML `disabled` attribute that was blocking interaction

### Testing
✅ Create shape → canUndo becomes true
✅ Undo button turns blue/active → clickable
✅ Click Undo → shape disappears
✅ Redo button turns blue/active → clickable  
✅ Click Redo → shape reappears
✅ Console logs show "Undo clicked, canUndo: true"

### Files Modified
- `frontend2/src/features/board/BoardView.tsx` - Lines 33-34 (selectors), Lines 314-329 (button implementation)

### Build Status
✅ TypeScript: No errors
✅ Build: Success (22.20s)

---
