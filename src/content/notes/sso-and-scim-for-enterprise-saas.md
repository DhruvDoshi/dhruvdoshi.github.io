---
title: "SSO and SCIM: the enterprise identity lifecycle nobody designs for"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Identity
categories: [Identity, Security, Enterprise]
---

Enterprise buyers ask for SSO on the first sales call, and most engineering teams treat it as the whole identity problem. SSO is sign-in — a single arrow pointing into your application. The identity lifecycle is a loop: users get created, change teams, change roles, go on leave, and eventually leave. Nobody designs for the loop. SSO handles the "in"; nothing handles the "out" unless you build SCIM provisioning, and the teams that skip it discover the gap during a security review, usually phrased as a question nobody can answer: "show me that every deactivated employee lost access to your app the same day."

## SSO is authentication; SCIM is the lifecycle

SSO answers "is this person who they claim to be?" once, at login time. That is all it answers. It does not tell your application that someone was hired yesterday, moved from sales to engineering, or was terminated at 4 PM. Without provisioning, your app learns these facts the way every app learned them in 2005: someone files a ticket, an admin clicks through a UI, and eventually — hopefully — the account state reflects reality.

**Just-in-time provisioning is not lifecycle management.** JIT creates the user on first login, which handles onboarding adequately. It handles nothing else. The person who is terminated never logs in again, so JIT never learns about their termination. The account sits active forever, which is precisely the finding that fails audits. JIT is a convenience feature for sign-up; presenting it as provisioning is how dormant accounts accumulate.

**SCIM closes the loop.** System for Cross-domain Identity Management (SCIM 2.0) is the standard protocol where the customer's identity provider pushes user and group changes to your application: create on hire, update on role change, deactivate on termination. Your app exposes a SCIM endpoint; the IdP (Okta, Entra ID, Google Workspace, and others) calls it as the system of record changes. When done right, access follows employment automatically — the security posture enterprise buyers actually mean when they say "we need SSO."

Verdict: sell SSO, but ship SCIM. SSO gets you through the door; SCIM is what keeps you out of the audit finding.

## SAML vs OIDC: pick one, support it well

For SSO itself, the two protocols that matter are SAML 2.0 and OpenID Connect. SAML is the enterprise incumbent — XML assertions, metadata exchange, deeply supported by every enterprise IdP. OIDC is the modern standard — JSON, JWTs, simpler integration, built on OAuth 2.0. Practically every enterprise buyer supports both.

**Default to OIDC for new implementations.** It is simpler to implement correctly, easier to debug (JWTs are inspectable; SAML assertions require XML tooling and patience), and its session and token model maps cleanly onto modern API architectures. Support SAML because large enterprises will ask for it — some have standardized their entire IdP fleet on SAML and will not make an exception — but build OIDC first.

**Multi-tenant SSO is the actual engineering problem.** Single-tenant SSO (one IdP for your whole app) is a weekend project. Enterprise SaaS needs per-customer IdP configuration: customer A's Okta, customer B's Entra ID, each with its own entity IDs, certificates, attribute mappings, and callback URLs. This means an IdP configuration model per tenant, isolated key material per tenant, and a login flow that routes to the right IdP — usually by email domain or an organization picker. The protocol is the easy part; tenant-routed configuration is where the work is.

**Test with real IdPs, not just your code.** Every IdP deviates slightly: attribute naming, NameID formats, clock skew tolerance, certificate rollover behavior. Maintain test tenants in the major IdPs and run your full SSO suite against them in CI. The bugs you find will be embarrassing and cheap to fix in CI; the same bugs found by a customer's IT team during a paid pilot are neither.

## Designing the SCIM endpoint: the contract that matters

A SCIM 2.0 server implements a small set of resources — primarily `/Users` and `/Groups` — with standard CRUD operations, filtering, and pagination. The protocol is deliberately boring, which is its strength: IdPs already know how to talk to it. Your job is to implement the contract faithfully and map it onto your application's user model.

**Map IdP attributes to your model explicitly, per tenant.** The IdP sends `userName`, `emails`, `name`, `active`, group memberships, and whatever custom attributes the customer's admin configured. Your application needs its own canonical user: an external ID (the IdP's immutable user identifier — never the email, which changes), an email, a display name, an active flag, and role/group mappings. Make this mapping configurable per tenant, because customer A puts department in `department` and customer B puts it in a custom extension attribute. Hardcoding the mapping works for exactly one customer.

**Idempotency is non-negotiable.** IdPs retry, replay, and occasionally send the same create twice. Your SCIM endpoint must handle duplicate creates (return the existing user), out-of-order updates (a deactivation arriving before the create — buffer or reconcile), and replays without corrupting state. Match on the external ID, never on mutable fields.

**Deactivation semantics need a decision, not a default.** When the IdP sends `active: false`, what does your application do? Options range from soft-disable (block login, preserve data and audit trail) to hard-delete (remove the user and their data). Soft-disable is almost always right: audit requirements demand the history, and re-hires happen. But soft-disable must be real — every session revoked, every API token invalidated, every scheduled job owned by that user reassigned or paused. "Deactivated" users whose long-lived API tokens still work are the finding that ends pilots.

```typescript
// SCIM deactivation handler: every credential surface must be covered
async function deactivateUser(externalId: string, tenantId: string) {
  const user = await users.findByExternalId(externalId, tenantId);
  if (!user) return; // idempotent: unknown user is a no-op

  await db.transaction(async (tx) => {
    await tx.users.setActive(user.id, false);
    await tx.sessions.revokeAll(user.id);          // web sessions
    await tx.apiTokens.revokeAll(user.id);         // long-lived tokens
    await tx.oauthGrants.revokeAll(user.id);       // third-party grants
    await tx.scheduledJobs.reassign(user.id);      // owned automations
    await audit.log({ actor: "scim", action: "user.deactivated", userId: user.id });
  });
}
```

