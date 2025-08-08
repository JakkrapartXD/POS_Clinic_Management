# Function Extraction Best Practices

## Issue Resolved: Fake Event Objects Anti-Pattern

### Problem
The `handleRetry` function was creating a fake event object to call `handleLogin`, which is an anti-pattern that can lead to unexpected behavior:

```typescript
// ❌ Bad: Creating fake event objects
const handleRetry = () => {
  setLoginError(null)
  handleLogin({ preventDefault: () => {} } as React.FormEvent)
}
```

### Solution: Extract Core Logic
Extract the core business logic into a separate function that doesn't depend on event objects:

```typescript
// ✅ Good: Separate concerns
// Extract login logic into a separate function
const performLogin = async () => {
  // Clear previous errors
  setLoginError(null)
  setValidationErrors({})
  
  // Validate form
  if (!validateForm()) {
    return
  }
  
  setIsLoading(true)
  // ... rest of login logic
}

// Form submit handler
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  await performLogin()
}

// Retry handler - no fake event object needed
const handleRetry = () => {
  setLoginError(null)
  performLogin()
}
```

## Best Practices for Function Design

### 1. Separate Event Handling from Business Logic

**Pattern**: Extract business logic into pure functions that don't depend on DOM events.

```typescript
// ❌ Avoid: Business logic mixed with event handling
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Complex business logic here...
}

// ✅ Better: Separate concerns
const performSubmit = async () => {
  // Complex business logic here...
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  await performSubmit()
}
```

### 2. Make Functions Reusable

**Pattern**: Functions should be callable from multiple contexts without artificial parameters.

```typescript
// ❌ Avoid: Functions that only work with specific event types
const processData = (e: React.FormEvent) => {
  e.preventDefault()
  // processing logic
}

// ✅ Better: Pure business logic functions
const processData = () => {
  // processing logic
}

const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  processData()
}

const handleButtonClick = () => {
  processData() // Can be called from anywhere
}
```

### 3. Avoid Fake Parameters

**Pattern**: Never create fake objects to satisfy function signatures.

```typescript
// ❌ Never do this:
someFunction({ fake: 'parameter' } as RealType)
someEventHandler({ preventDefault: () => {} } as React.FormEvent)

// ✅ Instead: Refactor the function or make parameters optional
const someFunction = (param?: RealType) => {
  // Handle both cases
}
```

### 4. Use Optional Parameters When Appropriate

**Pattern**: Make event parameters optional when the function might be called without them.

```typescript
// ✅ Good: Optional event parameter
const handleAction = (e?: React.FormEvent) => {
  e?.preventDefault()
  // Core logic that works with or without event
}

// Can be called both ways:
<form onSubmit={handleAction}>
<button onClick={() => handleAction()}>
```

## Common Refactoring Patterns

### Pattern 1: Form Submission + Retry
```typescript
// Extract core logic
const performAction = async () => { /* business logic */ }

// Event handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  await performAction()
}

// Retry handler
const handleRetry = () => {
  performAction()
}
```

### Pattern 2: Loading States + Multiple Triggers
```typescript
// Core function with loading state
const executeOperation = async () => {
  setLoading(true)
  try {
    // business logic
  } finally {
    setLoading(false)
  }
}

// Multiple ways to trigger
const handleClick = () => executeOperation()
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') executeOperation()
}
```

### Pattern 3: Validation + Submission
```typescript
// Separate validation and execution
const validateAndExecute = async () => {
  if (!isValid()) return
  await execute()
}

// Form handler
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  validateAndExecute()
}

// Direct call
const handleButtonClick = () => {
  validateAndExecute()
}
```

## Benefits of This Approach

1. **Testability**: Pure business logic functions are easier to unit test
2. **Reusability**: Functions can be called from multiple contexts
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: No need for type assertions or fake objects
5. **Debugging**: Easier to trace execution flow

## Files Updated

- **`frontend/src/app/login/page.tsx`**: Extracted login logic into `performLogin()` function

## Verification

✅ No fake event objects in codebase
✅ Clean separation between event handling and business logic  
✅ Functions are reusable and testable
✅ No type safety issues or assertions needed
