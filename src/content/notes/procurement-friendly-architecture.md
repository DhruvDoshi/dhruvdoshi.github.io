---
title: "Procurement-friendly architecture: build systems that survive the RFP"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Public sector
categories: [Public Sector, Architecture, Procurement]
---

In the private sector, architecture serves the product. In the public sector, architecture also serves the procurement — because every significant system will be bought, built, or operated through a competitive process with rules you don't control. An architecture that can't be described in a statement of work, evaluated against criteria, split across vendors, or re-procured in five years isn't just inconvenient — it's unbuyable. Procurement-friendly architecture is the discipline of designing systems that survive contact with the RFP process: modular enough to compete, standard enough to evaluate, and open enough to escape.

## Why procurement shapes architecture (whether you plan for it or not)

**Every component will be procured — possibly by someone who wasn't in the room.** The architect designs; the procurement officer buys. If the architecture requires a specific vendor's proprietary product, the procurement either becomes sole-source (with all the justification burden that carries) or fails outright. Architects who don't think about procurability produce designs that die in the contracting office — not because they're bad designs, but because they're unbuyable designs.

**The RFP evaluates what it can describe.** Evaluation criteria need observable, comparable attributes: standards compliance, API specifications, performance benchmarks, security certifications. An architecture built on vague qualities ("best-in-class synergy," "AI-powered") can't be evaluated fairly — which means it can't be procured fairly, which means the procurement gets challenged. Precise, standard, measurable architectural choices aren't just good engineering; they're what make competitive evaluation possible.

**Re-procurement is certain; lock-in is a choice.** Government systems live for decades; vendor contracts live for years. Every system you build will be re-procured — new RFP, new competition, possibly a new vendor. Architecture that assumes the current vendor forever is planning for a future that won't happen. The question isn't whether you'll switch vendors; it's whether switching will be a migration or a rebuild.

Verdict: treat "can this be fairly procured, and can it be re-procured?" as architectural requirements with the same weight as scalability or security. They're not paperwork concerns — they're design constraints.

## Modularity: the architecture of competitive bidding

