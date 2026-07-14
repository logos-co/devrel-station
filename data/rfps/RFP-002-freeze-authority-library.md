---
rfp: RFP-002
title: Freeze Authority Library
team: mmlado
contact: mmlado (Discord), mmlado.42 (Signal)
proposal_issue: 47
accepted_date: 2026-06-08
total_budget: 3500
milestones:
  - id: M1
    title: Macro API design, account model, draft PR
    payout: 875
    duration: 4-6 days
    status: not_started
    reviewer: danisharora099
    deliverables: >
      #[freeze_authority] / #[freeze_authority(auto)], #[require_not_frozen]
      and #[freeze_exempt] macro API design, FreezeConfig and per-account PDA
      layout, authority lifecycle documentation, draft PR opened to
      logos-co/spel with macro skeleton and annotation syntax.
    links: []
  - id: M2
    title: Macro implementation, library crate, iteration
    payout: 1750
    duration: 8-12 days
    status: not_started
    reviewer: danisharora099
    deliverables: >
      All four annotations implemented in spel-framework-macros; supporting
      library crate with FreezeConfig and all five management instructions; PR
      updated with Logos feedback; sample program demonstrating both gating
      models and both freeze modes.
    links: []
  - id: M3
    title: Tests, documentation, delivery
    payout: 875
    duration: 4-6 days
    status: not_started
    reviewer: danisharora099
    deliverables: >
      Full test suite covering frozen/unfrozen and per-account paths, CI green,
      README covering both freeze modes and annotation API, transaction size
      overhead notes, doc packets submitted.
    links: []
---

Same developer as RFP-001 (Admin Authority Library). Freeze authority extends
the admin authority pattern, so this delivery follows RFP-001 — expect M1 here
to start after RFP-001 M1/M2 stabilise the shared foundations.

> TODO(devrel): confirm sequencing and due dates with the applicant.
