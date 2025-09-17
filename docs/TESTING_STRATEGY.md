# Testing Strategy: No-Mock Approach

## Philosophy

This project follows a **no-mock testing stance** that prioritizes real data validation over fabricated test objects. Instead of creating mock data that may not reflect real-world scenarios, we rely on:

1. **Compile-time type safety** with TypeScript
2. **Runtime validation** with Zod schemas
3. **Real database testing** when needed (with cleanup)

## Current Approach

### 1. TypeScript Compile-Time Safety

- **Strict TypeScript**: `strict: true` in tsconfig.json
- **Satisfies Operator**: Used throughout for object construction validation
- **Discriminated Unions**: Type-safe pattern matching
- **No `any` Types**: Explicit typing everywhere

```typescript
// Example: Type-safe object construction
const suggestion = {
  kind: "present",
  key: "vintage",
  current: wine.vintage ?? null,
  suggestion: 2018,
  confidence: 0.82,
  source: "openai"
} satisfies AIFieldSuggestion // Compile-time validation
```

### 2. Runtime Validation with Zod

- **API Boundary Validation**: All data entering/leaving the app is validated
- **Schema-First**: Zod schemas define the contract
- **Error Handling**: Graceful validation failures with meaningful errors
- **Type Inference**: TypeScript types generated from Zod schemas

```typescript
// Example: Runtime validation at API boundaries
export async function listWines(): Promise<Wine[]> {
  const { data, error } = await supabase.from('wines').select('*')
  
  if (error) throw new Error(`Failed to fetch wines: ${error.message}`)
  
  // Validate API response at runtime
  return safeParseWineArray(data) // Throws if invalid
}
```

### 3. Real Database Testing (When Needed)

If/when tests are added, they should:

- **Use Real Supabase**: Hit the actual dev database
- **Create Test Data**: Insert real test records
- **Clean Up**: Remove test data after each test
- **Isolate Tests**: Use unique identifiers to avoid conflicts

```typescript
// Example: Real database test (future)
describe('Wine API', () => {
  beforeEach(async () => {
    // Create test wine
    const testWine = await createTestWine({
      producer: 'Test Winery',
      vintage: 2020,
      status: 'cellared'
    })
  })
  
  afterEach(async () => {
    // Clean up test data
    await deleteTestWine(testWine.id)
  })
  
  it('should fetch wines', async () => {
    const wines = await listWines()
    expect(wines).toContainEqual(expect.objectContaining({
      producer: 'Test Winery'
    }))
  })
})
```

## Benefits

### 1. **Real-World Accuracy**
- Tests use actual data structures
- No drift between mocks and reality
- Catches real integration issues

### 2. **Simplified Maintenance**
- No mock data to maintain
- No mock/stub setup complexity
- Focus on real functionality

### 3. **Better Error Detection**
- Runtime validation catches data issues
- TypeScript catches structural issues
- Real database catches integration issues

### 4. **Performance**
- No mock setup overhead
- Faster test execution
- Real performance characteristics

## Current Validation Coverage

### API Functions with Runtime Validation
- ✅ `listWines()` - Validates wine array responses
- ✅ `getWine()` - Validates single wine responses  
- ✅ `insertWine()` - Validates input and output
- ✅ `updateWine()` - Validates input and output

### Zod Schemas Available
- ✅ `WineSchema` - Complete wine validation
- ✅ `CreateWineSchema` - Wine creation validation
- ✅ `UpdateWineSchema` - Wine update validation
- ✅ `CellarSlotSchema` - Cellar slot validation
- ✅ `AIEnrichmentSchema` - AI enrichment validation

### Type Safety Features
- ✅ `satisfies` operator for object construction
- ✅ Discriminated unions for type narrowing
- ✅ Strict TypeScript configuration
- ✅ Runtime validation at API boundaries

## Future Testing Considerations

### When to Add Tests
- **Complex Business Logic**: Functions with intricate rules
- **Data Transformations**: CSV import, data normalization
- **Integration Points**: Supabase RPC functions, edge functions
- **Critical Paths**: Wine creation, cellar placement, AI enrichment

### Test Structure
```typescript
// Real database test pattern
describe('Feature Name', () => {
  let testData: TestData
  
  beforeAll(async () => {
    testData = await setupTestData()
  })
  
  afterAll(async () => {
    await cleanupTestData(testData)
  })
  
  it('should handle real scenario', async () => {
    // Test with real data
  })
})
```

### Test Data Management
- **Unique Identifiers**: Use timestamps/UUIDs for test data
- **Isolation**: Each test gets fresh data
- **Cleanup**: Automatic cleanup after tests
- **Rollback**: Database transactions for test isolation

## Monitoring and Observability

### Runtime Validation Logging
- **Validation Errors**: Logged to console with details
- **API Errors**: Structured error messages
- **Type Errors**: Compile-time detection

### Production Monitoring
- **Zod Validation Failures**: Track in production
- **TypeScript Errors**: Build-time prevention
- **Database Errors**: Supabase error handling

## Conclusion

The no-mock approach provides:

1. **Higher Confidence**: Real data validation catches real issues
2. **Simpler Codebase**: No mock complexity to maintain
3. **Better DX**: TypeScript + Zod provide excellent developer experience
4. **Production Readiness**: Runtime validation ensures data integrity

This strategy prioritizes **real-world reliability** over **test convenience**, resulting in more robust and maintainable code.