**Module boundaries are bid boundaries.** In a competitive procurement, each lot (or the whole contract) needs a scope that a vendor can price, staff, and deliver. If your architecture is a monolith with tangled dependencies, the only bidders who can price it are the incumbent (who knows where the bodies are buried) and the reckless (who don't). Clean module boundaries with defined interfaces let multiple vendors bid credibly — which is the entire point of competition.

**Design modules around replaceability, not just responsibility.** Standard modularity advice says: high cohesion, low coupling, single responsibility. Procurement-friendly modularity adds: each module should be replaceable without replacing its neighbors. That means the interfaces between modules are *contracts* — versioned, documented, tested — not implementation details. A module whose replacement requires changing three other modules isn't really a module; it's a distributed monolith wearing a microservices costume, and it will be procured as a monolith (by whoever already owns it).

**Size modules for the vendor market.** Too small, and no vendor will bid on a contract that can't sustain a team ("maintain this one API for three years" gets no credible bids). Too large, and only the giant integrators can bid, killing competition. The right module size sustains a small, skilled team for the contract duration — typically a bounded context or a coherent capability, not a single function and not the entire platform. This is Conway's law applied to procurement: the architecture should mirror the shape of contracts the market can actually fulfill.

```
  ┌─────────────────────────────────────────────────────┐
  │                  Integration layer                   │
  │         (government-owned or prime contract)         │
  └──────┬──────────────┬──────────────┬────────────────┘
         │ API contract │ API contract │ API contract
  ┌──────▼──────┐ ┌────▼────────┐ ┌────▼────────┐
  │  Citizen     │ │  Case        │ │  Payments   │
  │  portal      │ │  management  │ │  processing │
  │  (Vendor A)  │ │  (Vendor B)  │ │  (Vendor C) │
  └─────────────┘ └─────────────┘ └─────────────┘
         │              │               │
    versioned, documented, tested interfaces — each module
    independently re-procurable
```

**The integration layer is the government's leverage.** Whoever owns the integration layer — the API gateway, the event backbone, the identity fabric — controls the system's seams. If a vendor owns it, the vendor controls who can replace whom. The strategic move is for the government (or a tightly-controlled prime) to own the integration layer, with vendors building modules behind standard interfaces. This is the architectural expression of "never outsource your leverage."

Rule of thumb: if you can't draw the module boundaries on a whiteboard and assign each one to a hypothetical different vendor without arguments, the boundaries aren't real.

## Open standards: the language of fair competition

**Standards are how you specify without naming a vendor.** "Must support OpenAPI 3.x for all service interfaces" is procurable and evaluable. "Must work like [vendor's product]" is a sole-source justification waiting to be challenged. Every architectural choice expressed as an open standard is a choice that multiple vendors can meet; every choice expressed as a product feature is a choice that narrows the field to those who sell that product.

**Standardize the seams, not the internals.** You don't need to dictate what database a vendor uses internally — you need to dictate the interface the module exposes, the data format it exchanges, the authentication protocol it speaks, the observability signals it emits. Standardize at the boundaries; let vendors compete on implementation. This preserves competition (multiple implementations can meet the interface) while keeping the system's integrity (the interfaces are non-negotiable).

**The standards that matter most for procurability:**

- **API specifications:** OpenAPI/AsyncAPI for service contracts — machine-readable, testable, vendor-neutral.
- **Identity:** OpenID Connect, SAML, OAuth 2.0 — so the identity provider can be swapped without reworking every module.
- **Data formats:** open formats (JSON, Parquet, CSV where appropriate) with published schemas — so data isn't held hostage in proprietary structures.
- **Observability:** OpenTelemetry for traces, metrics, logs — so monitoring isn't tied to the vendor's proprietary agent.
- **Infrastructure:** OCI containers, standard Kubernetes APIs — so workloads move between platforms.
- **Accessibility:** WCAG 2.1 AA — legally required and independently testable.

**Beware "open-washing."** Vendors will claim openness while the reality is proprietary: an "open API" with no published spec, "standard" data exports that lose fidelity, open-source components wrapped in proprietary management layers. Evaluate openness empirically: can a competent third party actually implement against the interface without the vendor's help? If not, it's marketing, not architecture.

Verdict: every proprietary interface in the architecture is a future sole-source procurement. Count them, justify each one in writing, and have an exit plan for all of them.

## Data: the asset you must never lose control of

**Data outlives every vendor, every contract, every system.** The architecture's most important procurement property is data portability: at any point, the government must be able to extract all of its data — complete, in usable formats, with its relationships intact — without the current vendor's cooperation. This isn't a contract clause (though it should be one); it's an architectural property that must be designed and tested.

**Design the data layer for extraction.** This means: data stored in open formats in systems the government controls (or can take control of); published data dictionaries and schemas; regular extraction rehearsals — actually pulling the full dataset and verifying its completeness, not just asserting it's possible. The extraction rehearsal is the data equivalent of a fire drill: the first time you try it shouldn't be during a vendor dispute.

**Separate data from application logic.** When business rules live in the database as stored procedures, or when the data model is inseparable from the vendor's application, extraction gives you data you can't interpret. Keep the data model clean and documented independently of any application's implementation. The government's data is an asset with a decades-long life; the application is a tenant with a years-long contract.

**Event streams as the portability mechanism.** An event-sourced or event-carrying architecture has a natural portability property: the stream of business events *is* the system's history, and any new vendor can rebuild state by replaying it. Even without full event sourcing, publishing domain events to a government-owned event backbone means the data flows through infrastructure the government controls — which makes vendor transitions a matter of pointing the new system at the existing stream.

Rule of thumb: if extracting your data requires the vendor's professional services team, you don't own your data — you're renting it.

## Licensing traps: read the pricing model as architecture

**The license model is an architectural constraint.** Per-seat pricing penalizes broad access (bad for citizen services). Consumption pricing penalizes success (the better the service works, the more it costs — budget accordingly). Data-egress fees penalize portability (and should be treated as a lock-in mechanism, not a cost). Audit the pricing model the way you'd audit a technical dependency — because it shapes behavior just as strongly.

**Negotiate the exit before the entry.** The contract should specify: data extraction format and timeline, transition assistance obligations, license rights during transition (can you run the old system in parallel while migrating?), and what happens to customizations (who owns the code the vendor wrote for you?). These terms are cheapest to negotiate before signing and most expensive to negotiate during a dispute. The architecture should assume these terms exist — and flag it loudly when they don't.

**Open source as a negotiating position.** You don't have to use open source everywhere, but having credible open-source alternatives for each proprietary component changes the negotiation dynamic entirely. "We can replace this with the open-source equivalent in six months" — true or not — is worth more at the negotiating table than any amount of goodwill. Architecturally, this means preferring components with viable open-source alternatives, and keeping the proprietary surface area small and well-bounded.

Verdict: the total cost of a vendor relationship is the license cost plus the switching cost. Architectures that minimize switching cost make every license negotiation cheaper.

## The statement of work: architecture as a buying document

**The architecture must be describable in a statement of work.** This is the practical test: can you write a SOW that tells a vendor what to build, how it connects to everything else, how you'll know it's done, and what "done" is worth? If the architecture can't survive translation into procurement language, it's not ready — the vagueness will become change orders, and change orders will become budget overruns.

**Acceptance criteria are architectural.** "The module exposes all interfaces per the OpenAPI spec, passes the contract test suite, handles the defined load profile, meets WCAG 2.1 AA, and operates within the defined error budget" — these are architecture decisions expressed as acceptance criteria. Writing them forces precision: an architecture with vague acceptance criteria is a design that nobody's willing to be accountable for. The discipline of writing acceptance criteria *during* architecture (not after procurement) catches the hand-waving early.

**Define "done" for integration, not just for modules.** Every vendor can deliver their module; the failures happen at the seams. The SOW needs integration acceptance criteria: end-to-end journeys working across vendor boundaries, data flowing correctly through the event backbone, incident response working when the fault spans two vendors' scopes. Integration testing across vendor boundaries should be a named deliverable with its own acceptance gate — not something everyone assumes someone else is doing.

**Contract test suites as shared artifacts.** The government (or the integration owner) maintains the contract test suite for every interface. Vendors run it; it gates their acceptance. This inverts the usual dynamic — instead of each vendor defining "working" for their component, the interface owner defines it for everyone. It's also the mechanism that makes vendor replacement practical: the new vendor's first milestone is passing the existing contract suite.

```python
# contract test sketch — owned by the integration layer, run by every vendor
def test_case_management_contract(vendor_impl):
    # Interface compliance
    assert vendor_impl.openapi_spec_validates_against("case-api/v2.yaml")
    # Behavioral contract
    case = vendor_impl.create_case(valid_case_payload)
    assert vendor_impl.get_case(case.id) == case
    assert vendor_impl.transition(case.id, "SUBMITTED").status == "SUBMITTED"
    # Failure contract
    with pytest.raises(NotFoundError):
        vendor_impl.get_case("nonexistent-id")
    # Non-functional contract
    assert vendor_impl.p99_latency("get_case") < 200  # ms
    assert vendor_impl.supports_idempotency_key("create_case")
```

## Designing for the evaluation: make the good choice the winning choice

**Evaluation criteria reward what they can measure.** If the RFP evaluates on "innovative AI capabilities" (vague), the winner is whoever writes the best marketing. If it evaluates on "p99 inference latency under 500ms on the defined workload, measured by the government's test harness" (precise), the winner is whoever engineers best. Architects influence procurement outcomes by helping write *evaluable* criteria — precise, measurable, tied to real requirements. This is legitimate: it's making the procurement select for actual quality.

**Reference architectures beat reference products.** Instead of "the solution should be like [product]," publish a reference architecture: the module boundaries, the interface standards, the non-functional requirements, the operational expectations. Vendors propose implementations *against* the reference architecture. This keeps the competition about engineering quality rather than product familiarity — and it means the government's architecture survpends vendor turnover.

**Weight operability in evaluation.** RFPs overweight features and underweight operability — because features are easy to demo and operability is hard to evaluate. Push for evaluated criteria on: mean time to recovery, deployment frequency capability, observability completeness, runbook quality, and the vendor's track record operating (not just building) similar systems. The system will be operated for a decade; the demo lasted an hour. The evaluation should reflect that ratio.

## The exit plan: architecture's final exam

**Every architecture needs a documented exit plan.** For each vendor dependency: how would we replace this? What's the estimated effort? What are the prerequisites (data extraction tested? contract suite current? replacement identified?)? The exit plan isn't pessimism — it's the document that makes the *current* relationship healthy, because a vendor who knows you can leave negotiates differently than one who knows you can't.

**Test the exit plan, don't just write it.** The data extraction rehearsal, the contract-suite currency check, the periodic market scan for alternatives — these are maintenance activities, not one-time documents. An exit plan written in year one and never revisited is fiction by year three. Schedule the rehearsals; report on them; treat a failed rehearsal as a finding, not an embarrassment.

**The ultimate test: could a new vendor take over in 12 months?** Not "could we re-procure" (that's process) but "could a competent new vendor actually assume operation within a year?" If the answer is no — because the knowledge is all with the incumbent, the interfaces are undocumented, the data can't be extracted — then the architecture has failed its most important procurement test, regardless of how elegant it is.

Verdict: an architecture without a credible exit plan isn't a design — it's a hostage situation with diagrams.

## Anti-patterns

**The incumbent's architecture.** Letting the current vendor design the target architecture for the re-procurement. They'll design something only they can build — not from malice, usually, but because people design what they know. The target architecture must be vendor-neutral, designed by or for the government, before any procurement begins.

**Specs written from a product datasheet.** RFP requirements copied from a vendor's feature list — sometimes down to the trademarked feature names. This is either laziness or corruption, and evaluators (and challengers) can tell. Requirements describe outcomes and interfaces; never products.

**Ignoring the challenge mechanism.** Losing bidders can challenge procurements — and they do, especially when the requirements smell like they were written for the winner. Every proprietary requirement, every suspiciously specific criterion, is a challenge waiting to happen. Design the procurement to survive scrutiny: if you can't defend a requirement to a losing bidder's lawyer, it shouldn't be in the RFP.

**Architecture by procurement timeline.** Letting the procurement schedule dictate architectural decisions — "we need to buy the database now, so we'll design around whatever we buy." Sometimes unavoidable, but every decision made for schedule reasons should be flagged as provisional and revisited. Otherwise the procurement tail wags the architecture dog permanently.

## Closing

Procurement-friendly architecture isn't about dumbing designs down for bureaucrats — it's about designing systems with the full lifecycle in view: competitive acquisition, multi-vendor operation, and eventual replacement. Modular boundaries that map to biddable contracts, open standards at every seam, data you can actually extract, license models you've read as carefully as code, acceptance criteria written during design, and an exit plan you've actually rehearsed. The RFP process doesn't have to be the enemy of good architecture. But it will be, unless the architecture was designed with the RFP in mind from the start.
