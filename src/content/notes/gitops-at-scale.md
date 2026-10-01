---
title: GitOps at scale: what works past the demo
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Platform architecture
categories: [Platform Architecture, GitOps, Kubernetes]
---

The GitOps demo is compelling: commit to git, watch the agent sync it to the cluster. It takes a day to set up and about a year to discover what it doesn't do. This note is about that year — repo topology fights, secret sprawl, drift that auto-sync hid, multi-cluster promotion, and the access-control arguments.

## What GitOps actually promises (and what it doesn't)

The promise: desired state lives in git — versioned, reviewed, auditable — and an agent reconciles the cluster toward it. Single source of truth, full audit trail, rollbacks via git history, drift correction.

What it doesn't promise:

- **It doesn't make your changes safe.** GitOps will faithfully and rapidly deploy your bad config to every cluster. Review, testing, and progressive delivery are still your job — GitOps makes delivery boring, which is the point, but "boring" and "safe" are different things.
- **It doesn't version your application code.** GitOps reconciles *desired state declarations*. Container images are built by CI. Conflating the two collapses a separation that exists for good reasons.
- **It doesn't eliminate operational judgment.** Auto-sync, self-healing, and prune settings are policy decisions with real blast radii. The defaults are demo settings.
- **It doesn't solve secrets.** Nothing about "store desired state in git" tells you where the database password goes. Every GitOps setup eventually has a secrets story.

## Repo topology: mono-repo vs per-team vs per-environment

This is the first religious war, and the honest answer is that each topology optimizes for something different.

**Mono-repo (one repo for all environments and services).**

Pros: one place to see everything; atomic cross-service changes in one PR; simple bootstrapping; easy global policy enforcement.

Cons: blast radius of a bad merge is everything; CODEOWNERS gets complicated; git history gets noisy; teams collide on shared files.

**Per-team repos.**

Pros: clear ownership; teams move at their own pace; smaller blast radius.

Cons: cross-service changes need coordinated PRs across repos; discovering "what's deployed where" requires tooling; shared platform config still needs a home — usually a platform repo, which is a mono-repo for the platform team anyway.

**Per-environment repos.**

Pros: strong isolation — prod config changes are visibly separate from dev.

Cons: promotion means cherry-picking commits across repos, which is manual and error-prone; drift between environment repos is invisible until it bites. Almost never worth it past a handful of services.

**What works in practice:** a platform mono-repo for cluster baselines, shared policies, and platform services, plus per-team repos for application configs — with environment differences handled by overlays or value files *within* each repo. Ownership boundaries where they matter (team app config), single source of truth where it matters (platform baseline).

## The app-of-apps pattern and its failure modes

App-of-apps: a root Application pointing at a directory of Application manifests. Standard bootstrapping — and it works, until it doesn't.

- **The root app becomes a single point of failure for deploys.** A bad commit to the root's directory can misconfigure every child app at once. Protect it with CODEOWNERS and required reviews — it's the most powerful file in your fleet.
- **Cascading sync failures.** If apps depend on each other (CRDs installed by app A, consumed by app B), sync order matters. Argo CD sync waves are ordering hints, not dependency management. For hard dependencies (CRDs, namespaces, operators), use a separate "bootstrap" layer synced before applications.
- **Drift in the app definitions themselves.** Teams hand-edit Application manifests via the UI "for a quick test" and never commit it back. Treat Application manifests with the same change discipline as workload manifests — or disable UI edits.
- **Scale limits.** Hundreds of Application CRs in one root are manageable; thousands get slow. Shard by fleet segment with multiple roots, or move to ApplicationSets with generators instead of hand-maintained app lists.

ApplicationSets deserve a mention: generating Applications from git directories or cluster lists eliminates the hand-maintained app inventory. But generators are templating — a bad generator template creates a hundred broken Applications instead of one. Test generator changes on a non-prod cluster first.

## Secrets in GitOps: compare honestly

Storing desired state in git collides head-on with secrets. The options:

**Sealed Secrets (Bitnami).** Encrypt secrets with a cluster-side key; commit the encrypted blob.

- Honest cons: the blob is tied to *that cluster's* key — it can't be shared across clusters without multi-key encryption; key rotation re-encrypts everything; cluster admins can decrypt everything; no audit trail of *who* read a secret.

**External Secrets Operator (ESO).** Store secrets in a real secret manager (Vault, AWS/GCP Secret Manager); ESO syncs them into cluster Secrets.

- Honest cons: the cluster depends on the secret manager at sync time — if it's down, new pods can't get secrets; you've added a controller and an external dependency to your critical path.

**SOPS (with age/PGP/KMS).** Encrypt secret values in-place in your YAML; decrypt at deploy time.

