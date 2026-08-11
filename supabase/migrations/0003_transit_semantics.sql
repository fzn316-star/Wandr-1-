-- Column semantics for transit_routes.
--
-- The shipped frontend cost engine (src/lib/transitMatrix.ts → estimateTransitCostINR)
-- returns a ROUND-TRIP per-person figure. If this table stored one-way costs, the
-- server-side port of that function would silently halve every transit estimate —
-- or, worse, a later caller would double an already-round-trip number. The asymmetry
-- with duration_hours is deliberate and matches how people actually talk about a
-- route ("Delhi–Goa is a 2.5 hour flight", not 5 hours round trip), so it is
-- recorded here rather than left to be rediscovered.

comment on column transit_routes.typical_cost_inr is
  'ROUND-TRIP, per person, typical non-peak fare in INR. Matches the semantics of '
  'estimateTransitCostINR() in src/lib/transitMatrix.ts. Do not double this value.';

comment on column transit_routes.duration_hours is
  'ONE-WAY door-to-door hours, including any surface transfer leg.';

comment on column transit_routes.is_estimate is
  'true = generated from origin/zone fare bands. false = owner-verified against a '
  'real fare. Drives whether the UI may present the number as verified.';

comment on column destinations.transit_hours is
  'ONE-WAY door-to-door hours from a major metro, origin-agnostic. Origin-specific '
  'timings live in transit_routes.duration_hours.';
