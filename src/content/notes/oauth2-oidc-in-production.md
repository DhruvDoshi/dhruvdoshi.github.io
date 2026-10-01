---
title: "OAuth 2.0 and OIDC in production: flows, tokens, and the mistakes that repeat"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Identity
categories: [Identity, Security, APIs]
---

OAuth 2.0 is an authorization framework that the industry uses for authentication anyway, usually by bolting OpenID Connect on top. The specs are readable, the libraries are mature, and yet production OAuth deployments keep failing in the same handful of ways: wrong flow for the client type, tokens treated as opaque-oracle, refresh tokens handled carelessly, and logout that doesn't. This note covers the flows worth using, the token discipline that prevents the repeat mistakes, and the operational reality of running identity in production.

## The mental model: OAuth is delegation, OIDC is identity

**OAuth 2.0 answers "can this application act on the user's behalf?"** It's delegation: the user grants a client scoped access to a resource server, without sharing credentials. The access token is the artifact of that grant. OAuth by itself says nothing about who the user is — a client can hold a valid access token and know nothing about the human behind it.

**OpenID Connect adds "who is this user?"** OIDC is an identity layer on OAuth 2.0: the ID token (a JWT) carries authenticated claims about the user — subject identifier, issuer, audience, expiry, and profile claims. If you need authentication ("log the user in"), you need OIDC, not raw OAuth. Using OAuth access tokens as identity proof — "the token is valid, therefore the user is who they claim" — is the original sin of OAuth deployments, and it keeps happening because it almost works until it doesn't.

**The actors, fixed vocabulary:** the resource owner (the user), the client (your application), the authorization server (the identity provider — issues tokens), and the resource server (your API — validates tokens). Keeping these roles straight prevents half the design errors: the client is never the resource server, the ID token is for the client, the access token is for the resource server.

## The flows worth using (and the ones to retire)

### Authorization code + PKCE: the default for everything user-facing

**This is the flow.** The client redirects the user to the authorization server, the user authenticates and consents, the server returns an authorization code to the client's redirect URI, and the client exchanges the code (plus PKCE verifier) for tokens at the token endpoint. PKCE (Proof Key for Code Exchange) — originally for public clients that can't keep a secret, now recommended for all clients — binds the authorization request to the token exchange so an intercepted code is useless.

```
┌────────┐                                    ┌──────────────────┐
│ Client │                                    │ Authorization     │
│ (app)  │                                    │ Server (IdP)      │
└───┬────┘                                    └────────┬─────────┘
    │  1. authorize?response_type=code                 │
    │     + code_challenge, state ───────────────────▶│
    │                                                 │  2. user
    │  3. code ────────────────────────────────────── │     authenticates
    │◀────────────────────────────────────────────────     + consents
    │  4. token exchange: code + code_verifier ──────▶│
    │◀────── 5. access_token + id_token (+ refresh) ───│
```

**Use it for:** server-side web apps, SPAs, mobile apps — anything with a user present. With PKCE, for all of them. There is no longer a meaningful "confidential vs public" split in flow choice; PKCE everywhere is the current standard.

**The `state` parameter is not optional.** It's the CSRF protection for the login flow: random value, bound to the user's session, validated on return. Skipping it (or validating it loosely) enables login CSRF — an attacker completing the flow with their own account in the victim's browser. Every OIDC library handles this; every hand-rolled implementation forgets it.

### Client credentials: service-to-service

**No user involved.** The client authenticates with its own credentials (client secret, or better, a signed JWT assertion — private_key_jwt) and gets an access token for its own scopes. This is the flow for backend services calling APIs — cron jobs, workers, service-to-service calls.

**Prefer private_key_jwt over shared secrets.** Client secrets are symmetric credentials that get copied into env vars, committed to repos, and rotated never. Private-key JWT authentication uses an asymmetric keypair: the client signs a JWT with its private key, the authorization server verifies with the registered public key. Rotation is key registration, not secret redistribution. For service identities, this is strictly better — and it's the same machinery that makes workload identity work.

### Device authorization flow: for input-constrained devices

TVs, CLIs, IoT — the device shows a code, the user completes auth on their phone/laptop. Niche but correct where it applies. The polling interval and code expiry need sane values; the common mistake is aggressive polling that hammers the token endpoint.

### Retired: implicit flow and resource-owner password credentials

**The implicit flow (tokens in the redirect fragment) is deprecated.** It exposed tokens to browser history, referrer leakage, and JavaScript — all for a latency optimization that PKCE made unnecessary. If you inherit it, migrate to authorization code + PKCE.

