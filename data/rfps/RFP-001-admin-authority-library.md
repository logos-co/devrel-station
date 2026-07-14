---
rfp: RFP-001
title: Admin Authority Library
team: mmlado
contact: mmlado (Discord), mmlado.42 (Signal)
proposal_issue: 46
accepted_date: 2026-06-08
start_date: 2026-06-22
total_budget: 3500
milestones:
  - id: M1
    title: Macro API design, account model, draft PR
    payout: 875
    duration: 4-6 days
    status: in_progress
    reviewer: danisharora099
    deliverables: >
      #[require_admin] macro API design, AdminConfig account model, authority
      lifecycle documentation, draft PR opened to logos-co/spel
      (spel-framework-macros) with the macro skeleton and proposed annotation
      syntax. Includes LEE toolchain setup and codebase study.
    links: []
  - id: M2
    title: Macro implementation, library crate, iteration
    payout: 1750
    duration: 8-12 days
    status: not_started
    reviewer: danisharora099
    deliverables: >
      #[require_admin] implemented in spel-framework-macros; supporting library
      crate with AdminConfig, initialize, transfer_admin, renounce_admin; PR
      updated with Logos feedback; sample program demonstrating the annotation.
    links: []
  - id: M3
    title: Tests, documentation, delivery
    payout: 875
    duration: 4-6 days
    status: not_started
    reviewer: danisharora099
    deliverables: >
      Full test suite, CI green, README covering annotation API and integration
      steps, transaction size overhead notes, doc packet(s) submitted to
      logos-co/logos-docs.
    links: []
---

Solo developer, also delivering RFP-002 (Freeze Authority) as a coordinated
effort — the two libraries share the same account model and SPEL integration
pattern, and RFP-002 depends on this one.

Macro PRs land in `logos-co/spel` (spel-framework-macros crate); upstream merge
depends on SPEL maintainer review, so a milestone can be complete with a
merge-ready PR even if not yet merged.

> TODO(devrel): agree explicit per-milestone `due` dates with the applicant —
> until then the dashboard estimates them from start_date + durations.
