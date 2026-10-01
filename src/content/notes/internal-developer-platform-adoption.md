---
title: The internal developer platform adoption playbook
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Engineering, Developer Experience, Adoption]
---

Building an internal developer platform is an engineering problem. Getting engineers to use it is an organizational one. Most platform programs underinvest in adoption by an order of magnitude, then wonder why a technically sound platform sits unused while teams maintain their own pipelines.

## Start with a painful, common journey

Do not launch with ten capabilities. Pick one journey that is painful for many teams and make it dramatically better: getting a new service to production, for example, or setting up a standard data pipeline. The platform's first impression is formed by its first workflow; a narrow, excellent path beats a broad, mediocre catalog.

Choose the pilot teams deliberately. You want teams with real pain, credible influence, and enough patience for rough edges — not the team with the most political power or the least to lose. Two to four teams is the right size for a pilot: enough to surface real requirements, few enough to support intensively.

## Make the golden path genuinely better

Adoption follows value, not mandates. The platform path must be measurably better than the alternative on the dimensions teams care about: time to first deploy, time to recover, cognitive load, and toil eliminated. If the platform path is slower or more confusing than the team's existing scripts, no amount of communication will fix adoption.

Instrument the comparison honestly. Measure the golden path against the real alternative, including the hidden costs of the alternative: the senior engineer who maintains the bespoke pipeline, the tribal knowledge required to deploy safely, the incidents caused by snowflake infrastructure. Platform value is often in risk removed, not just time saved.

## Reduce the cost of switching

Even a better path loses if migration is expensive. Provide migration tooling, not just documentation: importers for existing pipelines, automated conversion of common patterns, and a supported transition period where both paths work. Staff the migration — platform engineers pairing with product teams during the switch is the fastest way to convert skeptics and discover gaps.

Sequence migrations by team readiness, not by platform team convenience. Forcing a team mid-crunch to migrate pipelines creates an enemy for life. A team that migrates voluntarily during a calm quarter becomes an advocate.

## Decommission the old paths

This is the step organizations avoid. As long as the old way works, a fraction of teams will stay on it, and the platform team pays the cost of maintaining both worlds indefinitely. Adoption is not complete until the old path is gone.

Decommissioning needs executive air cover and a fair process: announce timelines early, provide migration support, handle legitimate exceptions explicitly, and then actually turn things off. Every exception should have an expiry date. The credibility of the platform program depends on following through.

## Market internally, continuously

Platform teams often consider communication beneath them. It is not. Teams cannot adopt what they do not know about. Maintain a changelog, run demos of new capabilities, publish case studies from teams that migrated successfully, and keep documentation ruthlessly current. Stale docs are the fastest way to kill trust in a platform.

Measure adoption as a first-class metric: eligible teams using the platform voluntarily, depth of usage beyond the first workflow, retention after initial onboarding, and support burden per team. Report it alongside reliability and delivery metrics. What gets measured gets staffed.

## Adoption is the product

A platform with 30 percent voluntary adoption is a failed product regardless of its technical quality. The adoption playbook — narrow excellent start, genuine value, cheap switching, old-path removal, continuous communication — is not overhead on platform engineering. It is platform engineering, because a platform nobody uses is just expensive infrastructure.

## Handle the long tail honestly

After the enthusiastic majority migrates, a long tail remains: teams with unusual requirements, teams mid-delivery who cannot afford disruption, and teams that simply distrust the platform group. How you handle the tail determines whether adoption completes or stalls at eighty percent forever.

Start by understanding the tail rather than dismissing it. Some holdouts have legitimate needs the platform does not meet — exotic networking, unusual compliance requirements, genuine performance edge cases. These are product inputs: either the platform extends to cover them or it documents the boundary explicitly. A platform that pretends the long tail does not exist loses credibility with exactly the sophisticated teams whose adoption matters most.

For teams that can migrate but will not, the combination is a deadline with support. Announce the decommissioning date for the old path, offer hands-on migration help, and hold the date. What you cannot do is extend the deadline repeatedly; each extension teaches the organization that platform timelines are negotiable, and the next migration becomes harder.

Track the tail explicitly in adoption metrics: which teams remain, why, and what unblocks each. A tail with named owners and dates is a plan. A tail described as "some teams haven't migrated yet" is a hope. Close it out, and the platform team gets its maintenance burden back — which is the real prize, because that capacity funds the next capability.
