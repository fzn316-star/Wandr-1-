# 📋 Wandr — PRD Context Brief

> **Purpose**: This document captures all context needed by a PRD-writing agent alongside the Product Discovery Report and V1 Feature Specification. It records locked decisions, explicitly deferred questions, design principles, and go-to-market context.
>
> **Companion Documents**:
> - [Product Discovery Report](file:///d:/Product%20Space/AI%20Sprint%201/docs/product_discovery.md)
> - [V1 Feature Specification](file:///d:/Product%20Space/AI%20Sprint%201/docs/v1_feature_spec.md)
> - [Initial Brainstorm](file:///d:/Product%20Space/AI%20Sprint%201/docs/brainstorm_travel_discovery.md)

---

## 1. Product Identity

| Field | Decision | Notes |
|---|---|---|
| **Product Name** | **Wandr** | Chosen from candidates: Wandr, Driftmap, Compass AI, Roamly, Voya, Serendrift |
| **Tagline (draft)** | *"Discover where you didn't know you wanted to go"* | Working tagline — open to refinement in PRD |
| **Product Category** | AI-native travel discovery platform | Not a booking engine. Not an itinerary planner (V1). Discovery-first. |
| **Core Value Proposition** | Wandr understands traveler context (mood, life stage, travel style) and proactively surfaces highly relevant destinations and experiences — without filters, forms, or search bars | |

---

## 2. Locked Decisions

These decisions were explicitly agreed during product discovery and are **not open for re-discussion in the PRD**.

### 2.1 Target Audience
- **Decision**: All travelers — no single niche
- **Rationale**: The mood-first, context-aware approach is universally applicable. Narrowing to one segment (e.g., solo travelers only) would unnecessarily limit V1 addressable audience.
- **Primary segments** (by priority for early marketing):
  1. Gen Z & Millennials (digital-first, AI-comfortable, social discovery habits)
  2. Solo travelers ($482B market, 13.5% CAGR)
  3. Couples planning leisure trips
  4. Family travelers (high WTP, underserved by current tools)

### 2.2 Data Grounding Strategy
- **Decision**: **Hybrid grounding**
  - Layer 1: Curated destination knowledge base (editorially maintained, high quality)
  - Layer 2: Real-time data APIs (weather, visa, flight availability — V2 priority, surface level in V1)
  - Layer 3: Community sentiment signals (Reddit, review aggregation, traveler sentiment)
- **Rationale**: Pure LLM hallucination risk is too high for logistics (confirmed as top complaint in app reviews). Pure curated database is too static and expensive to scale. Hybrid balances accuracy with breadth.
- **V1 Scope**: Lean heavily on Layer 1 (curated) with selective Layer 3 (sentiment). Layer 2 (real-time APIs) is V2.

### 2.3 Platform
- **Decision**: **Web-first for V1** (responsive web app)
- **Rationale**: Fastest path to market, no app store approval latency, shareable links work natively, zero install friction for beta users.
- **V2**: PWA (Progressive Web App) for mobile offline support; native mobile apps deferred.

### 2.4 V1 Scope Boundary
- **Decision**: V1 delivers the **discovery-to-conviction journey only**
- V1 ends when a user has found a destination they're excited about and knows why it's right for them
- V1 does NOT include: booking integration, full itinerary generation, persistent user accounts, payment infrastructure, group travel support, or community features
- **Rationale**: Nailing discovery first builds the trust and retention moat before adding transactional complexity

---

## 3. Open / Deferred Decisions

These are **explicitly unresolved**. The PRD should flag them as open questions that need stakeholder alignment before Beta/GA.

### 3.1 Monetization Model
- **Status**: ❓ Deferred — decide before Beta launch
- **Options on the table**:

| Model | Pros | Cons | Persona Fit |
|---|---|---|---|
| **Per-trip curation fee** ($20–30) | Aligns with Dreamer WTP; no subscription friction | Hard to sustain; low LTV | Sarah (Dreamer) |
| **Annual subscription** ($50–100/yr) | Predictable revenue; aligns with Optimizer & Family WTP | Requires high perceived value upfront | Raj (Optimizer), David & Priya |
| **Affiliate commissions** (flights/hotels) | No user cost; scalable | Requires booking integration (V2); perception risk | All |
| **Freemium + Pro** | Broad top of funnel; upsell premium features | Requires clear feature differentiation | All |
| **Hybrid** (Freemium + Affiliate) | Best of both worlds | Complex to implement early | All |
- **Recommendation for PRD agent**: Default to **freemium** for V1 (no paywall, establish user base) with **affiliate** as the primary V2 monetization once booking integration exists. Document this as the working assumption with a flag for business review.

### 3.2 AI Architecture
- **Status**: ❓ Deferred — decide during technical architecture sprint
- **Options**:
  - **Single LLM + RAG**: One conversational model grounded via retrieval-augmented generation on the destination knowledge base. Simpler, faster to build.
  - **Multi-agent system**: Specialized agents (Mood Interpreter → Destination Recommender → Logistics Validator → Personalization Agent) orchestrated by a routing layer. More accurate, more complex.
- **Recommendation for PRD agent**: Document as "to be decided in technical architecture sprint." PRD should specify functional requirements (response time, grounding quality, reasoning transparency) without mandating architecture.

### 3.3 Community / Peer-to-Peer Layer
- **Status**: ❓ Deferred to V2+
- **Context**: App reviews identified the loss of Lonely Planet's Thorn Tree forum as a major gap. Travelers trust Reddit > TripAdvisor.
- **V1 Approach**: Surface community sentiment signals passively (via aggregated Reddit/review data) without building a community feature
- **V2 Opportunity**: User-generated travel notes, destination reviews in Wandr's own ecosystem

### 3.4 Cold Start Experience
- **Status**: ❓ Needs UX validation
- **Challenge**: First interaction has zero user data — how do we make it magical before we know anything about them?
- **Working hypothesis**: Mood-first entry (Story 1.1 + 1.2) solves this — the user tells us everything we need in the first message. Validate this assumption with user testing in Alpha.

### 3.5 Content Moderation & Accuracy Policy
- **Status**: ❓ Needs legal/policy review
- **Challenge**: Wandr makes destination recommendations with factual claims (safety, accessibility, costs). What's the liability stance if information is incorrect?
- **Recommendation**: PRD should include a content accuracy policy section and disclaimer strategy.

---

## 4. Design Principles

These principles govern ALL product and UX decisions for Wandr V1. When in doubt, refer to these.

### 4.1 The Curator, Not the Search Engine
> Wandr never shows a list of 50 options. Every surface in the product is opinionated, curated, and limited to what's most relevant. Less is more.

- Max 4 destination suggestions per AI response
- Max 8 experience highlights in a deep-dive
- No infinite scrolls of options

### 4.2 Always Explain the Why
> Every recommendation comes with reasoning tied to what the user said. No black boxes.

- Every destination card shows a "why this fits you" statement
- AI cites sources for factual claims
- AI acknowledges uncertainty honestly rather than faking confidence

### 4.3 No Required Fields, Ever
> Wandr meets the traveler where they are. Nothing is mandatory. The user can start with one sentence and get value immediately.

- All constraint fields (dates, budget, who's traveling) are optional
- User is never blocked from proceeding by an empty field
- Progressive disclosure: ask for more context only when it adds clear value

### 4.4 Honesty Over Hype
> Wandr builds trust by being honest about destinations — including the downsides. No destination is perfect for everyone.

- Every deep-dive includes a "What to Know" section with honest considerations
- AI never glosses over relevant negatives (e.g., stroller accessibility, rainy season, language barriers)
- Recommendations are personalized to context — not universally positive

### 4.5 Conversations, Not Forms
> Every user input is captured through natural dialogue. Wandr never looks like a filter panel or a form.

- Constraints are captured as follow-up questions in chat, not dropdowns
- Travel style is inferred from conversation, not a quiz
- Negative preferences are learned from dismissals, not a "exclude" checkbox

### 4.6 Emotionally Alive
> The UI and copy should make the user feel the wanderlust. Discovery should be exciting, not clinical.

- Design is visually rich, warm, and evocative — not utilitarian
- AI tone is that of a knowledgeable, enthusiastic travel companion — not a corporate assistant
- Every destination card evokes emotion before it informs

---

## 5. Go-To-Market Context

### 5.1 Initial Launch Strategy
- **Phase**: Closed Beta (invite-only)
- **Distribution**: Waitlist landing page → curated invites to travel-enthusiast communities (Reddit r/travel, travel Twitter/X, travel Slack groups)
- **Goal**: 500 Beta users in Month 1; 5,000 by Month 3

### 5.2 Primary Acquisition Channels (Early Stage)
1. **Word-of-mouth via Share links** — built into V1 (Story 6.4). Every shared discovery link is a distribution event.
2. **SEO / content** — travel discovery content targeting "where should I travel" intent keywords
3. **Community seeding** — Reddit, travel forums, travel influencer partnerships
4. **Social discovery** — V1 outputs should be inherently shareable on TikTok/Instagram

### 5.3 Key Differentiator for Marketing
> *"Wandr is the first travel tool that starts by asking how you FEEL — not where you want to go."*

This is the headline positioning. Marketing should lead with the mood-first entry point as the paradigm shift.

### 5.4 Who We're NOT Competing With (Messaging)
- Not a booking site (don't compete with Booking.com/Airbnb)
- Not an itinerary builder (don't compete with Wanderlog/TripIt)
- Not a review aggregator (don't compete with TripAdvisor)
- **We're in a new category**: AI travel discovery companion

---

## 6. Persona Quick Reference

For the PRD agent — brief summary of the 4 target personas validated in discovery research:

| Persona | Name | Age | Key Need | WTP |
|---|---|---|---|---|
| 🎭 The Dreamer | Sarah | 29 | *Done-for-you curation. Don't make me decide.* | $20–30/trip |
| 🔬 The Optimizer | Raj | 35 | *Show me the data and the reasoning. Earn my trust.* | $50/yr |
| ⚡ The Spontaneous One | Mika | 26 | *Real-time vibe matching. No rigid schedules.* | Commission on logistics |
| 👨‍👩‍👧‍👦 The Life-Stage Traveler | David & Priya | 40s | *Understand my constraints without making me feel boring.* | $100/yr |

Full interview transcripts: [persona_interviews](file:///C:/Users/Faizan/.gemini/antigravity/brain/c58c49d1-98bf-4d74-8cdd-5b86c3ff5e81/scratch/persona_interviews.md)

---

## 7. Glossary

| Term | Definition |
|---|---|
| **Traveler DNA** | The persistent model of a user's travel preferences, style, constraints, and life context — built up over sessions (V2 feature; in V1, approximated per-session) |
| **Intent crystallization** | The moment when a traveler's vague interest in "somewhere" sharpens into genuine interest in a specific destination |
| **Mood-to-Map Pipeline** | Wandr's core UX flow: mood input → AI discovery → visual destination cards → deep-dive → share/save |
| **Logistics chasm** | The gap between travel inspiration and actual booking where most travelers drop off due to complexity |
| **Tab explosion** | The behavior of opening 20–30 browser tabs to research a single trip — a key pain point V1 addresses |
| **Hybrid grounding** | Wandr's data strategy: curated knowledge base + real-time APIs + community sentiment signals |
| **Cold start** | The challenge of delivering a great first experience before Wandr has any data about a new user |

---

## 8. Instructions for PRD Agent

When writing the Wandr PRD using these documents, follow this structure and guidance:

1. **Use this brief as the authoritative source** for decisions, principles, and context
2. **Use `product_discovery.md`** for problem statement, market data, competitive context, and persona depth
3. **Use `v1_feature_spec.md`** for all feature requirements, user stories, and acceptance criteria — do not re-derive them
4. **Flag open decisions** (Section 3 above) explicitly in the PRD with a ⚠️ marker and recommended default
5. **Do not invent new features** beyond what's in the V1 Feature Spec — scope is locked for V1
6. **PRD tone**: Professional but human. Wandr is a consumer product — the PRD should reflect warmth alongside rigor.
7. **Recommended PRD sections**:
   - Executive Summary
   - Problem Statement
   - Product Vision & Mission
   - Target Users & Personas
   - Market Opportunity
   - V1 Scope & Boundaries
   - Design Principles
   - Feature Requirements (from V1 spec)
   - Success Metrics
   - Open Decisions & Risks
   - Release Phases
   - Appendix (Competitive Landscape, Research Summary)