## Group push and role mapping: where access policy lives

Users are half the lifecycle; groups are the other half. Enterprise customers manage access through IdP groups — "Engineering," "Finance-Admins," "Contractors" — and expect group membership to drive roles inside your application. SCIM group push (the IdP syncing group membership to your app) is how this happens without your support team becoming a role-assignment helpdesk.

**Decide the direction of truth for roles.** Two models work: IdP-driven (groups from the IdP map to roles in your app, and your app's role assignment UI is read-only for SCIM-managed users) or app-driven (your app owns roles; the IdP only manages identity). The dangerous middle is both systems assigning roles with no precedence rule — then a terminated contractor keeps their admin role because "the IdP removed them from the group but the app role was set manually." Pick one direction per tenant and enforce it: if SCIM manages roles, manual role changes on SCIM-managed users get overwritten on the next sync, and the UI says so.

**Map groups to roles with an explicit, reviewable table.** A per-tenant mapping — IdP group X grants app role Y — stored as configuration, visible in the admin UI, change-audited. Implicit mappings ("anyone in a group containing 'admin' becomes an admin") are how privilege escalation hides. The mapping table is a security control; treat changes to it like changes to IAM policy, because that is what it is.

## The deprovisioning gap: design for the 4 PM termination

Everything above converges on one scenario: an employee is terminated at 4 PM on a Friday. The IdP deactivates them at 4:05. Your SCIM endpoint receives the deactivation at 4:06. What happens next is the entire security story of your enterprise offering.

**Measure deprovisioning latency end to end.** From IdP deactivation to every credential revoked in your system — sessions, tokens, API keys, scheduled jobs, shared links they created, data exports they scheduled. Set a target (minutes, not hours) and monitor it. Most teams have never measured this; the first measurement is usually the unpleasant one that justifies the SCIM investment.

**Handle the IdP outage case.** If the customer's IdP is down, SCIM updates stop arriving. Your application must keep working for active users (SSO sessions already issued should survive a short IdP outage — design session lifetimes accordingly) while queuing or flagging the missed provisioning changes. When the IdP recovers, reconcile: pull the current state and diff against yours. A SCIM implementation without a reconciliation path is eventually inconsistent — guaranteed, because networks fail.

**Offboarding is also a data question.** Terminated users created dashboards, reports, API integrations, and shared links. Deactivation must not orphan or silently break these, and it must not leave them running under a dead identity either. The policy — transfer ownership to the manager, freeze, or delete — should be a per-tenant configuration decided during onboarding, not discovered during the first termination.

## Multi-tenant identity architecture

All of this multiplies by tenants. The identity layer of a multi-tenant SaaS app needs clean separation: per-tenant IdP configuration, per-tenant SCIM credentials (each tenant gets its own SCIM bearer token or OAuth client, scoped to that tenant — one shared SCIM endpoint credential across tenants is a cross-tenant data leak waiting for a bug), per-tenant attribute mappings, and per-tenant group-to-role tables.

**Isolate ruthlessly.** A SCIM request authenticated as tenant A must be incapable of touching tenant B's users — enforce this at the data layer with tenant-scoped queries, not just at the route layer. Identity endpoints are high-value targets; a tenant-isolation bug here is a breach, not a bug.

**Support the enterprise onboarding flow.** Real enterprise onboarding looks like: security review questionnaire, SSO configuration (metadata exchange, test login), SCIM provisioning (test user create/update/deactivate cycle), group mapping workshop, then phased rollout. Build admin tooling for each step: a "test SSO" button that runs a full login flow, a SCIM event log showing every inbound change with its outcome, and a dry-run mode for group mapping that shows what roles would be assigned before it goes live. This tooling is the difference between a two-week onboarding and a two-month one.

## Common failure modes

**Email as the user key.** Emails change — marriage, rebrands, acquisitions. If your user identity is keyed on email, a name change becomes an account migration incident. Key on the IdP's immutable user ID from day one; email is an attribute.

**Ignoring the `active` flag on login.** Some teams implement SCIM user creation but check only "does the user exist" at login, not "is the user active." A deactivated user whose record still exists can log in again via SSO if the IdP still issues assertions — or worse, via a lingering session. Every authentication path must check the active flag.

**SCIM as an afterthought bolted onto a user model that can't represent it.** If your user table has no external ID, no source-of-truth marker, and no distinction between IdP-managed and locally-managed users, adding SCIM means a migration under pressure. Design the user model for external identity management from the start, even if SCIM ships in v2 — the columns are cheap, the migration is not.

**No SCIM event log.** When a customer's IT team asks "why does this user have that role," the answer must be a queryable log of inbound SCIM events, not a shrug. Log every SCIM operation with timestamp, actor (which IdP, which admin), payload summary, and outcome. This log is also your debugging lifeline when the IdP sends something unexpected.

## Closing

SSO without SCIM is a door with no lock on the inside — easy to enter, and nobody tracks who left. The enterprise identity lifecycle is hire, change, and terminate, and only SCIM covers all three. Build OIDC first, SAML when asked, per-tenant everything, explicit group-to-role mappings, deactivation that revokes every credential surface, and a reconciliation path for when the IdP goes quiet. Measure deprovisioning latency like the security metric it is. The teams that design for the full loop pass security reviews boringly; the teams that don't, fail them interestingly.