**Resource owner password credentials (the app collects the password directly) is deprecated.** It trains users to hand credentials to third parties and defeats MFA, SSO, and every other IdP-side control. The only remaining excuse is a legacy migration window with a deadline.

## Tokens: the discipline

**Access tokens: short-lived, scoped, audience-bound.** Minutes to an hour of lifetime — the access token is a bearer credential, and its blast radius is bounded by its expiry. Scopes limit what it can do (`read:orders`, not `admin`); the audience (`aud`) claim limits where it's accepted. A token minted for API-A should not be accepted by API-B — audience validation at the resource server enforces this. The most common token mistake is one long-lived, broad-scope, unaudienced token used everywhere: a single leak becomes total compromise.

**ID tokens: for the client, not the API.** The ID token tells the client who logged in — display the name, personalize the UI. It is not an API credential: don't send it to your resource servers, don't use it for authorization decisions beyond "this is the logged-in user." The ID token's audience is the client; a resource server accepting ID tokens is a confused-deputy setup.

**Refresh tokens: the long-lived credential that needs the most care.** Refresh tokens (hours to days, sometimes longer) let the client get new access tokens without bothering the user. Because they're long-lived and powerful, they get the strongest protections: rotation on every use (a refresh token is single-use; using an old one signals theft and should invalidate the token family), sender-constrained where possible, stored securely (httpOnly secure cookies or OS secure storage — never localStorage, never in URLs). Refresh token reuse detection — invalidating the whole family when a rotated token is replayed — is the theft-detection mechanism; implement it.

**Token storage by client type.** Server-side apps: tokens in the server session, never in the browser. SPAs: the backend-for-frontend (BFF) pattern — a server-side component holds the tokens, the browser holds a session cookie. The SPA-directly-holding-tokens pattern (tokens in localStorage/sessionStorage) exposes them to every XSS vulnerability on the page; BFF exists specifically to avoid this. Mobile: OS secure storage (Keychain/Keystore), with the refresh token as the only long-lived artifact.

**JWT validation checklist at the resource server:** signature valid against the IdP's JWKS (fetched from the discovery document, cached with rotation handling), `iss` matches the expected issuer, `aud` contains this service, `exp` not passed (with small clock-skew leeway), `nbf`/`iat` sane, and for OIDC flows the `nonce` validated at login. Every one of these has been the missing check in a real vulnerability. Validate all of them, with a library, not hand-rolled.

**Opaque vs JWT access tokens.** JWTs are self-contained — the resource server validates locally, no introspection call. Opaque tokens require introspection at the authorization server — slower, but revocable instantly and revealing nothing to the token holder. The trade-off: JWTs need short lifetimes because they can't be revoked (without a denylist, which reintroduces the introspection call); opaque tokens cost a network round-trip per validation (mitigated by caching introspection results briefly). For most internal APIs, short-lived JWTs are the pragmatic choice; for high-security or third-party scenarios, opaque with introspection gives you the kill switch.

## The mistakes that repeat

**Using the access token as identity.** "The token validated, so `sub` is the user" — but the access token's subject is whoever the token was issued for, which in delegation scenarios isn't the calling user, and its claims aren't the identity contract. Use the ID token for identity, the access token for authorization. When these get mixed, authorization decisions get made on claims that were never meant for that purpose.

**Skipping audience validation.** The resource server accepts any valid token from the IdP regardless of audience. Now a token minted for a low-privilege client works against your admin API. Audience validation is one line in every library and the most skipped line in every hand-rolled validator.

**Over-scoped tokens as a convenience.** Requesting `openid profile email` plus every API scope "so we don't have to re-auth later" creates tokens that are skeleton keys. Scope tokens to the operation; use incremental authorization (request more scope when the user does more). The friction of re-consent is the security working.

**Logout that doesn't log out.** The user clicks logout, the app clears its session, and the IdP session plus every other app's session live on — plus refresh tokens that keep working. Real logout needs: IdP session termination (OIDC RP-initiated logout / end_session_endpoint), refresh token revocation, and ideally back-channel logout notifications to propagate session end to relying parties. "Logout" that only clears the local cookie is the most common OIDC half-implementation.

**Redirect URI validation gaps.** The authorization server must match the redirect URI exactly against the registered set — no wildcards, no prefix matching, no "close enough." Open redirectors in redirect validation turn the authorization code into an attacker-collectable artifact. Register exact URIs; reject everything else.

