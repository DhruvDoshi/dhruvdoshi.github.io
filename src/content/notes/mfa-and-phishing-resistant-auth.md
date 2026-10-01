---
title: "Phishing-resistant authentication: MFA that actually holds up"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Identity
categories: [Identity, Security, Authentication]
---

"We have MFA" is the most common false confidence in authentication. SMS codes, TOTP apps, and push approvals all count as multi-factor, and all of them fail against a phishing page that simply relays the victim's session in real time. Attacker-in-the-middle phishing kits are commoditized: the victim types their password and MFA code into a convincing replica, the kit forwards both to the real site, and the attacker walks away with an authenticated session. The MFA worked exactly as designed — and provided zero protection. Phishing resistance is a specific property, not a synonym for "we added a second factor," and building it requires understanding exactly which factors have it and which don't.

## What "phishing-resistant" actually means

A phishing-resistant authenticator binds the authentication ceremony to the legitimate origin. In plain terms: the credential cannot be used on a lookalike domain, because the cryptographic exchange includes the real site's identity and the attacker's relay cannot reproduce it. WebAuthn/FIDO2 security keys and passkeys have this property. Everything else commonly deployed — SMS, TOTP, push notifications, email magic links — does not.

**NIST's framing is the useful one.** NIST SP 800-63B defines Authenticator Assurance Levels: AAL1 (single factor), AAL2 (two factors, but phishable — this is where TOTP and push live), and AAL3 (multi-factor with phishing resistance, i.e., hardware-backed cryptographic authenticators). When an enterprise buyer or a compliance framework asks for phishing-resistant MFA, they mean AAL3. Knowing the vocabulary matters because "MFA" in a contract might mean AAL2, and the gap between AAL2 and AAL3 is the gap between "checked the box" and "survives phishing."

**Threat-model the relay, not the password.** The modern phishing attack does not steal credentials to reuse later — it proxies the live session. The victim's browser talks to the attacker's domain; the attacker's server talks to the real site; codes and approvals flow through in real time. Any factor whose secret the user can read and type (a six-digit code) or approve without origin context (a push notification) can be relayed. Only a challenge-response bound to the origin breaks the relay, because the attacker's domain produces a different challenge than the real site's, and the authenticator signs for the wrong origin.

Verdict: if your MFA secret can be typed, spoken, or screenshotted by the user, it can be phished. Phishing resistance starts where human-readable secrets end.

## The factor ladder, honestly ranked

**SMS codes: legacy, keep only for recovery.** Vulnerable to SIM swapping, SS7 interception, and plain phishing — and the codes arrive on a device channel with no origin binding. Every security framework now treats SMS as a restricted authenticator. Keep it as a last-resort recovery path if your user base demands it, never as a primary factor, and never present it as phishing-resistant.

**TOTP (authenticator apps): better, still phishable.** No SIM-swap risk, works offline, cheap to deploy. But the six-digit code is relayable by any phishing proxy, and the shared secret is phishable at enrollment (a fake QR code during setup hands the attacker the seed). TOTP is a solid AAL2 factor — a genuine upgrade over passwords alone — but it does not survive targeted phishing.

**Push approvals: convenient, fragile.** Push-based MFA trained users to tap "Approve" reflexively, and attackers exploit it with MFA fatigue — dozens of push requests at 3 AM until the victim approves one to make the noise stop. Number matching (displaying a number on the login screen that the user must pick in the app) meaningfully improves this: it forces the user to engage with context instead of tapping blindly. If you run push MFA, number matching is not optional — it's the difference between a control and a suggestion.

**WebAuthn / FIDO2 security keys: phishing-resistant.** A hardware key (or platform authenticator) performs a cryptographic challenge-response bound to the relying party's origin. The phishing proxy cannot replay it against the real domain. This is AAL3 territory and the gold standard for high-risk users: administrators, finance, anyone with production access.

**Passkeys: phishing-resistant for everyone.** Passkeys are WebAuthn credentials synced across a user's devices via their platform account (iCloud Keychain, Google Password Manager). Same origin-binding cryptography as security keys, without the "buy and carry a dongle" friction. The syncability slightly changes the threat model (compromise of the platform account becomes relevant), but against phishing — the dominant attack — passkeys hold up. For consumer and general workforce authentication, passkeys are the pragmatic path to phishing resistance.

