# Testing Checklist

**Version**: 1.0  
**Date**: November 2025  
**Purpose**: Comprehensive testing checklist for React UI migration

---

## Pre-Migration Testing

### Backend API Health

- [ ] Flask server starts without errors
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] CORS headers are properly configured
- [ ] All API endpoints return expected data structures

### Build Verification

- [ ] React app builds successfully: `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or acceptable warnings)
- [ ] Build output exists in `ui-react/dist/`
- [ ] `index.html` is present
- [ ] Asset files are generated correctly

---

## Functional Testing

### User Selection & Navigation

- [ ] User dropdown loads all users
- [ ] Selecting a user updates the current user state
- [ ] User selection persists when navigating between tabs
- [ ] User selector works on mobile devices
- [ ] Refresh button reloads user list
- [ ] Error message displays if user fetch fails

### Profile View

- [ ] Profile loads correctly for selected user
- [ ] Persona badge displays with correct color coding
- [ ] Persona description and rationale are shown
- [ ] Metrics grid displays all key metrics:
  - [ ] Credit utilization
  - [ ] Savings rate
  - [ ] Monthly income
  - [ ] Active subscriptions
  - [ ] Emergency fund coverage
- [ ] Loading spinner displays during fetch
- [ ] Error message displays if profile fetch fails
- [ ] Empty state handles users without data

### Recommendations View

- [ ] Recommendations load correctly
- [ ] Education items are separated from partner offers
- [ ] "Because" rationales are displayed for each recommendation
- [ ] Recommendation cards display correctly:
  - [ ] Title
  - [ ] Description
  - [ ] Rationale
  - [ ] CTA button
  - [ ] Disclaimer
- [ ] Clicking a recommendation tracks acceptance
- [ ] Optimistic update works (UI updates immediately)
- [ ] Consent check displays appropriate error if user hasn't consented
- [ ] Loading state shows spinner
- [ ] Error handling displays user-friendly messages

### What-If Simulator

#### Basic Scenarios

- [ ] **Extra Debt Payment**:
  - [ ] Slider updates smoothly
  - [ ] Debouncing works (300ms delay)
  - [ ] Auto-detects credit card account
  - [ ] Displays current debt balance, APR
  - [ ] Shows projected payoff date
  - [ ] Calculates total interest saved correctly
  - [ ] Results update as slider changes

- [ ] **Subscription Cancellation**:
  - [ ] Lists user's subscriptions
  - [ ] Checkboxes work correctly
  - [ ] Shows monthly and annual savings
  - [ ] Auto-runs simulation on selection change
  - [ ] Handles users with no subscriptions

- [ ] **Increased Savings**:
  - [ ] Slider updates smoothly
  - [ ] Optional target amount input works
  - [ ] Shows projected balance with compound interest
  - [ ] Displays timeline to reach goal
  - [ ] Calculates correctly for different amounts

#### Advanced Scenarios

- [ ] **Goal-Based Planning**:
  - [ ] Target months slider works (6-60 months)
  - [ ] Max payment input accepts values
  - [ ] Calculate button triggers simulation
  - [ ] Shows feasibility correctly
  - [ ] Displays recommended payment amount
  - [ ] Handles infeasible goals gracefully

- [ ] **Combined Scenarios**:
  - [ ] Multiple scenario checkboxes work
  - [ ] Extra payment amount input works
  - [ ] Subscription selection list works
  - [ ] Savings amount input works
  - [ ] "Run Combined Scenario" button works
  - [ ] Shows combined impact correctly
  - [ ] Displays summary with all scenarios

- [ ] **Compare Scenarios**:
  - [ ] Two scenario builders side-by-side
  - [ ] Dropdowns select scenario types
  - [ ] Dynamic parameter inputs work
  - [ ] "Compare Scenarios" button works
  - [ ] Side-by-side comparison table displays
  - [ ] Shows which scenario is better

#### Export Functionality

- [ ] Export as JSON button works
- [ ] Export as PDF button works
- [ ] Export buttons only show when results exist
- [ ] Downloaded files have correct names
- [ ] JSON export contains all scenario data
- [ ] PDF export is properly formatted

### Transactions View

- [ ] Transactions table loads last 30 transactions
- [ ] Table columns display correctly:
  - [ ] Date (formatted as "Nov 3, 2025")
  - [ ] Merchant name
  - [ ] Amount (formatted as currency)
  - [ ] Category (with color badges)
  - [ ] Payment channel
- [ ] Sorting by date works (ascending/descending)
- [ ] Sorting by amount works (ascending/descending)
- [ ] Amounts are color-coded (green for income, default for expenses)
- [ ] Category badges have correct colors
- [ ] Spending chart displays correctly:
  - [ ] Pie chart renders
  - [ ] Tooltips show category totals
  - [ ] Category summary list displays
- [ ] Loading spinner displays during fetch
- [ ] Error handling displays properly
- [ ] Empty state handles no transactions

### Operator Dashboard

#### Analytics Cards

- [ ] **Persona Distribution Card**:
  - [ ] Pie chart displays correctly
  - [ ] Persona colors match expected values
  - [ ] Count and percentage shown for each persona
  - [ ] Summary list displays below chart
  - [ ] Loading state shows spinner
  - [ ] Error handling works

- [ ] **Recommendation Tracking Card**:
  - [ ] Overall acceptance rate displays
  - [ ] Progress bars render correctly
  - [ ] Breakdown by type shows correctly
  - [ ] Breakdown by persona shows correctly
  - [ ] Summary stats display (total shown, total accepted)
  - [ ] Loading and error states work

- [ ] **System Health Card**:
  - [ ] Uptime displays correctly (formatted)
  - [ ] Average latency shows with target indicator
  - [ ] Total API calls displays
  - [ ] User consent rate shows with target indicator
  - [ ] System status badge displays (Healthy/Needs Attention)
  - [ ] Green checkmarks show for targets met
  - [ ] Loading and error states work

#### Filters

- [ ] Persona dropdown filter works
- [ ] Signal type dropdown filter works
- [ ] Consent status filter works
- [ ] Clear Filters button resets all filters
- [ ] Export PDF Report button works
- [ ] Filters apply to user list correctly

#### User List

- [ ] Filtered users display in table
- [ ] All columns display correctly:
  - [ ] Name
  - [ ] Email
  - [ ] Persona (with color badge)
  - [ ] Consent Status (with badge)
  - [ ] Signals Summary
- [ ] Clicking a row navigates to user details
- [ ] Loading spinner displays
- [ ] Error handling works
- [ ] Empty state shows when no users match filters

---

## Error Handling Testing

### Network Errors

- [ ] Network error retry works (exponential backoff)
- [ ] Error messages display user-friendly text
- [ ] ErrorBoundary catches React errors
- [ ] Toast notifications show for errors
- [ ] Loading states clear on error

### API Errors

- [ ] 403 errors show consent message
- [ ] 404 errors redirect to user selector
- [ ] 500 errors show generic error message
- [ ] Error toasts auto-dismiss after 3 seconds
- [ ] Error messages are dismissible

### Validation Errors

- [ ] Invalid user selection shows error
- [ ] Missing required fields show validation
- [ ] Invalid scenario parameters show errors

---

## Performance Testing

### Loading Performance

- [ ] Initial page load < 3 seconds
- [ ] Code splitting works (check Network tab)
- [ ] Lazy loading loads pages on demand
- [ ] Images and assets load efficiently

### Runtime Performance

- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Debouncing works on sliders (300ms)
- [ ] Memoization prevents expensive recalculations
- [ ] React Query caching works correctly
- [ ] Optimistic updates are smooth

### Memory

- [ ] No memory leaks on navigation
- [ ] Event listeners are cleaned up
- [ ] Subscriptions are unsubscribed

---

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab navigation works through all interactive elements
- [ ] Arrow keys work in tabs
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Focus indicators are visible

### Screen Reader

- [ ] ARIA labels are present
- [ ] Role attributes are correct
- [ ] Live regions announce dynamic content
- [ ] Form labels are associated
- [ ] Error messages are announced

### Visual

- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at all sizes
- [ ] Focus indicators are visible
- [ ] Loading states are announced

---

## Responsive Design Testing

### Mobile (< 640px)

- [ ] Hamburger menu appears
- [ ] Mobile menu opens/closes correctly
- [ ] Cards stack vertically
- [ ] Tables scroll horizontally
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Text is readable
- [ ] Forms are usable
- [ ] Charts are viewable

### Tablet (640px - 1024px)

- [ ] Layout adapts appropriately
- [ ] Cards may be in grid or stacked
- [ ] Navigation is accessible
- [ ] All features work

### Desktop (> 1024px)

- [ ] Full layout displays
- [ ] Grid layouts show multiple columns
- [ ] Side-by-side comparisons work
- [ ] All features accessible

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Features to Test

- [ ] CSS Grid/Flexbox renders correctly
- [ ] JavaScript ES6+ features work
- [ ] Fetch API works
- [ ] LocalStorage works (Zustand persistence)
- [ ] File downloads work

---

## Integration Testing

### API Integration

- [ ] All endpoints called correctly
- [ ] Request formats are correct
- [ ] Response parsing works
- [ ] Error responses handled
- [ ] Timeout handling works (30s)

### State Management

- [ ] Zustand stores persist correctly
- [ ] React Query cache works
- [ ] State updates trigger re-renders
- [ ] Optimistic updates work
- [ ] Cache invalidation works

### Routing

- [ ] React Router navigation works
- [ ] URL changes on navigation
- [ ] Browser back/forward works
- [ ] Direct URL access works
- [ ] 404 redirects work

---

## Export Testing

### PDF Export

- [ ] Scenario PDF export works
- [ ] Evaluation PDF export works
- [ ] PDFs are properly formatted
- [ ] PDFs contain all expected data
- [ ] Download triggers correctly

### JSON Export

- [ ] Scenario JSON export works
- [ ] JSON is properly formatted
- [ ] JSON contains all expected data
- [ ] Download triggers correctly

---

## Security Testing

- [ ] No sensitive data in client-side code
- [ ] API keys not exposed
- [ ] CORS configured correctly
- [ ] XSS protection (React escapes by default)
- [ ] Input validation on client side
- [ ] Server-side validation still enforced

---

## Documentation Testing

- [ ] README instructions are accurate
- [ ] Setup steps work as documented
- [ ] API documentation matches actual endpoints
- [ ] Component architecture is documented
- [ ] Deployment instructions are clear

---

## Production Readiness

### Build

- [ ] Production build succeeds
- [ ] Bundle sizes are reasonable
- [ ] Source maps generated (optional)
- [ ] Environment variables configured

### Deployment

- [ ] Static files served correctly
- [ ] API proxy configured (if needed)
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Monitoring set up (optional)

---

## Sign-off

**Tester**: _________________  
**Date**: _________________  
**Status**: ☐ Passed  ☐ Failed  ☐ Needs Attention

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________