- Honest cons: key management is on you — distribution, rotation, onboarding; partial-file encryption is fiddly; debugging broken decryption at 2 AM is miserable.

**What works in practice:** ESO backed by your cloud provider's secret manager for most teams — plaintext stays out of git, and rotation and audit trails live in the secret manager. Sealed Secrets is fine for small single-cluster setups. SOPS fits when you want everything in git and have the key-management discipline to back it up — which most teams overestimate.

Non-negotiable regardless of choice: **no plaintext secrets in git, ever.** Git history is forever; "we'll encrypt it later" means the secret is in every clone from now on. And every secret in the cluster should have an owner and a rotation story, or it's a future incident.

## Environment differences without templating hell

Dev, staging, and prod differ — replica counts, resource limits, feature flags, endpoints. The question is how to express the differences without creating a maintenance nightmare.

**Kustomize overlays.** Base manifests plus per-environment patches. Works well when environments are *mostly* the same with small deltas. Breaks down when the deltas stop being small — deeply nested strategic-merge patches become write-only code.

**Helm value files.** One chart, `values-dev.yaml`, `values-prod.yaml`. Works well when the chart is well-designed with a clean values interface. Breaks down into "one giant values file" — a 2000-line YAML where nobody knows which values are actually set vs defaulted, and prod-only overrides hide at the bottom.

**What works in practice:**

- Keep the base/values interface small and explicit. If your values file needs comments explaining which combinations are valid, the chart's interface is too wide.
- Prefer *fewer, larger* environment differences expressed as complete overlays over *many, scattered* conditionals. `{{- if eq .Values.env "prod" }}` sprinkled through templates is logic hiding in configuration.
- Validate rendered manifests in CI per environment: `helm template` or `kustomize build` plus kubeconform/policy checks. Catching "this renders invalid YAML for prod" in CI beats catching it in Argo CD's sync status.
- For truly environment-specific resources, separate manifests included per-environment beat conditional logic inside shared templates.

## Progressive delivery on top of GitOps

GitOps syncs desired state; progressive delivery (canary, blue-green) controls *how* traffic shifts to it. They compose, but the integration point needs thought.

- **Argo Rollouts** is the natural fit: the Rollout resource *is* the desired state in git, and the controller manages the canary steps. GitOps reconciles the Rollout definition; Rollouts manages traffic shifting. Clean separation.
- The failure mode: GitOps auto-sync fighting the progressive controller. If Argo CD self-heals aggressively, it can revert the intermediate states the rollout controller creates. The fix is scoping: tell the GitOps tool to ignore the resources the progressive controller manages, so each controller owns its layer.
- **Analysis gates** (metrics checks during canary) need queries that reflect user impact — error rate and latency on the canaried routes, not just pod health. A canary that passes on "pods are running" and fails on "p99 doubled" is a canary that works.

Manual gates ("promote to prod needs a human click") belong in the promotion pipeline between environments, not in the sync loop. Don't make sync wait for humans — make *promotion* wait for humans.

## Drift detection and self-healing

GitOps agents detect drift (cluster state ≠ git state) continuously. What to do about it is a policy choice:

**Auto-sync + self-heal ON:** any manual change gets reverted automatically. Great for: platform baselines, security policies, anything where "someone hand-edited prod" is always wrong. Dangerous for: debugging sessions (your temporary fix gets reverted mid-investigation), progressive delivery intermediates (above), and any resource where the controller legitimately mutates state (HPA-managed replica counts — you must ignore those differences or self-heal will fight the autoscaler forever).

**Auto-sync ON, self-heal OFF:** git changes deploy automatically, but manual cluster changes persist until the next git change touches that resource. A reasonable middle ground for application workloads — but drift accumulates silently.

**Manual sync:** every change needs a human click. Safest-feeling, but it reintroduces the ticket-queue deployment model GitOps was supposed to replace.

**What works in practice:** auto-sync + self-heal for platform/security baselines; auto-sync without self-heal (or with carefully scoped ignore-differences) for applications; manual sync reserved for the tiny set of resources where every change genuinely needs human judgment. And regardless of policy: **alert on drift**. Drift you know about is information; drift you don't is a future incident.

## Multi-cluster at scale

One cluster is a demo. Real scale is tens to hundreds of clusters — regional deployments, per-tenant clusters, edge locations.

**Hub-spoke:** a management cluster runs Argo CD (or Fleet) and deploys to workload clusters. Pros: single control plane, centralized visibility. Cons: the hub is a blast radius — if it's down, fleet-wide deploys stop; at large spoke counts the hub's reconciliation load needs sharding.

**Registration and onboarding:** new clusters must enroll with credentials, labels (region, environment, tier), and baseline config. Automate this — a runbook for cluster onboarding doesn't survive the twentieth cluster.