**Storing tokens where XSS lives.** Tokens in localStorage are one XSS away from exfiltration. The BFF pattern, httpOnly cookies, and treating XSS as a token-theft vector (not just a defacement vector) are the defenses. This is an architecture decision made once, not a per-page concern.

**Not rotating or expiring refresh tokens.** Non-rotating, non-expiring refresh tokens are permanent credentials — a leak is a permanent compromise. Rotation on use, absolute lifetime caps, reuse detection. The refresh token is the most valuable token in the system; protect it accordingly.

## Multi-tenancy and B2B: the identity gets harder

**Issuer per tenant vs shared issuer with tenant claims.** Per-tenant issuers (tenant-specific authorization endpoints) give clean isolation — tokens from tenant A are structurally invalid for tenant B — at the cost of discovery complexity (the client must resolve the tenant's issuer). Shared issuer with a tenant claim in the token is simpler operationally but puts the isolation burden on every resource server's validation logic. For B2B SaaS with enterprise customers bringing their own IdP, per-tenant issuer (or at least per-tenant connection) is the safer default — enterprise security reviews expect it.

**Organization claims and the confused tenant.** Every token needs an unambiguous tenant/org identifier, validated at the resource server against the requested resource's tenant. The failure mode is cross-tenant access via token replay: a valid token for org A used against org A's... no — against org B's endpoints. Tenant validation must be explicit, not assumed from "the user only has one org."

**SSO for enterprise customers: SAML vs OIDC inbound.** Enterprise IdPs speak both; OIDC is the modern default, SAML the legacy reality. Supporting inbound SAML for the customers that require it while using OIDC natively is the pragmatic enterprise posture. Either way, JIT provisioning vs SCIM: JIT (create the user on first login) is simpler; SCIM (provisioned from the customer's IdP) gives the customer lifecycle control (deprovisioning actually works). Enterprise customers increasingly demand SCIM — plan for it.

## Operating identity in production

**The IdP is critical infrastructure.** If your authorization server is down, nobody logs in and service-to-service auth fails. Run it highly available, multi-region if the business requires, with the same SLO discipline as your data tier. Managed IdPs (Auth0, Cognito, Entra ID, Keycloak self-hosted) shift this burden — evaluate them on their outage history and your exit options, not just their feature lists.

**Key rotation for token signing.** The IdP signs JWTs with keys published via JWKS; rotation must be handled by every resource server — cache JWKS, respect cache headers, handle unknown `kid` by re-fetching before failing. A signing-key rotation that breaks validation across your APIs is an avoidable outage with a well-known cause. Test it.

**Clock skew budgets.** Token expiry validation needs leeway (tens of seconds) for clock differences between IdP and resource servers — but leeway is also attack surface. Keep it small, keep NTP healthy, and monitor for validation failures that indicate drift.

**Audit trail on the auth events.** Log token issuance, refresh, revocation, failed validations, and anomalous patterns (token use from impossible geographies, refresh-token reuse attempts, scope escalation). Identity logs are the highest-signal security telemetry you have — protect them accordingly.

**Rate limiting the token endpoint.** The token endpoint is a credential-testing target. Rate limit it aggressively, alert on spikes, and require the client authentication that's appropriate to the flow. The authorization endpoint needs bot mitigation for public clients.

## Decision checklist

1. **Flow:** authorization code + PKCE for users; client credentials with private_key_jwt for services; implicit and password flows retired.
2. **Tokens:** short-lived scoped access tokens; ID tokens for the client only; rotating refresh tokens with reuse detection and secure storage (BFF for SPAs).
3. **Validation:** full JWT checklist at every resource server — signature, issuer, audience, expiry — via library.
4. **Logout:** IdP session termination, refresh revocation, back-channel propagation — not just cookie clearing.
5. **Redirect URIs:** exact match, no wildcards.
6. **Multi-tenant:** explicit tenant claim validation; per-tenant issuers for enterprise B2B.
7. **Operations:** IdP as critical infra, signing-key rotation tested, identity events logged and alerted.

## Closing

OAuth and OIDC in production are less about the protocol — the flows are settled — and more about the discipline around tokens: short-lived and scoped access tokens, ID tokens kept client-side, refresh tokens rotated and guarded like the crown jewels they are, validation complete at every resource server, and logout that actually logs out. The mistakes repeat because each one is a shortcut that works until the incident: skipping audience validation, storing tokens in localStorage, the logout that clears a cookie. Don't take the shortcuts. Identity is the one system where "it works" and "it's correct" are furthest apart — and where the gap is most expensive.
