# 📋 Wandr — Product Requirements Document (V1 / MVP)

> **Product**: Wandr — AI-Native Travel Discovery Platform  
> **Version**: V1 (Minimum Viable Product)  
> **Date**: August 3, 2026  
> **Status**: Ready for Engineering Review  
> **Author**: Product Team  
>  
> **Source Documents**:  
> - [Product Discovery Report](file:///d:/Product%20Space/AI%20Sprint%201/docs/product_discovery.md)  
> - [V1 Feature Specification](file:///d:/Product%20Space/AI%20Sprint%201/docs/v1_feature_spec.md)  
> - [PRD Context Brief](file:///d:/Product%20Space/AI%20Sprint%201/docs/prd_context_brief.md)  
> - [Initial Brainstorm](file:///d:/Product%20Space/AI%20Sprint%201/docs/brainstorm_travel_discovery.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Mission](#3-product-vision--mission)
4. [Target Users & Personas](#4-target-users--personas)
5. [Market Opportunity](#5-market-opportunity)
6. [V1 Scope & Boundaries](#6-v1-scope--boundaries)
7. [Design Principles](#7-design-principles)
8. [Feature Requirements — MVP (P0)](#8-feature-requirements--mvp-p0)
   - [Epic 1: Mood-First Discovery Entry](#epic-1-mood-first-discovery-entry)
   - [Epic 2: Conversational Discovery Engine](#epic-2-conversational-discovery-engine)
   - [Epic 3: Traveler Context Capture](#epic-3-traveler-context-capture)
   - [Epic 4: Visual Destination Experience](#epic-4-visual-destination-experience)
   - [Epic 5: Evolving Session Intelligence](#epic-5-evolving-session-intelligence)
   - [Epic 6: Destination Deep-Dive](#epic-6-destination-deep-dive)
   - [Epic 7: Customer Budget & Total Cost Intelligence](#epic-7-customer-budget--total-cost-intelligence)
9. [Feature Requirements — Differentiators (P1)](#9-feature-requirements--differentiators-p1)
10. [Non-Functional Requirements (Cross-Cutting)](#10-non-functional-requirements-cross-cutting)
11. [Success Metrics](#11-success-metrics)
12. [Open Decisions & Risks](#12-open-decisions--risks)
13. [Release Phases](#13-release-phases)
14. [Glossary](#14-glossary)
15. [Appendix A: Competitive Landscape Summary](#appendix-a-competitive-landscape-summary)
16. [Appendix B: Discovery Research Summary](#appendix-b-discovery-research-summary)

---

## 1. Executive Summary

Wandr is an **AI-native travel discovery platform** that helps travelers move from *"I don't know where I want to go"* to *"I'm excited about this destination and know exactly why it's right for me."*

Today, no product owns the full **inspiration-to-conviction** journey. Travelers toggle between TikTok (inspiration without logistics), Google/Kayak (logistics without inspiration), and Reddit (trust without structure) — resulting in "tab explosion," decision fatigue, and a massive drop-off between dreaming and booking. Meanwhile, emerging AI travel tools suffer from hallucinated logistics and black-box recommendations that erode trust.

Wandr V1 closes this gap by:

- **Starting with mood, not destinations** — capturing what a traveler *feels* before asking where they want to go
- **Modeling evolving traveler intent** — getting meaningfully smarter within a single conversation
- **Grounding every recommendation in reality** — transparent reasoning, cited sources, honest pros and cons
- **Delivering visually rich, curated output** — destination cards that feel like scrolling a travel feed, not reading search results

V1 focuses exclusively on the **discovery-to-conviction** journey. Booking, itinerary generation, persistent accounts, and payments are explicitly deferred to V2+.

> [!IMPORTANT]
> **V1 Success Criteria**: A traveler can arrive at Wandr with zero idea of where to travel, and leave — within a single session — with a destination they're genuinely excited about, a clear understanding of why it fits them, and enough confidence to start planning.

---

## 2. Problem Statement

### 2.1 The Core Problem

Travel discovery is fragmented, generic, and broken at the seam between inspiration and action.

Travelers currently need **4+ tools and 10–30 browser tabs** to go from inspiration to booking. The result:

| Problem | Evidence | Impact |
|---|---|---|
| **Tab Explosion** | All 4 validated personas report needing 10+ sources per decision | Decision fatigue, trip abandonment |
| **Logistics Chasm** | The gap between dreaming and booking is where most travelers drop off | Lost bookings, lost excitement |
| **Trust Erosion** | Fake reviews, AI hallucinations, pay-to-play rankings | Users flee to Reddit/TikTok for authentic validation |
| **One-Size-Fits-All** | A stressed parent and a solo backpacker get the same search results | Irrelevant suggestions, wasted time |

### 2.2 Why Now?

- **Generative AI travel market** hit $1.27B in 2026, growing rapidly from a nascent base
- **Behavioral shift**: TikTok/IG have replaced Google as the starting point for travel inspiration — but can't convert to bookings
- **"Mood over destination"** is a dominant trend — travelers search for feelings, not places
- **Agentic AI maturity**: Multi-turn, contextual AI systems are now production-ready
- **Trust gap**: Existing AI travel tools have trained users to expect — and be frustrated by — hallucinated logistics

### 2.3 What Has Been Tried (And Why It Falls Short)

| Existing Approach | What It Gets Right | Where It Fails |
|---|---|---|
| **AI chatbots** (Layla, GuideGeek) | Handle fuzzy requests; reduce tab count | Weak on complex logistics; hallucinate real-world details |
| **Dashboard planners** (Wanderlog, Trip Planner AI) | Great for complex trip organization | High-friction entry; steep learning curve; not inspirational |
| **Social platforms** (TikTok, Instagram) | Authentic inspiration; high engagement | Can't convert to bookable trips; fragmented data |
| **OTAs** (Booking.com, Kayak) | Strong booking infrastructure | Anxiety-inducing UX; redirect chaos; zero inspiration |

> [!NOTE]
> **The competitive whitespace** is the intersection of **Conversational + Inspirational** — where a travel tool starts with emotion and ends with conviction. No existing product occupies this space.

---

## 3. Product Vision & Mission

### 3.1 Vision

> **Wandr is the world's first AI travel companion that models who you are as a traveler and helps you discover what you didn't know you wanted — then gives you the confidence to make it real.**

### 3.2 Mission (V1)

> **Deliver a complete discovery experience** for a single traveler — from *"I don't know where I want to go"* to *"I'm excited about this destination and know exactly why it's right for me"* — in one session, grounded in real data, with full transparency.

### 3.3 Strategic Pillars

| Pillar | Description | V1 Expression |
|---|---|---|
| **Mood-to-Map Pipeline** | Start with emotion/vibe, end with a bookable destination. No forms, no filters, no 50-hotel lists. | Mood-first entry → conversational discovery → visual destination cards → deep-dive |
| **Evolving Intent Engine** | The AI gets smarter within each session. It remembers, adapts, and surprises. | Reaction-based learning, pivot handling, intent crystallization detection |
| **Grounded, Transparent AI** | Every recommendation comes with reasoning, real data citations, and honest pros/cons. No black boxes, no hallucinated bus schedules. | Transparent reasoning, "Why You'll Love It" + "What to Know", hybrid data grounding |

### 3.4 Positioning Statement

> *Wandr is not a search engine. Wandr is not a chatbot wrapper. Wandr is a travel discovery companion that models who you are as a traveler and helps you discover what you didn't know you wanted — then makes it real.*

**Marketing Headline**: *"Wandr is the first travel tool that starts by asking how you FEEL — not where you want to go."*

**Who We Are NOT Competing With**:
- Not a booking site (≠ Booking.com, Airbnb)
- Not an itinerary builder (≠ Wanderlog, TripIt)
- Not a review aggregator (≠ TripAdvisor)
- **We are a new category**: AI travel discovery companion

---

## 4. Target Users & Personas

### 4.1 Target Audience Decision

**Decision (LOCKED)**: All travelers — no single niche.

**Rationale**: The mood-first, context-aware approach is universally applicable. Narrowing to one segment would unnecessarily limit the V1 addressable audience.

**Primary segments by marketing priority**:
1. Gen Z & Millennials (digital-first, AI-comfortable, social discovery habits)
2. Solo travelers ($482B market, 13.5% CAGR)
3. Couples planning leisure trips
4. Family travelers (high willingness-to-pay, underserved by current tools)

### 4.2 Validated Personas

All four personas were validated through simulated user interviews during product discovery. They represent distinct traveler archetypes with different needs that V1 must serve.

---

````carousel
#### 🎭 Persona 1: The Dreamer — Sarah, 29

| Attribute | Detail |
|---|---|
| **Profile** | Marketing manager; scrolls travel Instagram at 11pm but never books |
| **Core frustration** | *"The 'Reel vs. Real' problem. I see a beautiful place online, but figuring out how to actually get there is a nightmare."* |
| **Magic wand** | *"Feed it my Instagram 'Saved' folder, tell it my budget and dates, and have it say: 'Here is the exact trip. Click one button.'"* |
| **Deal breaker** | *"A giant list of 50 hotels to choose from. I don't want a search engine; I want a curator."* |
| **WTP** | $20–30 per trip (one-time curation fee) |
| **V1 primary value** | Mood prompt entry, destination cards, experience highlights |
<!-- slide -->
#### 🔬 Persona 2: The Optimizer — Raj, 35

| Attribute | Detail |
|---|---|
| **Profile** | Software engineer; treats trip planning like a project sprint with massive spreadsheets |
| **Core frustration** | *"Data fragmentation. There is no single source of truth. Everything is rated 4.5 stars, which is statistically impossible."* |
| **Magic wand** | *"An aggregator of aggregators with customizable weighting: maximize transit proximity, minimize cost, pull Reddit sentiment."* |
| **Deal breaker** | *"Black-box AI recommendations. If it doesn't show me WHY or link the raw data, I won't trust it."* |
| **WTP** | $50/year for premium |
| **V1 primary value** | Transparent reasoning, side-by-side comparison, destination deep-dive |
<!-- slide -->
#### ⚡ Persona 3: The Spontaneous One — Mika, 26

| Attribute | Detail |
|---|---|
| **Profile** | Freelancer; books flights within days of seeing a deal or TikTok; figures it out on the ground |
| **Core frustration** | *"Logistics are a buzzkill. Traditional travel sites want you to lock in an exact 7-day itinerary. That's not how I travel."* |
| **Magic wand** | *"A 'Vibe Matcher' that works in real-time. I open it when I land, and it says, 'Based on your love for indie art and cheap beer, here are three neighborhoods.'"* |
| **Deal breaker** | *"If it recommends the Hard Rock Cafe, I'm deleting the app."* |
| **WTP** | Commission on logistics (transit, SIM cards) — not subscription |
| **V1 primary value** | Pivot handling, negative preference capture, travel style calibration |
<!-- slide -->
#### 👨‍👩‍👧‍👦 Persona 4: The Life-Stage Travelers — David & Priya, early 40s

| Attribute | Detail |
|---|---|
| **Profile** | Parents of two; default to all-inclusive resorts because planning with kids is exhausting |
| **Core frustration** | *"Travel sites think 'family-friendly' means a kids' club and a Mickey Mouse pool. We want cool culture and good food, but with logistics that accommodate a stroller."* |
| **Magic wand** | *"An AI that understands the LOGISTICS of parenting. Filter out steep stairs, highlight rentals near playgrounds and pharmacies."* |
| **Deal breaker** | *"If it hallucinates logistical info. If an app says a trail is 'stroller-friendly' and it's rocky, my whole day is ruined."* |
| **WTP** | $100/year — *"Time is our most precious commodity."* |
| **V1 primary value** | Life context detection, honest "What to Know", constraint capture |
````

---

### 4.3 Cross-Persona Jobs-to-be-Done (JTBD)

| JTBD | Description | Personas Served |
|---|---|---|
| **JTBD 1: Inspiration → Bookable Reality** | Transition instantly from visual inspiration to a concrete destination recommendation without losing excitement | All 4 |
| **JTBD 2: Single Source of Truth** | Consolidate fragmented data into one trustworthy view for confident decision-making | All 4 (primary: Raj) |
| **JTBD 3: Context-Aware Filtering** | Filter and recommend based on highly specific lifestyle constraints, not generic categories | All 4 (primary: David & Priya) |

---

## 5. Market Opportunity

### 5.1 Market Sizing

| Level | Value (2025–2026) | Growth Trajectory |
|---|---|---|
| **TAM** — Global Online Travel Market | $622B–$761B | → $1.4–$2T by 2034 (CAGR 7.4–11.1%) |
| **SAM** — Travel Technology Market | $11.3B–$14.3B | CAGR 5.3–10.3% |
| **SOM** — AI in Travel | $3.7B–$4.3B | Rapid growth |
| **SOM (specific)** — Generative AI in Travel | **$1.27B** (2026) | High CAGR, nascent market |

### 5.2 Key Market Trends

| Trend | Market Signal | Wandr Implication |
|---|---|---|
| **AI as starting point** | Travelers ask AI broad questions, not Google | Validates conversational-first UX |
| **Social commerce in travel** | TikTok/IG → booking gap is closing | Wandr should feel visual/social, not utilitarian |
| **Intentional travel** | "Calmcations," secondary cities, mood-first | Validates mood-based discovery over destination search |
| **Slow travel** | Longer stays, deeper immersion | Support flexible trip lengths, not 7-day packages |
| **Experiential over sightseeing** | Cooking classes, farm visits > checklist tourism | Surface experiences, not just places |
| **Authenticity > Polish** | UGC, raw vlogs, niche community travel | Honest recommendations > marketing hype |

### 5.3 Demographic Fit

| Segment | Market Size | Wandr Fit |
|---|---|---|
| **Gen Z** | Digital-first, TikTok-driven | ★★★★★ Perfect fit |
| **Millennials** | Highest spending power | ★★★★☆ Strong fit |
| **Solo Travelers** | $482B market (13.5% CAGR) | ★★★★★ Perfect fit |
| **Family Travel** | ~$1.2T market | ★★★★☆ Strong fit (with context modeling) |

> [!TIP]
> The generative AI travel market at $1.27B is early-stage and growing fast — perfect timing for Wandr to establish category leadership before the market consolidates.

---

## 6. V1 Scope & Boundaries

### 6.1 Scope Definition (LOCKED)

**V1 delivers the discovery-to-conviction journey only.**

V1 ends when a user has found a destination they're excited about and knows why it's right for them. V1 does NOT attempt to convert that excitement into a booking.

| ✅ In Scope (V1) | ❌ Out of Scope (V2+) |
|---|---|
| Mood-first discovery entry | Booking integration (flights, hotels) |
| Conversational AI discovery | Full itinerary generation with day-by-day plans |
| Lightweight traveler context capture (per-session) | Persistent user accounts & auth |
| Visual destination cards with AI reasoning | Map-based visual exploration canvas |
| Evolving intent within a single session | Real-time data integration (weather, events, prices) |
| Destination deep-dives with grounded information | Group/multi-traveler support |
| Save & share discoveries (link-based) | Community/social features |
| | Payment & monetization infrastructure |

### 6.2 Platform Decision (LOCKED)

**Web-first** (responsive web app). No native mobile app for V1.

**Rationale**: Fastest path to market; no app store approval latency; shareable links work natively; zero install friction for beta users.

### 6.3 Data Grounding Strategy (LOCKED)

**Hybrid grounding** — three layers:

| Layer | Description | V1 Priority |
|---|---|---|
| **Layer 1: Curated Knowledge Base** | Editorially maintained destination database with verified facts | **Primary** — lean heavily on this |
| **Layer 2: Real-Time Data APIs** | Weather, visa, flight availability, pricing | **Deferred to V2** (surface-level only in V1) |
| **Layer 3: Community Sentiment** | Reddit, review aggregation, traveler sentiment signals | **Secondary** — selective integration in V1 |

> [!CAUTION]
> Pure LLM output has unacceptable hallucination risk for logistics (confirmed as top complaint across travel app reviews). Pure curated data is too static and expensive to scale. Hybrid balances accuracy with breadth.

---

## 7. Design Principles

These principles govern ALL product and UX decisions for Wandr V1. When in doubt, defer to these.

### DP-1: The Curator, Not the Search Engine
> Wandr never shows a list of 50 options. Every surface is opinionated, curated, and limited to what's most relevant. Less is more.

- Max 4 destination suggestions per AI response
- Max 8 experience highlights in a deep-dive
- No infinite scrolls of options

### DP-2: Always Explain the Why
> Every recommendation comes with reasoning tied to what the user said. No black boxes.

- Every destination card shows a "why this fits you" statement
- AI cites sources for factual claims
- AI acknowledges uncertainty honestly rather than faking confidence

### DP-3: No Required Fields, Ever
> Wandr meets the traveler where they are. Nothing is mandatory. The user can start with one sentence and get value immediately.

- All constraint fields (dates, budget, travel companions) are optional
- User is never blocked from proceeding by an empty field
- Progressive disclosure: ask for more context only when it adds clear value

### DP-4: Honesty Over Hype
> Wandr builds trust by being honest about destinations — including the downsides. No destination is perfect for everyone.

- Every deep-dive includes a "What to Know" section with honest considerations
- AI never glosses over relevant negatives (e.g., stroller accessibility, rainy season, language barriers)
- Recommendations are personalized to context — not universally positive

### DP-5: Conversations, Not Forms
> Every user input is captured through natural dialogue. Wandr never looks like a filter panel or a form.

- Constraints are captured as follow-up questions in chat, not dropdowns
- Travel style is inferred from conversation, not a quiz
- Negative preferences are learned from dismissals, not an "exclude" checkbox

### DP-6: Emotionally Alive
> The UI and copy should make the user feel the wanderlust. Discovery should be exciting, not clinical.

- Design is visually rich, warm, and evocative — not utilitarian
- AI tone is that of a knowledgeable, enthusiastic travel companion — not a corporate assistant
- Every destination card evokes emotion before it informs

---

## 8. Feature Requirements — MVP (P0)

> [!IMPORTANT]
> Every feature below is **P0 (Must Ship)**. These features collectively deliver the core discovery-to-conviction experience. Each feature includes:
> - **User Stories** with acceptance criteria
> - **Functional Requirements (FR)** — what the system must do
> - **Non-Functional Requirements (NFR)** — how well the system must do it
> - **Discovery Traceability** — the validated insight that justifies this feature

---

### Epic 1: Mood-First Discovery Entry

**Purpose**: Replace the cold search bar with a warm, inviting entry point that captures traveler intent through mood, emotion, and vibe — not destinations and dates.

**Discovery Traceability**:
- Pain Point: 🔴 Logistics Chasm — most drop-off happens at the "where exactly?" question
- JTBD 1: Inspiration → Bookable Reality
- Persona validation: Sarah (Dreamer): *"I don't want a search engine; I want a curator."*

---

#### Feature 1.1: Mood Prompt Entry

**User Story**:
> **As a** traveler who doesn't know where I want to go,  
> **I want to** describe what I'm feeling or craving in my own words,  
> **So that** the system understands my intent without forcing me into rigid filters.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1.1 | The landing page SHALL present an inviting, open-ended prompt area with placeholder text (e.g., *"What kind of escape are you dreaming of?"*) | P0 |
| FR-1.1.2 | The input field SHALL accept free-form natural language text with a minimum of 3 words and no maximum word limit | P0 |
| FR-1.1.3 | The input field SHALL display rotating example prompts to inspire users who are stuck. Examples include: *"I just finished a brutal quarter and need to completely unplug"*, *"My partner and I want somewhere romantic but not cliché"*, *"I want to eat my way through a country for under $2,000"*, *"Somewhere our kids will love but we won't be bored"* | P0 |
| FR-1.1.4 | Upon submission, the system SHALL route the user's input to the conversational discovery engine (Epic 2) | P0 |
| FR-1.1.5 | The system SHALL NOT require any fields beyond the mood prompt — user can start with a single sentence and receive value | P0 |
| FR-1.1.6 | If the user enters fewer than 3 words, the system SHALL display a gentle, non-blocking hint encouraging more detail (not an error) | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-1.1.1 | The mood prompt processing (from submission to first visible response) SHALL complete within **3 seconds** | Performance |
| NFR-1.1.2 | The landing page SHALL load within **2 seconds** on a 4G mobile connection | Performance |
| NFR-1.1.3 | The input field SHALL be accessible via keyboard navigation and screen readers (WCAG 2.1 Level AA) | Accessibility |
| NFR-1.1.4 | The landing page design SHALL feel visually warm, evocative, and premium — not utilitarian or clinical (per DP-6) | UX Quality |
| NFR-1.1.5 | The rotating example prompts SHALL cycle smoothly with subtle animation, not jarring transitions | UX Quality |

**Acceptance Criteria**:
- [ ] Landing page renders with inviting mood prompt
- [ ] Free-text input accepts natural language ≥3 words
- [ ] System processes input and routes to conversation within 3 seconds
- [ ] Rotating examples display and cycle smoothly
- [ ] No required fields — user can proceed with one sentence
- [ ] Works on desktop (1280px+) and mobile (375px+)

---

#### Feature 1.3: Constraint Capture (Optional, Progressive)

**User Story**:
> **As a** traveler with real-world constraints,  
> **I want to** optionally add practical parameters (budget, dates, who's traveling),  
> **So that** recommendations are grounded in reality without being forced through a form.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-1.3.1 | After mood input, the system SHALL ask 1–2 natural follow-up questions in conversational format (not a form UI) | P0 |
| FR-1.3.2 | Follow-up questions SHALL cover: timing (*"Any idea on timing?"*), travel companions (*"Who's coming along?"*), budget (*"Any budget range or total trip budget in mind?"*), and departure location (*"Where will you be flying/traveling from?"*) when budget or trip duration is discussed | P0 |
| FR-1.3.3 | ALL constraint fields SHALL be optional — skipping SHALL be easy, prominent, and judgment-free (e.g., *"I'm flexible"* or *"Surprise me"* options) | P0 |
| FR-1.3.4 | The system SHALL function with zero constraints provided — pure mood-based discovery SHALL be a fully valid input | P0 |
| FR-1.3.5 | Captured constraints SHALL be modifiable at any point during the conversation via natural language (e.g., *"Actually, bump my budget up to $3,000"* or *"I'm departing from London instead of NYC"*) | P0 |
| FR-1.3.6 | Constraints SHALL be captured via lightweight interactive elements within the chat (e.g., inline date picker, spectrum slider, origin location selector, quick-reply buttons) — never as a standalone form page | P0 |
| FR-1.3.7 | If a user provides a total trip budget (e.g. "$2,500 total"), the AI SHALL gracefully request their departure region/city if not already captured, to prevent flight/transit costs from invalidating recommendations | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-1.3.1 | Constraint capture interaction SHALL feel like natural conversation — users should NOT perceive they are filling out a form | UX Quality |
| NFR-1.3.2 | Each constraint question SHALL take less than **5 seconds** for the user to respond to or skip | Usability |
| NFR-1.3.3 | Constraint modifications mid-conversation SHALL take effect on subsequent suggestions within **3 seconds** | Performance |

**Acceptance Criteria**:
- [ ] System asks 1–2 follow-up questions after mood input in conversational format
- [ ] All constraint fields are optional and easily skippable
- [ ] System delivers quality results with zero constraints
- [ ] Constraints can be modified at any point in conversation
- [ ] No form-like UI elements; all captured through chat

---

### Epic 2: Conversational Discovery Engine

**Purpose**: The AI companion that understands context, asks smart questions, surfaces destinations with reasoning, and evolves with the conversation.

**Discovery Traceability**:
- Pain Point: 🔴 Tab Explosion — eliminates the need for 10+ tabs
- Pain Point: 🔴 Logistics Chasm — bridges dreaming and booking
- JTBD 2: Single Source of Truth
- Persona validation: Raj (Optimizer): *"I waste roughly 20 hours just verifying data. I need to see the logic."*

---

#### Feature 2.1: Initial Discovery Response

**User Story**:
> **As a** traveler who just expressed my mood/intent,  
> **I want to** receive 3–4 thoughtfully curated destination suggestions with clear reasoning,  
> **So that** I can see options that feel personally chosen, not algorithmically generic.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1.1 | The AI SHALL respond with **3–4 destination suggestions** (never 5+, never a numbered list of 10) per discovery response | P0 |
| FR-2.1.2 | Each suggestion SHALL include: destination name and region, 2–3 sentence explanation of **why it matches the user's stated intent**, and one "hook" (a surprising or lesser-known fact that sparks curiosity) | P0 |
| FR-2.1.3 | Each suggestion SHALL be accompanied by a visual destination card (see Feature 4.1) | P0 |
| FR-2.1.4 | Suggestions SHALL span a diversity of options — vary by type (beach vs. mountain vs. city), region, and budget. The system SHALL NOT return 3+ suggestions of the same type | P0 |
| FR-2.1.5 | The AI SHALL explicitly invite a reaction at the end: *"Any of these spark something? Or should I explore a different direction?"* | P0 |
| FR-2.1.6 | All destination suggestions SHALL be sourced from the curated knowledge base (Layer 1) with optional community sentiment enrichment (Layer 3). The system SHALL NOT hallucinate destinations or fabricate facts about destinations | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-2.1.1 | Initial discovery response SHALL render within **5 seconds** of user input | Performance |
| NFR-2.1.2 | Response SHALL use streaming delivery so users see progressive output (not a blank screen for 5 seconds) | Performance |
| NFR-2.1.3 | The AI voice SHALL be warm, knowledgeable, and conversational — like a well-traveled friend, not a corporate assistant | Tone/Voice |
| NFR-2.1.4 | Every factual claim about a destination (costs, seasons, visa requirements) SHALL be sourced from the curated knowledge base. If data is uncertain, the AI SHALL explicitly flag uncertainty | Data Quality |
| NFR-2.1.5 | The system SHALL be resilient to ambiguous, vague, or extremely short inputs — producing reasonable suggestions even from minimal context | Robustness |

**Acceptance Criteria**:
- [ ] AI returns 3–4 destination suggestions with reasoning tied to user input
- [ ] Each suggestion includes a destination name, match explanation, and curiosity hook
- [ ] Suggestions are diverse (not 3 beach destinations)
- [ ] Visual cards render alongside text
- [ ] Response time under 5 seconds with streaming
- [ ] AI invites user reaction at end of response

---

#### Feature 2.2: Smart Follow-Up Questions

**User Story**:
> **As a** traveler exploring options,  
> **I want** the AI to ask me intelligent follow-up questions that narrow results meaningfully,  
> **So that** I don't have to figure out the right questions to ask myself.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-2.2.1 | The AI SHALL ask follow-up questions that are **specific** (not generic like "tell me more about your preferences"), **binary or low-effort** (not essay questions), and **contextual** to what the user already said | P0 |
| FR-2.2.2 | Follow-ups SHALL help refine on dimensions including: adventure vs. relaxation spectrum, cultural immersion depth, comfort level (backpacker → boutique → luxury), pace preference (packed schedule → slow mornings), and deal-breakers (long flights, extreme heat, altitude) | P0 |
| FR-2.2.3 | The AI SHALL NOT ask more than **2 follow-up questions in sequence** without providing new destination suggestions | P0 |
| FR-2.2.4 | The user SHALL be able to ignore follow-up questions and steer the conversation freely — follow-ups are suggestions, not gates | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-2.2.1 | Follow-up questions SHALL feel natural and conversational — not like a form wizard | UX Quality |
| NFR-2.2.2 | Follow-up response generation SHALL complete within **3 seconds** | Performance |
| NFR-2.2.3 | The AI SHALL track which dimensions have already been explored to avoid asking redundant questions | Intelligence |

**Acceptance Criteria**:
- [ ] AI asks specific, low-effort follow-ups contextual to prior conversation
- [ ] No more than 2 questions before new suggestions appear
- [ ] User can freely ignore follow-ups and redirect
- [ ] Follow-ups feel natural, not mechanical

---

#### Feature 2.3: Conversational Pivot Handling

**User Story**:
> **As a** traveler whose preferences shift mid-conversation,  
> **I want** the AI to gracefully adapt when I change direction,  
> **So that** I don't feel locked into my initial input.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-2.3.1 | The AI SHALL detect intent shifts in user messages (e.g., *"Actually, I'm thinking beaches instead of mountains"*) | P0 |
| FR-2.3.2 | Upon detecting a pivot, the AI SHALL acknowledge it naturally (e.g., *"Love the pivot! Let me rethink with beaches in mind..."*) | P0 |
| FR-2.3.3 | New suggestions SHALL reflect the updated intent while retaining earlier context that was **not** contradicted | P0 |
| FR-2.3.4 | The AI SHALL NOT restart the conversation from scratch upon a pivot — session context is preserved | P0 |
| FR-2.3.5 | Full conversation history SHALL remain visible and scrollable to the user | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-2.3.1 | Pivot detection SHALL work for both explicit pivots (*"Actually, I want beaches"*) and implicit ones (gradual shift in language toward a different type of destination) | Intelligence |
| NFR-2.3.2 | Post-pivot suggestions SHALL render within **5 seconds** | Performance |
| NFR-2.3.3 | The AI SHALL handle multiple pivots within a single session without degrading response quality | Robustness |

**Acceptance Criteria**:
- [ ] AI detects explicit and implicit intent shifts
- [ ] AI acknowledges pivots naturally and regenerates relevant suggestions
- [ ] Non-contradicted context is retained
- [ ] Conversation doesn't restart from scratch
- [ ] Full chat history remains visible

---

#### Feature 2.4: Transparent AI Reasoning

**User Story**:
> **As a** data-driven traveler,  
> **I want to** understand WHY the AI is recommending each destination,  
> **So that** I can trust the recommendations and make informed decisions.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-2.4.1 | Each recommendation SHALL include a "Why this matches you" explanation explicitly tied to the user's stated preferences | P0 |
| FR-2.4.2 | The AI SHALL cite the basis for factual claims (e.g., *"Based on traveler reviews..."*, *"Historically, September sees 60% fewer tourists..."*) | P0 |
| FR-2.4.3 | The user SHALL be able to ask "why?" about any specific recommendation and receive a deeper, more detailed explanation | P0 |
| FR-2.4.4 | The AI SHALL acknowledge limitations and uncertainty honestly (e.g., *"I'm less certain about the food scene here — you might want to verify on local food blogs"*) | P0 |
| FR-2.4.5 | The system SHALL NOT produce black-box recommendations — every suggestion SHALL have a traceable chain of reasoning linking user input → recommendation logic → data source | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-2.4.1 | Reasoning explanations SHALL reference specific words, moods, or constraints the user provided — not generic phrases | Quality |
| NFR-2.4.2 | The AI SHALL NEVER fabricate citations or sources. If no source is available, the AI SHALL explicitly state the basis (e.g., *"Based on general knowledge"*) or omit the claim | Data Integrity |
| NFR-2.4.3 | "Why?" deep-dive responses SHALL render within **3 seconds** | Performance |
| NFR-2.4.4 | Uncertainty acknowledgments SHALL appear in at least **20%** of deep-dive content, reflecting genuine epistemic humility | Trust |

**Acceptance Criteria**:
- [ ] Every recommendation shows personalized "why this fits you" reasoning
- [ ] Factual claims cite their basis/source
- [ ] "Why?" follow-up produces deeper explanation
- [ ] AI honestly acknowledges uncertainty where appropriate
- [ ] Zero fabricated citations or invented data sources

---

### Epic 3: Traveler Context Capture

**Purpose**: Capture enough about the traveler's context — within the session, without registration — to power meaningfully different recommendations.

**Discovery Traceability**:
- Pain Point: 🟡 One-Size-Fits-All — tools don't understand life context
- JTBD 3: Context-Aware Filtering
- Persona validation: David (Life-Stage): *"Travel sites think 'family-friendly' means a kids' club and a Mickey Mouse pool."*

---

#### Feature 3.1: Life Context Detection

**User Story**:
> **As a** traveler with specific life circumstances,  
> **I want** the AI to understand my context (solo, couple, family, remote worker, etc.),  
> **So that** recommendations account for my real-world constraints.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1.1 | The AI SHALL infer traveler context from natural conversation cues, including: *"traveling with my partner"* → couple mode, *"we have a 4-year-old"* → family mode, *"I'll be working remotely"* → digital nomad mode, *"first time traveling solo"* → solo mode | P0 |
| FR-3.1.2 | Inferred context SHALL visibly and meaningfully affect subsequent recommendations (e.g., family mode surfaces stroller accessibility info; solo mode highlights walkability and social hostels) | P0 |
| FR-3.1.3 | The user SHALL be able to correct misinterpretations via natural language (e.g., *"Actually, the kids aren't coming this time"*) and corrections SHALL take effect immediately | P0 |
| FR-3.1.4 | The system SHALL support at minimum the following context modes: solo, couple, friends group, family with young kids, family with teens, digital nomad/remote worker | P0 |
| FR-3.1.5 | Context detection SHALL be passive (inferred from conversation) — the system SHALL NOT present a mandatory context selection screen | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-3.1.1 | Context inference SHALL achieve at least **90% accuracy** on clear conversational signals (e.g., explicit mention of "kids" or "partner") | Accuracy |
| NFR-3.1.2 | Context corrections SHALL propagate to the next AI response with no additional latency beyond normal response time | Performance |
| NFR-3.1.3 | The system SHALL NOT make assumptions about context without conversational evidence — default to a generic mode when no context cues are present | Data Quality |

**Acceptance Criteria**:
- [ ] AI correctly infers context from conversational cues (solo, couple, family, etc.)
- [ ] Context visibly changes the recommendations
- [ ] User can correct misinterpretations and corrections take immediate effect
- [ ] No mandatory context selection screen
- [ ] System works gracefully when no context cues are provided

---

#### Feature 3.3: Negative Preference Capture

**User Story**:
> **As a** traveler who knows what I DON'T want,  
> **I want to** express deal-breakers and have them permanently respected for the session,  
> **So that** I don't waste time on suggestions I'll immediately dismiss.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-3.3.1 | The AI SHALL capture explicit negative preferences from user messages (e.g., *"No beach resorts"*, *"Nothing in Asia"*, *"I can't do high altitude"*) | P0 |
| FR-3.3.2 | The AI SHALL capture implicit negative preferences from user behavior — if a user dismisses 2+ suggestions of the same type (e.g., 2 beach destinations), the AI SHALL stop suggesting that type unless explicitly re-invited | P0 |
| FR-3.3.3 | Captured negatives SHALL **never** be violated in subsequent suggestions within the same session | P0 |
| FR-3.3.4 | When a negative is ambiguous, the AI SHALL ask a clarifying question (e.g., *"When you say 'not touristy,' do you mean fewer crowds or more authentic local culture?"*) | P0 |
| FR-3.3.5 | The AI SHALL maintain an internal negative preference list for the session, which the user can query (e.g., *"What have I said no to?"*) | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-3.3.1 | Negative preferences SHALL be enforced with **100% compliance** — zero violations per session | Data Integrity |
| NFR-3.3.2 | Implicit negative detection SHALL trigger after **2 dismissals** of the same category, not fewer (to avoid premature filtering) | Intelligence |
| NFR-3.3.3 | Negative preference capture SHALL NOT create a "filter bubble" that makes it impossible for the system to generate suggestions — the AI SHALL inform the user if their negatives are too restrictive | Robustness |

**Acceptance Criteria**:
- [ ] Explicit negatives captured from user messages
- [ ] Implicit negatives learned from 2+ dismissals of same type
- [ ] Negatives never violated in subsequent suggestions
- [ ] Clarifying questions asked for ambiguous negatives
- [ ] User can query their negative preference list

---

### Epic 4: Visual Destination Experience

**Purpose**: Transform AI text suggestions into rich, visual, swipeable destination cards that feel like scrolling through a travel feed, not reading search results.

**Discovery Traceability**:
- Pain Point: 🔴 Tab Explosion — visual cards consolidate information
- JTBD 1: Inspiration → Bookable Reality
- Persona validation: Sarah (Dreamer): *"I want to feed it my Instagram 'Saved' folder and have it say: 'Here is the exact trip.'"*

---

#### Feature 4.1: Destination Cards

**User Story**:
> **As a** traveler evaluating options,  
> **I want** each suggested destination presented as a rich visual card,  
> **So that** I can quickly gauge the vibe and feel excited — not just informed.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1.1 | Each destination suggestion SHALL render as a visual card containing: hero image (high-quality, evocative photography), destination name + country/region, 1-line "vibe tag" (e.g., *"Volcanic islands, zero crowds, slow food"*), AI match reason (1 sentence — why this fits the user's mood/context), and quick stats (best time to visit, avg daily cost, flight time from user's region) | P0 |
| FR-4.1.2 | Cards SHALL be interactable: tap/click to expand (deep-dive), dismiss, or save | P0 |
| FR-4.1.3 | Multiple cards SHALL appear in a horizontal scroll or stacked layout within the chat interface | P0 |
| FR-4.1.4 | Cards SHALL load with a subtle entrance animation (fade-in or slide-up — not jarring, not slow) | P0 |
| FR-4.1.5 | Hero images SHALL be sourced from a licensed, curated image library — not AI-generated or unattributed stock photos | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-4.1.1 | Destination cards SHALL render within **2 seconds** of the AI generating the suggestion (images may lazy-load with low-res placeholders) | Performance |
| NFR-4.1.2 | Card layout SHALL be responsive — rendering cleanly on mobile (375px), tablet (768px), and desktop (1280px+) | Responsiveness |
| NFR-4.1.3 | Hero images SHALL be compressed and served via CDN, targeting **< 200KB per image** on initial load | Performance |
| NFR-4.1.4 | Card design SHALL feel premium, modern, and visually rich — comparable to high-end travel editorial design | UX Quality |
| NFR-4.1.5 | Cards SHALL have smooth hover/tap states with micro-interactions (subtle shadow lift, highlight effect) | UX Quality |

**Acceptance Criteria**:
- [ ] Cards render with hero image, destination name, vibe tag, match reason, and quick stats
- [ ] Cards are tappable to expand, dismissible, and saveable
- [ ] Cards display in horizontal scroll or stacked layout
- [ ] Entrance animations are smooth and subtle
- [ ] Cards render cleanly on mobile, tablet, and desktop
- [ ] Images load quickly with placeholder strategy

---

#### Feature 4.2: Card Reactions (Like / Dismiss / Save)

**User Story**:
> **As a** traveler browsing suggestions,  
> **I want to** quickly react to destination cards (interested / not interested / save for later),  
> **So that** the AI learns my preferences from my reactions, not just my words.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-4.2.1 | Each card SHALL have 3 interaction options: ❤️ **Interested** (signals positive preference), ✖️ **Not for me** (signals negative preference), 🔖 **Save** (adds to session collection) | P0 |
| FR-4.2.2 | The AI SHALL use card reactions to refine subsequent suggestions (connected to Epic 5 — reaction-based learning) | P0 |
| FR-4.2.3 | Dismissing a card SHALL trigger a one-time optional micro-question: *"Too expensive? Too far? Not the vibe?"* (dismissible with a single tap) | P0 |
| FR-4.2.4 | Saved destinations SHALL be accessible via a persistent side panel or tab that remains visible during the conversation | P0 |
| FR-4.2.5 | All reaction interactions SHALL be lightweight — single tap, no confirmation dialogs, no multi-step flows | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-4.2.1 | Reaction interactions SHALL have < **100ms** visual feedback (instant highlight/animation on tap) | Performance |
| NFR-4.2.2 | The saved destinations panel SHALL not obstruct the main conversation flow on any screen size | Usability |
| NFR-4.2.3 | Reaction data SHALL be persisted for the duration of the session (surviving page refresh for URL-based sessions) | Reliability |

**Acceptance Criteria**:
- [ ] Three reaction options (Interested, Not for me, Save) on every card
- [ ] AI adapts suggestions based on reactions
- [ ] Dismiss triggers optional micro-question (one-tap dismissible)
- [ ] Saved destinations accessible via persistent panel/tab
- [ ] Reactions are single-tap with instant feedback

---

### Epic 5: Evolving Session Intelligence

**Purpose**: The AI gets meaningfully smarter within a single session — learning from every message, reaction, and behavioral signal.

**Discovery Traceability**:
- JTBD 3: Context-Aware Filtering
- Persona validation: Mika (Spontaneous): intent changes fast; system must adapt in real-time

---

#### Feature 5.1: Reaction-Based Learning

**User Story**:
> **As a** traveler who reacts to suggestions,  
> **I want** the AI to visibly improve its recommendations based on my reactions,  
> **So that** I feel the system is learning ME, not just processing queries.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1.1 | The AI SHALL track all signals within the session: cards liked/dismissed and why, topics the user asks follow-ups about, explicit preference statements, implied preferences from language patterns | P0 |
| FR-5.1.2 | After **4+ interactions**, recommendations SHALL be noticeably more targeted compared to the initial response — demonstrating visible learning | P0 |
| FR-5.1.3 | The AI SHALL occasionally acknowledge its learning (e.g., *"I'm noticing you're drawn to places with strong culinary identity — let me lean into that..."*) — at most once every 3–4 messages | P0 |
| FR-5.1.4 | The user SHALL be able to reset session learning via *"Start fresh"* or equivalent — clearing all session context | P0 |
| FR-5.1.5 | The AI SHALL build an internal preference model for the session that includes: positive preferences (liked types, regions, price tiers), negative preferences (dismissed types), inferred style dimensions (adventure level, comfort level, pace) | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-5.1.1 | The session preference model SHALL be updated in real-time — each new reaction SHALL be reflected in the very next AI response | Performance |
| NFR-5.1.2 | Learning acknowledgment messages SHALL feel natural and insightful — not formulaic or robotic | UX Quality |
| NFR-5.1.3 | The preference model SHALL support at least **20 messages** of conversation without degrading response quality or latency | Scalability |
| NFR-5.1.4 | "Start fresh" SHALL clear all learned preferences within **1 second** and return to a cold-start state | Performance |

**Acceptance Criteria**:
- [ ] AI tracks likes, dismissals, questions, and language patterns
- [ ] Recommendations are noticeably more targeted after 4+ interactions
- [ ] AI occasionally acknowledges learning (not too frequently)
- [ ] "Start fresh" resets all session context
- [ ] Learning updates reflected in subsequent responses in real-time

---

### Epic 6: Destination Deep-Dive

**Purpose**: When a traveler says "tell me more," deliver a rich, trustworthy deep-dive that makes them feel confident — not overwhelmed.

**Discovery Traceability**:
- Pain Point: 🔴 Trust Erosion — honest, cited information builds trust
- JTBD 2: Single Source of Truth
- App review insight: Lonely Planet reviewers: *"We don't need more beautiful photos; we need to know exactly which bus terminal to go to."*

---

#### Feature 6.1: Destination Overview Deep-Dive

**User Story**:
> **As a** traveler interested in a specific destination,  
> **I want** a comprehensive but scannable overview,  
> **So that** I can quickly evaluate if this place is genuinely right for me.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1.1 | Tapping "Tell me more" on any destination card SHALL open a rich deep-dive view | P0 |
| FR-6.1.2 | The deep-dive view SHALL include: **Hero visual** (gallery of 4–6 high-quality images), **AI summary** (2–3 paragraph overview written in Wandr's voice, tailored to the user's stated interests), **Best for** tags (showing traveler/trip types this suits), **Best time to visit** (month-by-month breakdown with reasoning), **Budget guide** (realistic daily cost ranges: budget / mid-range / comfort), **Getting there** (flight time from user's region, visa requirements), **Vibe check** (honest pros AND cons) | P0 |
| FR-6.1.3 | Content SHALL be grounded in the curated knowledge base (Layer 1) with source attribution for factual claims | P0 |
| FR-6.1.4 | The user SHALL be able to scroll through sections or collapse/expand them | P0 |
| FR-6.1.5 | The AI summary SHALL be personalized — referencing the user's specific mood, constraints, and context from the conversation (not generic marketing copy) | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-6.1.1 | Deep-dive view SHALL load within **3 seconds** (text content; images may lazy-load) | Performance |
| NFR-6.1.2 | All factual claims in the deep-dive (costs, visa requirements, flight times) SHALL be sourced from the curated knowledge base. If data is stale or unavailable, the system SHALL explicitly note: *"This information may have changed — verify before booking"* | Data Integrity |
| NFR-6.1.3 | The deep-dive layout SHALL be scannable — users should be able to find specific sections (budget, getting there) within **3 seconds** of opening | Usability |
| NFR-6.1.4 | Image gallery SHALL support swipe gestures on mobile and click navigation on desktop | Responsiveness |
| NFR-6.1.5 | Deep-dive content SHALL NOT exceed **1,500 words** to maintain scannability | Content Quality |

**Acceptance Criteria**:
- [ ] "Tell me more" opens a rich deep-dive view
- [ ] Deep-dive includes hero gallery, personalized summary, best-for tags, best time, budget, getting there, and vibe check
- [ ] Content is grounded and sourced — no fabricated data
- [ ] Sections are collapsible/expandable
- [ ] Loads within 3 seconds (text); images lazy-load
- [ ] Deep-dive is personalized to user's conversation context

---

#### Feature 6.2: Honest "Why You'll Love It" / "What to Know"

**User Story**:
> **As a** traveler who wants honesty, not marketing,  
> **I want** the AI to tell me both why I'll love a destination AND what might be challenging,  
> **So that** I can make decisions based on reality, not hype.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-6.2.1 | Every destination deep-dive SHALL include two clearly labeled sections: ✅ **"Why You'll Love It"** — personalized to the user's stated intent, mood, and context (NOT generic), and ⚠️ **"What to Know"** — honest considerations relevant to the user's situation | P0 |
| FR-6.2.2 | The "What to Know" section SHALL be **personalized to the user's context**: family travelers see stroller/kid info; solo female travelers see safety info; budget travelers see hidden cost warnings; digital nomads see WiFi reliability | P0 |
| FR-6.2.3 | The AI SHALL cite sources for factual claims in both sections where possible | P0 |
| FR-6.2.4 | The tone SHALL be honest and helpful, **never alarmist** — presenting considerations as useful information, not warnings designed to scare | P0 |
| FR-6.2.5 | The "What to Know" section SHALL contain a minimum of **2 genuine considerations** per destination — the system SHALL NOT present a destination as universally perfect | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-6.2.1 | "What to Know" content SHALL be factually accurate — sourced from the curated knowledge base. The system SHALL NOT fabricate safety concerns or accessibility issues | Data Integrity |
| NFR-6.2.2 | "Why You'll Love It" SHALL reference the specific user's stated preferences (not generic selling points). At least **2 of 3 points** must directly tie back to something the user said in conversation | Personalization |
| NFR-6.2.3 | Both sections together SHALL NOT exceed **300 words** — concise and scannable | Content Quality |

**Acceptance Criteria**:
- [ ] Every deep-dive contains both "Why You'll Love It" and "What to Know" sections
- [ ] "Why You'll Love It" is personalized to user's stated intent
- [ ] "What to Know" is personalized to user's context (family, solo, budget, etc.)
- [ ] Sources cited for factual claims
- [ ] Tone is honest but not alarmist
- [ ] Minimum 2 genuine considerations per destination in "What to Know"
- [ ] No hallucinated safety concerns or fabricated issues

---

### Epic 7: 💰 Customer Budget & Total Cost Intelligence

**Purpose**: Eliminate financial surprises and protect travelers from budget miscalculations by framing travel recommendations around **Total Trip Cost** (Transit + Ground), dynamic duration recommendations, and transparent secondary expense warnings.

**Discovery Traceability**:
- Pain Point: 🔴 Tab Explosion — users use 5+ tabs just to cross-reference flight vs hotel vs local costs
- Pain Point: 🔴 Trust Erosion — hidden fees and unexpected ground expenses break user trust
- JTBD 2: Single Source of Truth — single view combining destination appeal with realistic total financial impact
- Persona validation: Sarah (Dreamer) (*"Tell me my exact trip for my budget"*), Raj (Optimizer) (*"Show me cost logic"*), David & Priya (*"No hidden costs"*).

---

#### Feature 7.1: Total-Budget Duration Optimizer

**User Story**:
> **As a** budget-conscious traveler,  
> **I want** the AI to translate my total budget into recommended trip durations across different destinations,  
> **So that** I know exactly how many days I can afford in Rome vs. Portugal without doing complex math.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1.1 | When a user provides a total trip budget (e.g. "$2,000 total"), the system SHALL dynamically calculate recommended trip durations using the formula: `Affordable Ground Days = (Total Budget - Estimated Transit Cost) / Avg Daily Cost` | P0 |
| FR-7.1.2 | The AI SHALL explicitly present cost-to-duration trade-offs in conversational responses (e.g., *"With your $2,000 budget from NYC, you could do a 4-day boutique trip in Reykjavik (high flight, high daily cost) or stretch it to 10 comfortable days in Portugal (moderate flight, low daily cost)"*) | P0 |
| FR-7.1.3 | If a total budget is insufficient to cover estimated transit + minimum 3 days ground costs, the AI SHALL proactively suggest closer alternative regions or shorter trip lengths rather than returning invalid options | P0 |
| FR-7.1.4 | Ground cost estimates SHALL break down into realistic tiers: Budget ($), Mid-Range ($$), and Comfort ($$$) based on traveler context | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-7.1.1 | Transit cost estimations SHALL use a static Regional Transit Cost Matrix in the Layer 1 Knowledge Base (origin region → destination region pricing tiers) to maintain < 3s AI response latency without requiring live flight APIs | Performance |
| NFR-7.1.2 | Duration calculations SHALL account for seasonal price variances stored in Layer 1 destination metadata (e.g. peak vs shoulder season daily cost multiplier) | Data Quality |

**Acceptance Criteria**:
- [ ] AI translates total budget into recommended trip lengths per destination
- [ ] Transit costs estimated using origin region matrix
- [ ] Clear conversational presentation of trade-offs (shorter luxury vs longer budget stretch)
- [ ] Proactive warning if budget is too low for target destination

---

#### Feature 7.2: Transit vs. Ground Cost Split Indicator

**User Story**:
> **As a** traveler comparing destinations,  
> **I want to** immediately see whether a destination is expensive to get to or expensive to be in,  
> **So that** I don't waste time researching places where flights swallow my entire budget.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-7.2.1 | Destination Cards (Feature 4.1) and Comparison Views (Feature 4.3) SHALL display a visual cost split indicator showing transit cost severity vs. ground cost severity (e.g., `✈️ $$$ | 🏨 $` for remote affordable spots, `✈️ $ | 🏨 $$$` for close luxury spots) | P0 |
| FR-7.2.2 | The cost split indicator SHALL update based on the user's specified or inferred departure region | P0 |
| FR-7.2.3 | Hovering or tapping the cost split indicator SHALL display a micro-breakdown: Estimated Transit Tier + Estimated Daily Ground Range | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-7.2.1 | Cost split indicators SHALL render cleanly within destination cards without cluttering the mobile view (< 375px width) | UX Quality |
| NFR-7.2.2 | Visual indicator update on departure city change SHALL take < 100ms | Performance |

**Acceptance Criteria**:
- [ ] Visual split indicator (`✈️ $$$ | 🏨 $`) rendered on all destination cards
- [ ] Split indicator adapts to departure location
- [ ] Tap/hover displays micro-breakdown of transit vs daily costs

---

#### Feature 7.3: "Hidden Financial Burden" Warnings

**User Story**:
> **As a** budget-sensitive traveler,  
> **I want** the AI to warn me about unavoidable high secondary costs (taxis, tourist taxes, visa fees),  
> **So that** I am not caught off guard by hidden expenses after picking a destination.

**Functional Requirements**:

| ID | Requirement | Priority |
|---|---|---|
| FR-7.3.1 | The "What to Know" section in Destination Deep-Dives (Feature 6.2) SHALL include a mandatory **Financial Alert** when a destination has high mandatory secondary costs | P0 |
| FR-7.3.2 | Secondary cost alerts SHALL explicitly cover: mandatory tourist taxes ($/day), expensive airport transfers (e.g., *$120 taxi from airport with no public transit*), compulsory guide/permit fees, and mandatory visa-on-arrival costs | P0 |
| FR-7.3.3 | When a user expresses tight budget constraints, the AI SHALL prioritize destinations with low secondary transfer costs and transparent pricing | P0 |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-7.3.1 | Secondary cost alert data SHALL be verified and stored in Layer 1 Knowledge Base destination schemas | Data Integrity |
| NFR-7.3.2 | Alerts SHALL be concise (< 40 words per alert) and actionable | Usability |

**Acceptance Criteria**:
- [ ] Deep-dives highlight hidden secondary costs (taxes, transfers, visas) in "What to Know"
- [ ] AI prioritizes low-hidden-cost destinations for budget-constrained users
- [ ] Data grounded in Layer 1 Knowledge Base schema

---

## 9. Feature Requirements — Differentiators (P1)

> [!NOTE]
> P1 features are **Should Ship** — they differentiate Wandr from competitors and are targeted for Beta. They are not required for Alpha but are critical for a compelling public launch.

---

### Feature 1.2: Visual Mood Selector (Alternative Entry)

**User Story**:
> **As a** traveler who finds it hard to articulate what I want,  
> **I want to** tap on visual mood tiles that resonate with me,  
> **So that** I can express my travel vibe without needing the right words.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-1.2.1 | Grid of 8–12 mood tiles with evocative images + short labels (e.g., 🏔️ *"Wild & Untamed"*, 🍷 *"Culture & Cuisine"*, 🏖️ *"Sun & Stillness"*, 🎒 *"Off the Grid"*, 🌃 *"City Buzz"*, ❄️ *"Cozy & Cold"*, 🎨 *"Art & Soul"*, 🌿 *"Slow & Grounded"*, 🎉 *"Social & Alive"*, 👨‍👩‍👧‍👦 *"Family Adventure"*, 💑 *"Romantic Escape"*, 🧘 *"Reset & Recharge"*) |
| FR-1.2.2 | User can select 1–3 tiles (multi-select) |
| FR-1.2.3 | Tiles are visually rich with high-quality photography and subtle hover animations |
| FR-1.2.4 | Selection feeds directly into the conversational engine as structured intent |
| FR-1.2.5 | Can be combined with free-text input (e.g., select "Culture & Cuisine" + type "but on a budget") |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-1.2.1 | Mood tile images SHALL load within 1.5 seconds on 4G | Performance |
| NFR-1.2.2 | Tile grid SHALL be responsive — 3×4 on desktop, 2×6 on mobile | Responsiveness |
| NFR-1.2.3 | Tile selection SHALL provide instant visual feedback (< 100ms) | UX Quality |

---

### Feature 3.2: Travel Style Calibration

**User Story**:
> **As a** traveler with a particular travel personality,  
> **I want** the AI to calibrate to my style within a few exchanges,  
> **So that** I stop getting generic suggestions and start getting ones that feel like me.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-3.2.1 | AI detects travel style signals from conversation: budget language → adjusts price tier; adventure language → shifts toward active, off-grid options; comfort language → shifts toward boutique, curated experiences; food mentions → elevates culinary experiences |
| FR-3.2.2 | After 3+ exchanges, AI explicitly reflects back understanding: *"So you're looking for something adventurous but with good food, around $150/day, and you hate big tourist groups — am I reading you right?"* |
| FR-3.2.3 | User can confirm or correct the profile summary |
| FR-3.2.4 | Style calibration persists throughout the session |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-3.2.1 | Style detection SHALL achieve ≥ 85% accuracy on clear signals | Accuracy |
| NFR-3.2.2 | Profile reflection SHALL appear at most once per session and SHALL be dismissible | UX Quality |

---

### Feature 4.3: Side-by-Side Comparison

**User Story**:
> **As a** traveler narrowing down between 2–3 options,  
> **I want to** compare destinations side-by-side on dimensions I care about,  
> **So that** I can make a confident final decision without opening 10 tabs.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-4.3.1 | User can select 2–3 saved/liked destinations and trigger comparison view |
| FR-4.3.2 | Comparison table shows: visual side-by-side (hero images), budget comparison (avg daily cost), best season/weather at travel dates, travel time from user's location, vibe match score (how well it fits stated intent), key differentiators |
| FR-4.3.3 | AI provides a brief synthesis: *"If food is your priority, Puglia wins. If you want total isolation, the Azores edge it."* |
| FR-4.3.4 | Comparison is shareable as a link |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-4.3.1 | Comparison view SHALL render within 3 seconds | Performance |
| NFR-4.3.2 | Comparison layout SHALL work on both desktop (side-by-side) and mobile (stacked or swipeable) | Responsiveness |

---

### Feature 5.2: Intent Crystallization Detection

**User Story**:
> **As a** traveler whose intent starts vague and sharpens over time,  
> **I want** the AI to detect when my preferences have crystallized,  
> **So that** it shifts from broad exploration to deep support for my chosen direction.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-5.2.1 | AI detects crystallization signals: user asks detailed questions about one specific destination, user saves a destination and asks "tell me more", user explicitly narrows (*"I think I want to go to Portugal"*) |
| FR-5.2.2 | AI shifts tone from exploration to activation: *"It sounds like the Azores are calling you! Want me to go deeper?"* |
| FR-5.2.3 | Transition is smooth — no jarring mode switch |
| FR-5.2.4 | User can always return to exploration mode (*"Actually, show me more options"*) |

---

### Feature 5.3: Session Continuity (Return Within 48h)

**User Story**:
> **As a** traveler who needs time to think,  
> **I want to** come back within 48 hours and pick up where I left off,  
> **So that** I don't have to re-explain my preferences.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-5.3.1 | Sessions are persisted via a unique shareable URL (no authentication required) |
| FR-5.3.2 | Returning to the URL within 48 hours restores: full conversation history, saved destinations, learned preferences and context |
| FR-5.3.3 | AI greets returning users naturally: *"Welcome back! Last time you were excited about the Azores and Puglia. Want to pick up there?"* |
| FR-5.3.4 | Sessions expire after 48 hours (persistent profiles are V2) |
| FR-5.3.5 | User can explicitly start a new session at any time |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-5.3.1 | Session restoration SHALL complete within 3 seconds | Performance |
| NFR-5.3.2 | Session data SHALL be stored securely — URLs should be non-guessable (UUID-based) | Security |
| NFR-5.3.3 | Session storage SHALL support at least 10,000 concurrent active sessions | Scalability |

---

### Feature 6.3: Experience Highlights

**User Story**:
> **As a** traveler exploring a destination,  
> **I want to** see curated experience highlights (not a list of 100 things to do),  
> **So that** I get a feel for what my days might look like without being overwhelmed.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-6.3.1 | Deep-dive includes 5–8 curated experience highlights tailored to user's interests |
| FR-6.3.2 | Each highlight: title + 1-sentence description + category tag (food, nature, culture, adventure) |
| FR-6.3.3 | Highlights are contextualized (*"Since you mentioned food, don't miss..."*) |
| FR-6.3.4 | Mix of must-sees and hidden gems — not just top TripAdvisor attractions |
| FR-6.3.5 | AI explains why each experience was selected for THIS user |

---

### Feature 6.4: Share & Save Discovery

**User Story**:
> **As a** traveler excited about a destination,  
> **I want to** save it and share it with my travel partner,  
> **So that** we can discuss options and make a group decision.

**Functional Requirements**:

| ID | Requirement |
|---|---|
| FR-6.4.1 | "Save" button adds destination to session collection with deep-dive data |
| FR-6.4.2 | "Share" generates a unique link opening a read-only view of the deep-dive, personalized reasoning, and comparison view (if applicable) |
| FR-6.4.3 | Shared link works without login or app install |
| FR-6.4.4 | Share options: copy link, WhatsApp, iMessage, email |
| FR-6.4.5 | Shared view includes a CTA: *"Start your own Wandr discovery →"* |

**Non-Functional Requirements**:

| ID | Requirement | Category |
|---|---|---|
| NFR-6.4.1 | Shared links SHALL load within 3 seconds | Performance |
| NFR-6.4.2 | Shared content SHALL render correctly without JavaScript enabled (basic server-side rendering fallback) | Accessibility |
| NFR-6.4.3 | Share link generation SHALL take < 1 second | Performance |

---

## 10. Non-Functional Requirements (Cross-Cutting)

These requirements apply across the entire Wandr V1 platform.

### 10.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-P1 | Landing page load time (first contentful paint) | < 2 seconds on 4G |
| NFR-P2 | Initial AI discovery response (from submission to first visible token) | < 5 seconds |
| NFR-P3 | Follow-up AI responses | < 3 seconds |
| NFR-P4 | Deep-dive content load (text) | < 3 seconds |
| NFR-P5 | Image load (destination cards) | < 2 seconds with lazy-loading placeholders |
| NFR-P6 | UI interaction feedback (taps, clicks, reactions) | < 100ms |
| NFR-P7 | AI response delivery | Streaming (token-by-token) for perceived speed |

### 10.2 Scalability

| ID | Requirement | Target |
|---|---|---|
| NFR-S1 | Concurrent active sessions | ≥ 10,000 for Beta launch |
| NFR-S2 | Concurrent AI conversations | ≥ 1,000 simultaneous |
| NFR-S3 | Session state storage | 48-hour retention with automatic cleanup |
| NFR-S4 | Destination knowledge base | ≥ 50 destinations for Alpha, ≥ 200 for Beta |

### 10.3 Reliability

| ID | Requirement | Target |
|---|---|---|
| NFR-R1 | System uptime | 99.5% (Beta), 99.9% (GA) |
| NFR-R2 | Data persistence | Session data survives server restarts and deployments |
| NFR-R3 | Graceful degradation | If AI service is unavailable, show cached/static destination content with an apology message |
| NFR-R4 | Error handling | All errors display user-friendly messages — no stack traces, no raw error codes |

### 10.4 Security & Privacy

| ID | Requirement | Target |
|---|---|---|
| NFR-SEC1 | Data in transit | HTTPS everywhere (TLS 1.2+) |
| NFR-SEC2 | Session URLs | Non-guessable UUID-based identifiers |
| NFR-SEC3 | Personal data retention | V1 collects no PII beyond conversation content. Session data deleted after 48-hour expiry |
| NFR-SEC4 | AI content filtering | Conversations filtered for abusive, harmful, or off-topic content |
| NFR-SEC5 | GDPR readiness | Minimal data collection; no persistent user tracking in V1 |

### 10.5 Accessibility

| ID | Requirement | Target |
|---|---|---|
| NFR-A1 | WCAG compliance | Level AA (WCAG 2.1) |
| NFR-A2 | Keyboard navigation | All interactive elements accessible via keyboard |
| NFR-A3 | Screen reader support | All cards, buttons, and interactive elements have ARIA labels |
| NFR-A4 | Color contrast | Minimum 4.5:1 ratio for text |
| NFR-A5 | Motion sensitivity | Respect `prefers-reduced-motion` for animations |

### 10.6 Responsiveness

| ID | Requirement | Target |
|---|---|---|
| NFR-RES1 | Mobile breakpoint | 375px (iPhone SE) minimum |
| NFR-RES2 | Tablet breakpoint | 768px |
| NFR-RES3 | Desktop breakpoint | 1280px+ |
| NFR-RES4 | Touch targets | Minimum 44×44px on mobile |

### 10.7 Data Quality & AI Grounding

| ID | Requirement | Target |
|---|---|---|
| NFR-DQ1 | Hallucination prevention | Zero tolerance for fabricated destinations, invented facts, or hallucinated logistics (opening hours, transit times, visa requirements) |
| NFR-DQ2 | Source grounding | All factual claims SHALL be traceable to the curated knowledge base (Layer 1) or cited community sources (Layer 3) |
| NFR-DQ3 | Uncertainty acknowledgment | AI SHALL explicitly flag low-confidence information rather than presenting it as fact |
| NFR-DQ4 | Stale data handling | Content older than 6 months SHALL include a freshness disclaimer: *"This info may have changed — verify before booking"* |
| NFR-DQ5 | Knowledge base coverage | Each destination in the knowledge base SHALL have verified data for: location, region, best time to visit, budget ranges, visa requirements, key experiences, honest pros and cons, mandatory secondary fees (tourist tax, transfer costs), and Regional Transit Cost Tier mappings (origin region → transit price tier) |

---

## 11. Success Metrics

### 11.1 Primary Metrics (V1 KPIs)

| Metric | Target | Why It Matters |
|---|---|---|
| **Session Depth** | Avg ≥ 6 messages per session | Users are engaged, not bouncing after first response |
| **Destination Saves** | ≥ 40% of sessions result in ≥ 1 save | Users found something they're genuinely excited about |
| **Return Rate** | ≥ 25% of users return within 7 days | Discovery experience is sticky |
| **Share Rate** | ≥ 15% of sessions result in a shared link | Word-of-mouth growth engine |
| **Session Completion** | ≥ 60% reach a destination deep-dive | Users make it through the full discovery funnel |
| **NPS** | ≥ 50 | Users love the experience enough to recommend it |

### 11.2 Anti-Metrics (What NOT to Optimize For)

| Anti-Metric | Why We Avoid It |
|---|---|
| **Booking conversion rate** | V1 doesn't include booking — optimizing for this would compromise discovery quality |
| **Time on site** | Longer isn't necessarily better — a quick, decisive session is also a success |
| **Number of destinations shown** | We're a curator, not a search engine — showing fewer, better options is the goal |

### 11.3 Guardrail Metrics

| Metric | Threshold | Action If Breached |
|---|---|---|
| **Bounce rate** (leave after 1 message) | ≤ 30% | Investigate landing page and first-response quality |
| **AI error/fallback rate** | ≤ 5% | Investigate AI service reliability |
| **Hallucination reports** (user-flagged) | ≤ 2% of sessions | Urgent investigation; tighten grounding |

---

## 12. Open Decisions & Risks

### 12.1 Open Decisions

> [!WARNING]
> The following decisions are **explicitly unresolved** and must be aligned on before Beta/GA.

#### ⚠️ OD-1: Monetization Model

**Status**: Deferred — decide before Beta launch

| Model | Pros | Cons |
|---|---|---|
| Per-trip curation fee ($20–30) | Aligns with Dreamer WTP; no subscription friction | Hard to sustain; low LTV |
| Annual subscription ($50–100/yr) | Predictable revenue; aligns with Optimizer & Family WTP | Requires high perceived value upfront |
| Affiliate commissions | No user cost; scalable | Requires booking integration (V2); perception risk |
| Freemium + Pro | Broad top of funnel; upsell premium features | Requires clear feature differentiation |
| Hybrid (Freemium + Affiliate) | Best of both worlds | Complex to implement early |

**Working Assumption**: Freemium for V1 (no paywall, establish user base) with affiliate as primary V2 monetization. Flagged for business review.

---

#### ⚠️ OD-2: AI Architecture

**Status**: Deferred — decide during technical architecture sprint

**Options**:
- **Single LLM + RAG**: One conversational model grounded via retrieval-augmented generation. Simpler, faster to build.
- **Multi-agent system**: Specialized agents (Mood Interpreter → Destination Recommender → Logistics Validator → Personalization Agent). More accurate, more complex.

**Guidance**: PRD specifies **functional requirements** (response time, grounding quality, reasoning transparency) without mandating architecture. The technical architecture sprint will decide.

---

#### ⚠️ OD-3: Community/Peer-to-Peer Layer

**Status**: Deferred to V2+

**V1 Approach**: Surface community sentiment signals passively (via aggregated Reddit/review data) without building a community feature.

**V2 Opportunity**: User-generated travel notes, destination reviews in Wandr's own ecosystem.

---

#### ⚠️ OD-4: Cold Start Experience

**Status**: Needs UX validation in Alpha

**Working Hypothesis**: Mood-first entry (Features 1.1 + 1.2) solves the cold start problem — the user tells us everything we need in the first message. Validate with Alpha testing.

---

#### ⚠️ OD-5: Content Moderation & Accuracy Policy

**Status**: Needs legal/policy review

**Challenge**: Wandr makes destination recommendations with factual claims (safety, accessibility, costs). What is the liability stance if information is incorrect?

**Recommendation**: Include disclaimers on all deep-dive content. Add user-facing feedback mechanism for reporting inaccuracies. Seek legal review on liability before GA.

---

### 12.2 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI hallucination of logistics** | High (without mitigation) | Critical — directly violates core differentiator | Strict grounding via curated knowledge base; factual claims only from verified sources; uncertainty acknowledgment policy |
| **Cold start feels generic** | Medium | High — first impression determines retention | Mood-first entry captures strong signal from first message; rotate diverse example prompts; A/B test cold start flows in Alpha |
| **Knowledge base coverage too thin** | Medium | High — limits destination diversity | Start with 50 well-curated destinations for Alpha; expand to 200+ for Beta; prioritize depth over breadth |
| **Response latency too high** | Medium | Medium — degrades perceived quality | Streaming responses; pre-cached destination data; performance budget of 5s for initial, 3s for follow-ups |
| **Competitor leapfrogs** (Layla, Stardrift) | Medium | Medium — market timing pressure | Focus on trust/transparency moat (no one else does honest pros/cons); build data moat via curated knowledge base |
| **User privacy concerns** | Low | High — trust is core brand promise | Minimal data collection; no PII; 48-hour auto-deletion; transparent privacy policy |

---

## 13. Release Phases

| Phase | Scope | Goal | Timeline Trigger |
|---|---|---|---|
| **Alpha** (Internal) | P0 features only; 50 curated destinations | Validate core discovery loop works end-to-end | Engineering completes P0 feature set |
| **Beta** (Invite-only) | P0 + P1 features; 200+ destinations | Validate with real travelers; measure metrics; 500 users Month 1, 5,000 by Month 3 | Alpha validation passes; P1 features ready |
| **GA** (Public launch) | All P0 + P1 + select P2 polish | Public launch with waitlist conversion | Beta metrics meet targets; open decisions resolved |

### Alpha → Beta Graduation Criteria

| Criterion | Target |
|---|---|
| Core discovery loop completion rate (mood → deep-dive) | ≥ 50% of test sessions |
| AI hallucination rate (flagged by internal QA) | ≤ 3% of factual claims |
| Average response latency (initial discovery) | ≤ 5 seconds |
| Session depth (messages per session) | ≥ 4 |
| Internal NPS | ≥ 40 |

### Beta → GA Graduation Criteria

| Criterion | Target |
|---|---|
| Session completion rate (reaching deep-dive) | ≥ 60% |
| Destination save rate | ≥ 40% |
| User NPS | ≥ 50 |
| Hallucination report rate | ≤ 2% |
| Return rate (7-day) | ≥ 25% |
| Share rate | ≥ 15% |
| Monetization model decision | Locked and documented |

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Traveler DNA** | The persistent model of a user's travel preferences, style, constraints, and life context — built up over sessions (V2 feature; in V1, approximated per-session) |
| **Intent Crystallization** | The moment when a traveler's vague interest in "somewhere" sharpens into genuine interest in a specific destination |
| **Mood-to-Map Pipeline** | Wandr's core UX flow: mood input → AI discovery → visual destination cards → deep-dive → share/save |
| **Logistics Chasm** | The gap between travel inspiration and actual booking where most travelers drop off due to complexity |
| **Tab Explosion** | The behavior of opening 20–30 browser tabs to research a single trip — a key pain point V1 addresses |
| **Hybrid Grounding** | Wandr's data strategy: curated knowledge base + real-time APIs + community sentiment signals |
| **Cold Start** | The challenge of delivering a great first experience before Wandr has any data about a new user |
| **Session** | A single discovery conversation, persisted via URL for up to 48 hours (V1) |
| **Destination Card** | A visual, interactive card presenting a destination suggestion with hero image, vibe tag, match reason, and quick stats |
| **Deep-Dive** | An expanded, detailed view of a single destination with comprehensive information, honest pros/cons, and experience highlights |
| **Curated Knowledge Base** | An editorially maintained database of destination information — the primary grounding source for V1 |
| **Total-Budget Duration Optimizer** | Feature that calculates affordable trip days based on `(Total Budget - Transit Cost) / Daily Cost` |
| **Transit vs. Ground Cost Split** | Visual badge (`✈️ $$$ | 🏨 $`) showing relative cost of getting to a destination vs. staying there |
| **Regional Transit Cost Matrix** | Layer 1 knowledge base schema mapping origin-destination region pairs to transit cost tiers ($ to $$$$) without needing live flight APIs |

---

## Appendix A: Competitive Landscape Summary

### Direct Competitors (AI-Native Travel)

| Competitor | Approach | Where They Win | Where They Fail |
|---|---|---|---|
| **Layla AI** | Chat-first, video inspiration | Handles fuzzy requests; eliminates tab-juggling | Weak on complex multi-city logistics |
| **Trip Planner AI / Wanderlog** | Dashboard-driven, maps, drag-drop | Excellent for complex trips; collaborative | High friction entry; steep learning curve |
| **GuideGeek** | Messaging (WhatsApp/IG/Messenger) | Zero friction; great for in-the-moment | No persistent itineraries; poor offline |
| **Stardrift** | Hyper-personalized, memory-based | Integrates life constraints and calendar | Early stage; limited market presence |

### Indirect Competitors (Traditional Platforms)

| Platform | Where They Win | Where They Fail |
|---|---|---|
| **Google Travel** | Convenience, Gmail sync | Zero inspiration; redirect-only booking |
| **TripAdvisor** | Vast photo database | Fake reviews; clunky UX; trust erosion |
| **Booking.com** | Straightforward booking | AI chatbot black hole; urgency dark patterns |

### Wandr's Competitive Position

Wandr occupies the **Conversational + Inspirational** whitespace. No competitor starts with mood, evolves with intent, grounds in real data, AND presents honest pros/cons.

| Dimension | Existing Tools | Wandr |
|---|---|---|
| Entry point | "Where do you want to go?" | "What kind of experience are you craving?" |
| Understanding | Keywords and filters | Intent, mood, life stage, and context |
| Memory | Stateless / per-session | Evolving within session; 48h continuity |
| Discovery | Reactive (search → results) | Proactive (AI surfaces unexpected options) |
| Trust | Black-box recommendations | Transparent reasoning with citations |
| Output | Lists to wade through | Curated, opinionated recommendations with rationale |
| Honesty | Marketing-driven | Honest pros AND cons |

---

## Appendix B: Discovery Research Summary

### Research Streams

| Stream | Key Finding |
|---|---|
| **Competitive Landscape** | Market splits into "quick chat AI" vs. "complex dashboard planners" — nobody owns inspiration-to-action |
| **App Review Sentiment** | Top frustrations: fake reviews, AI hallucinations, third-party handoff friction, logistics failures |
| **Market & Trends** | $1.27B generative AI travel market; social-first discovery and "mood over destination" as dominant shifts |
| **Persona Interviews** | All 4 personas suffer from tab explosion and logistics chasm — everyone drops off between dreaming and booking |

### Top 10 Unmet Needs (From App Reviews)

| # | Unmet Need | Wandr's Response |
|---|---|---|
| 1 | Unified accountability when bookings go wrong | V2: Curated, vetted partner network |
| 2 | Upfront, transparent pricing | V1: Budget guides in deep-dives with realistic ranges |
| 3 | Anti-algorithmic discovery (bypass tourist traps) | V1: Mood-first + AI surfacing hidden gems |
| 4 | Logistics-aware AI (respects physics) | V1: Grounded in curated data; honest "What to Know" |
| 5 | One-tap emergency human support | V2+: Major trust builder |
| 6 | Seamless discovery-to-booking | V2: Full booking integration |
| 7 | Anxiety-free real-time alerts | V2: Verified data sources only |
| 8 | Trustworthy reviews (can't be gamed) | V1: Community sentiment + AI verification |
| 9 | High-performance itinerary engine | V2: Engineering investment |
| 10 | Peer-to-peer knowledge | V2+: Community layer |

### Cross-Persona Universal Pain Points

| Pain Point | All 4 Personas? | V1 Solution |
|---|---|---|
| 🔴 Tab Explosion | ✅ Yes | Conversational discovery consolidates into one view |
| 🔴 Logistics Chasm | ✅ Yes | Mood-first entry bypasses "where exactly?" friction |
| 🔴 Trust Erosion | ✅ Yes | Transparent reasoning, honest pros/cons, cited sources |
| 🟡 One-Size-Fits-All | ✅ 3 of 4 | Life context detection + travel style calibration |

---

> **Document Control**
>
> | Version | Date | Author | Changes |
> |---|---|---|---|
> | 1.0 | August 3, 2026 | Product Team | Initial PRD based on completed product discovery |
>
> **Next Steps**:
> 1. Engineering review of functional and non-functional requirements
> 2. Technical architecture sprint (resolve OD-2: AI Architecture)
> 3. UX wireframing based on design principles and user stories
> 4. Knowledge base schema design and initial population (50 destinations)
> 5. Legal review of content accuracy policy (OD-5)
