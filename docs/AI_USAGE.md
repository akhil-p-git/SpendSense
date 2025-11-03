# AI Usage in SpendSense Development

**Version**: 1.0  
**Date**: November 2025  
**AI Tool**: Claude (Anthropic) via Cursor IDE

---

## Overview

SpendSense was developed using AI assistance throughout the entire lifecycle, from initial planning to final implementation. This document provides transparency about where AI was used, how it was used, and what value it provided.

---

## AI Tool: Claude via Cursor

**Primary Tool**: Claude (Anthropic's AI assistant) integrated into Cursor IDE

**Access Pattern**: 
- Integrated into development environment
- Accessed via chat interface
- Code generation and editing capabilities
- Context-aware suggestions

---

## Development Phases and AI Usage

### Phase 1: Project Planning & Architecture (Initial)

#### AI Contributions

1. **Architecture Planning**
   - **Prompt**: "Based on this PRD, what's a good module structure for Python?"
   - **AI Output**: Suggested modular structure (ingest/, features/, personas/, recommend/, guardrails/, eval/, ui/)
   - **Human Review**: Validated against PRD requirements, adjusted based on project needs

2. **Tech Stack Recommendations**
   - **Prompt**: "Flask or FastAPI for this financial education API?"
   - **AI Output**: Analyzed trade-offs, suggested Flask for simplicity
   - **Human Decision**: Chose Flask based on simplicity requirements

3. **Database Strategy**
   - **Prompt**: "Should we use SQLite, PostgreSQL, or just DataFrames for this prototype?"
   - **AI Output**: Recommended DataFrames for MVP, suggested migration path
   - **Human Decision**: Agreed, prioritized speed of development

---

### Phase 2: Core Module Implementation

#### Signal Detection (`features/signal_detection.py`)

**AI Usage**: ~70% of implementation

1. **Subscription Detection Logic**
   - **Prompt**: "How do I detect recurring subscriptions from transaction data? Need to find merchants with ≥3 transactions and low variance."
   - **AI Output**: Implemented merchant grouping, coefficient of variation calculation, recurring merchant detection
   - **Human Refinement**: Adjusted CV threshold, added edge case handling

2. **Savings Behavior Analysis**
   - **Prompt**: "Calculate emergency fund coverage as months of expenses. Need to handle accounts without savings."
   - **AI Output**: Implemented savings account filtering, net inflow calculation, emergency fund calculation
   - **Human Refinement**: Added null checks, handled zero-expense cases

3. **Credit Utilization Detection**
   - **Prompt**: "Calculate credit card utilization percentage with checks for high utilization flags."
   - **AI Output**: Implemented utilization calculation, flag detection (30%, 50%, 80%)
   - **Human Refinement**: Added minimum payment detection, interest charge detection

**AI Efficiency**: Rapidly implemented complex logic that would have taken hours manually.

---

#### Persona Assignment (`personas/persona_assignment.py`)

**AI Usage**: ~60% of implementation

1. **Persona Checking Functions**
   - **Prompt**: "Implement functions to check if signals match each persona criteria from the PRD."
   - **AI Output**: Created all 5 persona check functions with proper criteria
   - **Human Refinement**: Validated against PRD, adjusted prioritization logic

2. **Rationale Generation**
   - **Prompt**: "Generate human-readable rationales for persona assignments based on signals."
   - **AI Output**: Created rationale templates with signal interpolation
   - **Human Refinement**: Ensured tone is empowering (no shaming language)

**AI Value**: Consistent function structure and clear logic across all personas.

---

#### Recommendation Engine (`recommend/recommendation_engine.py`)

**AI Usage**: ~50% of implementation

1. **Recommendation Content Structure**
   - **Prompt**: "Create education content catalog and partner offers for each persona."
   - **AI Output**: Generated content items with titles, descriptions, URLs
   - **Human Review**: Validated educational value, adjusted tone

2. **Rationale Generation**
   - **Prompt**: "Generate 'because' rationales that cite specific data points from signals."
   - **AI Output**: Created rationale templates that interpolate signal values
   - **Human Refinement**: Ensured specific numbers (e.g., "68% utilization" not "high utilization")

**AI Value**: Generated structured content quickly, ensuring consistency.

---

#### What-If Simulator (`recommend/what_if_simulator.py`)

**AI Usage**: ~40% of implementation

1. **Debt Amortization Formula**
   - **Prompt**: "Implement debt payoff calculation with amortization. Need to calculate months to payoff, total interest."
   - **AI Output**: Implemented amortization loop with monthly compounding
   - **Human Verification**: Validated formula accuracy, added safety limits (max months)

2. **Compound Interest Calculation**
   - **Prompt**: "Calculate savings growth with monthly contributions and compound interest at 4.5% APY."
   - **AI Output**: Implemented compound interest with monthly contributions
   - **Human Verification**: Verified formula matches standard financial calculators

3. **Recommendation Text Generation**
   - **Prompt**: "Generate recommendation text for What-If results. Should be encouraging, specific, and actionable."
   - **AI Output**: Created recommendation templates based on savings amounts
   - **Human Refinement**: Ensured tone is empowering, added specific numbers

**AI Value**: Complex financial formulas implemented correctly on first attempt.

---

### Phase 3: Guardrails Implementation

**AI Usage**: ~80% of implementation (new module, fully generated)

#### Consent Management (`guardrails/consent.py`)

- **Prompt**: "Implement consent checking and validation. Need functions to check consent, update consent, validate before processing."
- **AI Output**: Complete consent module with all required functions
- **Human Integration**: Integrated into API endpoints

#### Eligibility Checks (`guardrails/eligibility.py`)

- **Prompt**: "Create eligibility checking system. Need prohibited products list, product requirements, eligibility validation for balance transfer cards, savings accounts, etc."
- **AI Output**: Complete eligibility module with requirements dictionary, checking logic
- **Human Refinement**: Added specific requirements based on PRD

#### Tone Validation (`guardrails/tone.py`)

- **Prompt**: "Implement tone validation. Prohibit shaming language, replace with empowering alternatives. Need prohibited phrases list and sanitization."
- **AI Output**: Complete tone validation with prohibited phrases, preferred alternatives, sanitization function
- **Human Review**: Validated prohibited phrases list, ensured comprehensive coverage

**AI Value**: Rapid implementation of complex rule-based system.

---

### Phase 4: Evaluation Module

**AI Usage**: ~70% of implementation

1. **Metrics Calculation**
   - **Prompt**: "Implement evaluation metrics: coverage, explainability, latency, auditability. Need to calculate percentages and check if targets are met."
   - **AI Output**: Implemented all metric calculation functions
   - **Human Refinement**: Adjusted DataFrame handling, added edge cases

2. **Report Generation**
   - **Prompt**: "Generate comprehensive evaluation report combining all metrics with summary."
   - **AI Output**: Created report generation function with summary
   - **Human Integration**: Integrated into API endpoint

**AI Value**: Consistent metric calculation logic across all metrics.

---

### Phase 5: Frontend UI

**AI Usage**: ~85% of implementation (UI design and implementation)

#### HTML Structure (`ui/index.html`)

- **Prompt**: "Create HTML structure for SpendSense frontend with tabs for Recommendations, What-If Simulator, Transactions, Operator View. Include user selector."
- **AI Output**: Complete HTML structure with all sections
- **Human Refinement**: Adjusted layout, added missing elements

#### CSS Styling (`ui/styles.css`)

- **Prompt**: "Create CSS styling inspired by Mint, Credit Karma, and YNAB. Need purple gradient theme, card layouts, responsive design."
- **AI Output**: Complete CSS with all components styled
- **Human Refinement**: Adjusted colors, spacing, responsive breakpoints

#### JavaScript Logic (`ui/app.js`)

- **Prompt**: "Implement frontend logic to connect to Flask API. Need user selection, profile loading, recommendations display, What-If simulator with sliders, transactions list, operator dashboard."
- **AI Output**: Complete JavaScript application with API integration
- **Human Refinement**: Fixed API endpoints, added error handling, improved UI updates

**AI Value**: Rapid frontend development with consistent styling and functionality.

---

### Phase 6: Testing

**AI Usage**: ~60% of test implementation

1. **Test Fixtures**
   - **Prompt**: "Create pytest fixtures for sample transactions, accounts, signals."
   - **AI Output**: Generated fixtures with realistic test data
   - **Human Refinement**: Adjusted data to match actual formats

2. **Test Functions**
   - **Prompt**: "Write tests for signal detection. Test subscription detection, credit behavior, savings behavior."
   - **AI Output**: Generated test functions for each signal type
   - **Human Refinement**: Added edge case tests, validation checks

**AI Value**: Comprehensive test coverage with minimal manual writing.

---

### Phase 7: Documentation

**AI Usage**: ~90% of documentation

1. **README.md**
   - **Prompt**: "Create comprehensive README with setup instructions, usage examples, API documentation."
   - **AI Output**: Complete README with all sections
   - **Human Refinement**: Updated with actual endpoints, verified accuracy

2. **DECISION_LOG.md**
   - **Prompt**: "Document design decisions: why these personas, guardrails design, trade-offs, AI usage."
   - **AI Output**: Comprehensive decision log (this was iterative)
   - **Human Refinement**: Added specific details, validated technical accuracy

3. **DEMO_SCRIPT.md**
   - **Prompt**: "Create demo script for presenting SpendSense. Include talking points, demo flow, backup plans."
   - **AI Output**: Complete demo script with timing
   - **Human Refinement**: Adjusted for actual demo flow

---

## Specific AI Prompting Techniques Used

### 1. Context-Rich Prompts

**Example**:
```
"Based on this PRD section about personas, implement the persona assignment 
logic. The PRD says High Utilization persona matches if utilization ≥50% OR 
interest charges > 0 OR minimum-payment-only. Use the signals dictionary 
structure we've established."
```

**Why it works**: AI had full context (PRD, existing code structure, data formats)

---

### 2. Iterative Refinement

**Pattern**:
1. Initial prompt for skeleton
2. Refinement prompt: "Add error handling for empty DataFrames"
3. Another refinement: "Add logging for persona assignments"

**Why it works**: Built up complexity incrementally, catching issues early

---

### 3. Code-Specific Requests

**Example**:
```
"Add a function to check if user has existing savings account. Use the 
accounts_df structure from check_offer_eligibility function."
```

**Why it works**: Referenced existing code patterns, ensured consistency

---

### 4. Explainability Requests

**Example**:
```
"Implement tone validation. Explain why each prohibited phrase is problematic 
and what the preferred alternative achieves."
```

**Why it works**: Got both implementation and understanding

---

## Areas Where AI Excelled

### 1. **Rapid Prototyping**
- Generated skeleton code quickly
- Consistent patterns across modules
- Reduced boilerplate writing

### 2. **Complex Logic Implementation**
- Financial formulas implemented correctly
- Edge case handling suggestions
- Error handling patterns

### 3. **Documentation Generation**
- Comprehensive, well-structured docs
- Consistent style
- Complete coverage

### 4. **UI Development**
- Complete HTML/CSS/JS implementation
- Modern design patterns
- Responsive layouts

---

## Areas Where Human Judgment Was Critical

### 1. **Financial Formula Validation**
- **AI Generated**: Formulas
- **Human Verified**: Accuracy against financial calculators
- **Why**: Financial accuracy is non-negotiable, formulas must be correct

### 2. **Business Logic Validation**
- **AI Generated**: Persona assignment logic
- **Human Verified**: Matches PRD requirements, makes business sense
- **Why**: Business rules need domain expertise validation

### 3. **Integration & Testing**
- **AI Generated**: Individual modules
- **Human Integrated**: Connected all pieces, tested end-to-end
- **Why**: Integration requires understanding of full system

### 4. **Guardrails Rule Definition**
- **AI Generated**: Implementation structure
- **Human Defined**: Specific rules (prohibited products, tone phrases)
- **Why**: Guardrails rules require domain knowledge and judgment

### 5. **UI/UX Refinement**
- **AI Generated**: Initial layout
- **Human Refined**: Spacing, colors, interactions
- **Why**: UX requires iterative testing and refinement

---

## AI vs Human Contribution Estimate

| Component | AI Contribution | Human Contribution |
|-----------|------------------|-------------------|
| Architecture planning | 70% | 30% (validation, decisions) |
| Core modules (features, personas) | 60% | 40% (business logic, testing) |
| Guardrails | 80% | 20% (rules definition, integration) |
| What-If Simulator | 40% | 60% (formula validation, testing) |
| Frontend UI | 85% | 15% (refinement, testing) |
| Testing | 60% | 40% (edge cases, validation) |
| Documentation | 90% | 10% (accuracy checks) |
| **Overall** | **~70%** | **~30%** |

---

## AI-Assisted Debugging

### Issues AI Helped Solve

1. **CORS Errors**
   - **Problem**: Frontend couldn't call API
   - **AI Suggestion**: Flask-CORS configuration with specific origins
   - **Result**: Fixed immediately

2. **Account ID Detection**
   - **Problem**: What-If simulator needed account_id but it wasn't clear how to get it
   - **AI Suggestion**: Added `/users/<user_id>/accounts` endpoint, fetch in frontend
   - **Result**: Clean solution with proper API design

3. **Date Formatting**
   - **Problem**: Transaction dates weren't displaying correctly
   - **AI Suggestion**: ISO format conversion with hasattr check
   - **Result**: Handles both date objects and strings

4. **Tone Validation Edge Cases**
   - **Problem**: Some phrases weren't being caught
   - **AI Suggestion**: Regex patterns for directive language, case-insensitive matching
   - **Result**: More comprehensive validation

---

## Prompting Best Practices Discovered

### ✅ What Worked Well

1. **Provide full context**: Share PRD, existing code, requirements
2. **Be specific**: "Implement function X that does Y with Z data structure"
3. **Request explanations**: "Explain why this approach works"
4. **Iterate incrementally**: Build up complexity, don't ask for everything at once
5. **Ask for alternatives**: "What are the trade-offs between approach A and B?"

### ❌ What Didn't Work Well

1. **Too vague**: "Make it better" → unclear what "better" means
2. **No context**: Asking for code without showing existing patterns
3. **Too complex**: Asking for entire system in one prompt
4. **No validation**: Accepting AI output without testing/verifying

---

## Ethical Considerations

### Transparency
- This document provides full transparency about AI usage
- All AI-generated code was reviewed and validated
- Human judgment applied to all business-critical logic

### Accuracy Verification
- Financial formulas verified against standard calculators
- Business logic validated against PRD requirements
- All AI-generated code tested before use

### Attribution
- AI used as a tool, not a replacement for human judgment
- Human made all final decisions
- AI accelerated development but didn't replace critical thinking

---

## Lessons Learned

### 1. **AI is a Force Multiplier**
- Accelerated development by ~3x
- Allowed focus on high-value work (business logic, testing)
- Generated boilerplate and documentation efficiently

### 2. **Human Judgment Still Essential**
- Financial formulas need verification
- Business rules need domain expertise
- Integration requires system understanding

### 3. **Iterative Process Works Best**
- Initial AI output → Human review → Refinement → Final version
- Don't expect perfect code on first try
- Use AI for scaffolding, human for validation

### 4. **Context is Critical**
- More context = better AI output
- Share PRD, existing code, requirements
- Reference specific patterns and structures

---

## Future AI Usage Recommendations

### For Production Development

1. **Code Generation**: Continue using AI for boilerplate, scaffolding
2. **Documentation**: Use AI for initial drafts, human for accuracy review
3. **Test Generation**: AI for test structure, human for edge cases
4. **Code Review**: AI for style/patterns, human for logic/business rules

### Limitations to Remember

1. **Financial Accuracy**: Always verify formulas independently
2. **Business Logic**: Domain expertise required for rules
3. **Security**: Never use AI-generated code for auth/security without review
4. **Production Data**: Don't feed real user data to AI tools

---

## Conclusion

AI (Claude) was instrumental in rapidly developing SpendSense, contributing approximately **70%** of the codebase. However, **human judgment was essential** for:

- Financial formula validation
- Business logic definition
- Integration and testing
- Guardrails rule creation
- Final decision-making

The collaboration between AI and human judgment resulted in a complete, functional system that meets all PRD requirements while maintaining high code quality and comprehensive documentation.

**Key Takeaway**: AI is a powerful development tool that accelerates productivity, but human expertise remains critical for validation, business logic, and final decision-making.

---

**Document Status**: Complete  
**Last Updated**: November 2025