**Promotion pipelines:** change flows dev → staging → prod *clusters* as git operations — CI or a promotion controller opens a PR updating the image tag in the prod overlay when staging is healthy. The PR is the audit trail and the approval gate. Avoid "promote" buttons that mutate prod config outside git.

**Fleet-wide operations** (operator upgrades, CA rotation) need orchestration above per-cluster sync: waves, batches, and canary clusters. The GitOps tool syncs; the *orchestration of what syncs when* is a separate concern.

## CI vs CD separation

The rule: **CI builds images; CD updates git. Keep them apart.**

- CI (on code commit): build, test, scan, push an immutable image with a unique tag (git SHA, not `latest`).
- CD (GitOps agent): watches the config repo, syncs declared image tags to clusters.
- The handoff — updating the image tag in git — is done by CI committing to the config repo (or opening a PR for gated environments). "Image X was promoted to prod at time T" stays visible in git history.

What breaks when you violate this: CI pushing directly to clusters bypasses every GitOps guarantee — no drift detection, no audit trail, and the next sync may revert or conflict with what CI did. GitOps building images puts build tooling and non-determinism into the sync loop. Builds are CI's job.

## Rollback in GitOps: git revert as the mechanism, and its limits

The headline rollback story is beautiful: `git revert` the bad commit, the agent syncs the previous state, done. For config changes it genuinely works — faster and more reliable than most imperative rollback procedures.

The limits:

- **Revert restores config, not data.** If the bad deploy ran a migration, reverting the Deployment doesn't un-run it. Data changes need their own rollback story.
- **Revert of a multi-commit change is fiddly.** Tag releases or use a release-branch-per-environment pattern so "roll back to the last known good" is one operation.
- **Image tags vs git state:** reverting config works only if the old images still exist. Immutable tags plus a retention policy keeping N previous images is part of the rollback story.
- **CRD and operator upgrades** often can't be cleanly reverted — CRD schema changes can be one-way. Treat operator/CRD changes as higher-risk with their own testing, not as "we can always revert."

## Access control: who can merge to prod config

- **CODEOWNERS on the config repo** is the baseline: platform team owns baselines and cluster config; application teams own their app directories. Required reviews on prod paths.
- **Different merge permissions per environment:** anyone merges to dev config; staging needs team review; prod needs platform or release-captain approval. Git history then *is* your change-approval audit trail.
- **The GitOps agent's own RBAC:** the agent needs broad cluster permissions to sync. Scope its ServiceAccount per cluster, rotate its credentials, and treat the config repo as equivalent to cluster-admin — because anyone who can merge to it *is* effectively cluster-admin. Your CODEOWNERS file is now part of your security boundary. Review it like one.
- **Break-glass:** there will be incidents where someone needs to bypass the normal flow. Define it in advance: who can, how it's recorded (it must still end up in git — sync the emergency change back immediately after), and how it's reviewed after the fact.

## Observability of the delivery pipeline itself

Monitor the thing that delivers your applications, not just the applications:

- **Sync status and health** per app, aggregated by fleet segment — the GitOps equivalent of "which services are unhealthy."
- **Sync latency:** time from git commit to running in the cluster. When this degrades, every team's deploy experience degrades — track it like an SLO.
- **Agent health:** the controllers themselves — reconciliation queue depth, API server load, memory. A GitOps agent hammering the Kubernetes API becomes a noisy neighbor to the workloads it deploys.
- **Deployment frequency and lead time** fall out of git history for free — your DORA metrics source of truth, as long as every production change genuinely flows through git.
- **Audit:** who synced what, when, and what changed. The GitOps tool's audit logs plus git history should answer "who deployed this" without asking anyone.

## Anti-patterns

- **Imperative kubectl against GitOps-managed clusters.** Every hand-applied change is either drift to be reverted or a change that bypasses review, audit, and rollback.
- **Plaintext secrets in git.** Git history is forever.
- **One giant values file.** A 2000-line values.yaml where prod overrides hide at the bottom is configuration by archaeology. Small explicit interfaces, validated rendering.
- **Auto-sync everything with no gates.** Demo default, production hazard. Scope auto-sync and self-heal per layer; put human gates at promotion boundaries.
- **The unscoped ignore-differences.** Ignoring HPA replica counts is correct; ignoring *all* differences on a Deployment because "the controller kept fighting us" is giving up on drift detection. Scope ignores narrowly and document why each exists.
- **Treating the config repo as "just YAML."** It's executable infrastructure with cluster-admin blast radius. Review standards and branch protection should reflect that.
- **No canary cluster in a multi-cluster fleet.** Rolling a platform change to every cluster at once because "GitOps makes it easy" confuses ease of delivery with safety of delivery.