**Rule of thumb:** administrators and production access get hardware-backed WebAuthn (AAL3). General users get passkeys with TOTP fallback. SMS exists only as a recovery channel of last resort, rate-limited and heavily monitored.

## WebAuthn in practice: the integration points

WebAuthn's ceremony has two halves — registration (creating the credential) and authentication (using it) — and both need server-side state and careful UX.

**Registration must be gated and verified.** Credential creation should happen inside an already-authenticated session, ideally one that itself required strong authentication (you don't want an attacker who phished a password to enroll their own key). Verify the attestation on the server: check the origin matches your domain exactly, validate the challenge you issued, and store the credential public key with its sign counter. The sign counter matters — a decreasing counter indicates a cloned authenticator, and your server should treat that as a compromise signal.

**Plan for the multi-device reality.** Users have a laptop, a phone, maybe a tablet. A credential registered on one device doesn't exist on the others unless it's a synced passkey. Your account model must support multiple credentials per user, with clear labeling ("MacBook Pro — added Oct 2026"), per-credential last-used timestamps, and self-service removal. Support flows will drown without this visibility: "I got a new phone and can't log in" is the number-one WebAuthn support ticket, and the fix is a sane recovery flow, not a lecture.

**Handle the platform matrix.** WebAuthn support is broad but not uniform: platform authenticators differ across operating systems and browsers, conditional mediation (the "passkey autofill in the username field" UX) needs explicit implementation, and enterprise environments with device management profiles can restrict authenticator types. Test the enrollment and login flows on the actual device/browser mix your users have — not just your development laptop.

```typescript
// Server-side WebAuthn authentication verification (conceptual, using a WebAuthn library)
async function verifyAssertion(user, credentialId, authenticatorData, clientDataJSON, signature) {
  const credential = await credentials.find(user.id, credentialId);
  if (!credential) throw new AuthError("unknown credential");

  // 1. Origin binding: the phishing-resistance property lives here
  const clientData = JSON.parse(clientDataJSON);
  if (clientData.origin !== "https://app.example.com") throw new AuthError("origin mismatch");
  if (clientData.type !== "webauthn.get") throw new AuthError("wrong ceremony");

  // 2. Challenge freshness: must match the challenge this session issued
  if (!challengeStore.consume(session.challengeId, clientData.challenge))
    throw new AuthError("stale or replayed challenge");

  // 3. Signature over the authenticator data with the stored public key
  const valid = await verifySignature(credential.publicKey, authenticatorData, signature);
  if (!valid) throw new AuthError("bad signature");

  // 4. Clone detection via sign counter
  if (authenticatorData.signCount <= credential.signCount)
    await securityEvents.raise("possible-cloned-authenticator", user.id);
  await credentials.updateSignCount(credential.id, authenticatorData.signCount);
}
```

## Recovery: the backdoor that eats the front door

Every phishing-resistant deployment lives or dies on its recovery flow, because attackers know it too. The pattern is depressingly consistent: organization deploys hardware keys for admins, then builds a "lost your key?" flow that resets authentication with an email link and a helpdesk call. Attackers stop attacking the key and attack the recovery flow instead. Your authentication strength is the strength of your weakest recovery path.

**Design recovery with the same rigor as enrollment.** Options, in rough order of strength: a second registered authenticator (encourage two from day one — "one to use, one in a drawer"), a time-delayed recovery with notifications to all account contact points (the delay gives the real user time to object), in-person or video-verified identity proofing for high-privilege accounts, and helpdesk-assisted reset with a documented verification procedure — not "the agent felt good about the call."

**Helpdesk reset is a social-engineering target; script it tightly.** The procedure should specify exactly what identity evidence is required, who can approve exceptions, and that every reset generates an alert to the account holder plus a security-event log entry. "Verify the caller" cannot be left to agent discretion — discretion is what social engineers exploit. Time-box elevated access granted through recovery: if someone recovers an admin account, consider requiring re-enrollment of strong factors before admin privileges are restored.

**Monitor recovery as an attack signal.** Track recovery initiation rate per user, per helpdesk agent, and globally. A spike in recovery requests — especially for privileged accounts, especially outside business hours — is worth an alert. Legitimate recovery is rare; clusters of it are not legitimate.

## Session security: authentication doesn't end at login

Phishing-resistant login with a sloppy session layer is a locked front door with open windows. The session is what the attacker actually wants, and several designs hand it over after strong authentication did its job.

**Bind sessions to the authentication strength.** If a user authenticated with a security key, the session should record that — and sensitive actions (changing payout details, modifying SSO configuration, exporting customer data) should require step-up authentication with the strong factor, not just "a valid session." A session created via TOTP fallback should not authorize the same actions as one created via hardware key. Authentication strength that isn't propagated to authorization decisions is theater.

**Session lifetime and revocation need teeth.** Absolute lifetimes (not just idle timeouts) for privileged sessions. Server-side session stores so revocation is immediate — "log out everywhere" and admin-initiated revocation must actually kill sessions, not wait for cookie expiry. And when a strong factor is removed or replaced on an account, re-verify: factor changes should invalidate existing sessions or at minimum trigger step-up on next sensitive action.

**Watch for session theft specifically.** Token binding is the thorough answer but operationally heavy; the pragmatic layer is anomaly detection on sessions — impossible travel, new device plus immediate sensitive action, session export patterns — feeding a risk engine that can step up or kill the session. None of this replaces phishing-resistant factors; it contains the damage when any single layer fails.

## Rollout: the human half of the project

The technology is the smaller half. Rolling out phishing-resistant MFA across a real user population is a change-management project wearing an engineering costume.

**Segment before you mandate.** Not every user needs AAL3 on day one. Start with the highest-risk populations — domain admins, production access, finance, executives — where the risk justifies the friction and the population is small enough to support directly. Expand in waves, with each wave's support load informing the next. A big-bang mandate without support capacity produces workarounds, and workarounds produce exceptions, and exceptions become permanent.

**Enrollment campaigns beat mandates.** Give users a window, clear instructions with screenshots for their actual devices, in-person or live support hours during the window, and a visible deadline with consequences stated plainly. Track enrollment rate per team and have managers — not just IT — own their team's number. The teams that treat enrollment as a communications campaign finish in weeks; the teams that send one email finish never.

**Measure what matters.** Enrollment rate, authentication success rate by factor type, support ticket volume per hundred users, recovery rate, and — the one that justifies the budget — phishing simulation click-through versus credential-harvest success. A phishing test where users click but the harvested credentials are useless against WebAuthn is the demo that ends the "is this worth it" debate.

## Anti-patterns

**MFA everywhere, phishing resistance nowhere.** Deploying TOTP to 10,000 users and declaring victory over phishing. You've raised the bar from password-only to password-plus-relayable-code; targeted attackers clear it routinely.

**The SMS fallback that bypasses everything.** Allowing "didn't get the push? get an SMS instead" as a self-service fallback converts your AAL3 deployment into an SMS deployment with extra steps. Fallbacks must be at least as strong as the primary path, or attackers will simply choose the fallback.

**Number matching without context.** Showing "select 42" without showing where the login attempt came from. The number proves engagement; the location and device context is what lets the user detect the attack. Show both.

**Treating passkeys as "just another factor."** Passkeys change the UX model — conditional mediation, cross-device sign-in via QR, platform-specific enrollment flows. Bolting them onto a TOTP-shaped UI produces confusion. Design the passkey flow natively: offer passkey creation at registration, prompt upgrade at login for existing users, and handle the "I don't know what a passkey is" user with plain language.

**No plan for shared and service accounts.** Break-glass admin accounts, CI service accounts, and shared team logins can't enroll personal biometrics. These need explicit designs — hardware keys in a safe for break-glass, scoped API tokens or workload identity for services — not exemptions that quietly become the standard path.

## Closing

Phishing resistance is a property of the authenticator, not a vibe of the login page. SMS, TOTP, and push are AAL2: real improvements over passwords, and genuinely insufficient against relay phishing. WebAuthn security keys and passkeys bind the ceremony to your origin, which is what breaks the attacker's proxy. Deploy in risk order — admins and production first — build recovery as carefully as enrollment, propagate authentication strength into session and authorization decisions, and measure the phishing-test results that prove it. The goal isn't more factors; it's factors the attacker can't relay.
