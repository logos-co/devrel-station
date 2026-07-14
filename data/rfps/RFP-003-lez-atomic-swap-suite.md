---
rfp: RFP-003
title: LEZ Atomic Swap Suite (BTC + XMR + ZEC)
team: Gateway
contact: Igor Mandrigin (igor@gateway.fm, GitHub @mandrigin); commercial — Vuk Radoicic (vuk.radoicic@gateway.fm)
proposal_issue: 112
accepted_date: 2026-07-10
start_date: 2026-07-14
target_date: 2026-11-24 # ~19 weeks wall-clock per the proposal's dependency graph
total_budget: 296000
milestones:
  - id: M1
    title: Design, threat model, LEZ-primitive verification, SDK trait surface
    payout: 24500
    duration: 3 weeks
    status: not_started
    deliverables: >
      Per-leg protocol design write-up (BTC Schnorr adaptor + Taproot, XMR
      Ed25519 adaptor + cross-curve DLEQ, ZEC transparent-pool BIP-199 HTLC)
      with cross-chain atomicity argument; LEZ escrow program design + SPEL IDL
      sketch; threat model; written answers to the two PR #48 open questions
      with reproducer tests; Zcash node decision; SwapProtocol SDK trait
      surface published for Logos review; KV store decision; maker-daemon
      integration design for Logos core daemon mode.
    links: []
  - id: M2
    title: ZEC–LEZ leg (transparent-pool HTLC)
    payout: 33500
    duration: 4 weeks (overlaps M3)
    status: not_started
    deliverables: >
      LEZ escrow program v1 on testnet 0.2 (SHA-256 HTLC preimage path with
      validity windows); BIP-199 HTLC scripts on Zcash transparent pool with
      testnet integration tests in CI; LEZ/ZEC SDK full lifecycle; Zcash node
      setup docs; documented privacy posture (shield-after-swap); ZEC demo set
      (happy-path, refund/timeout, concurrent swaps).
    links: []
  - id: M3
    title: BTC–LEZ leg
    payout: 45500
    duration: 4 weeks (overlaps M2)
    status: not_started
    deliverables: >
      LEZ escrow program update for BTC adaptor-witness path (Schnorr +
      Taproot key-path spend); LEZ/BTC SDK full lifecycle; DLC-specs
      AdaptorSignature.md test-vector conformance with extended vectors;
      bitcoind testnet setup docs; BTC demo set.
    links: []
  - id: M4
    title: XMR–LEZ leg
    payout: 58000
    duration: 5 weeks (sequential after M3)
    status: not_started
    deliverables: >
      LEZ escrow program update for XMR cross-curve DLEQ claim path; LEZ/XMR
      SDK full lifecycle including spend-key-share recovery; DLEQ test-vector
      conformance against comit-network/cross-curve-dleq; monerod +
      monero-wallet-rpc stagenet setup docs; XMR demo set; stagenet monerod in
      CI.
    links: []
  - id: M5
    title: Maker daemon, CLIs, swap coordinator, fuzz harness
    payout: 30500
    duration: 3 weeks (overlaps M4)
    status: not_started
    deliverables: >
      Maker daemon (Tokio/Rust) under Logos core daemon mode with standalone
      systemd fallback; maker CLI; taker CLI; swap-coordinator state machine
      with persistence, crash recovery, concurrent-swap isolation; pluggable
      price-source trait (local config + external Logos-module feed per PR
      #108); graceful Delivery/Chat unavailability handling; cargo-fuzz
      harness on the coordinator state machine.
    links: []
  - id: M6
    title: Logos mini-app GUIs (maker + taker)
    payout: 18000
    duration: 3 weeks (overlaps M5)
    status: not_started
    deliverables: >
      Interactive HTML prototypes signed off before production build; maker
      mini-app (pair/price config, active-swap monitoring, history); taker
      mini-app (offer browsing, swap initiation, progress, shield-after-swap
      surfaced); Basecamp-loadable repos with build instructions.
    links: []
  - id: M7
    title: Formal third-party review (S12 + S13), remediation, mainnet-readiness
    payout: 86000
    duration: 4 weeks
    status: not_started
    deliverables: >
      Third-party review of all on-chain programs/scripts (S12) and of the
      cross-chain swap protocol implementation (S13), plus the coordinator
      state machine and daemon IPC surface; remediation of critical/high
      findings; mainnet-readiness write-up; all hard-requirement tests green
      in CI; doc packets per S9/S10 via logos-co/logos-docs.
    notes: >
      $15,000 Gateway delivery + $71,000 itemised auditor pass-through fee
      (auditor TBD, mutually agreed — Trail of Bits / Zellic / NCC Group
      shortlist; can be contracted by Gateway pass-through or by Logos
      directly).
    links: []
---

Supersedes #61 (Gateway's original May 2026 submission, revised 1 July).
Final scope agreed July 2026: ETH removed, Zcash transparent added — BTC +
XMR + ZEC ↔ LEZ. $296,000 all-in including the third-party audit
($225,000 Gateway delivery + $71,000 auditor fee), a ~39% discount on
Gateway milestones vs. the original offer.

Start: week of 2026-07-14, or the first Monday after Grant Agreement
execution, whichever is later. ~19 weeks wall-clock on a partly-parallel
schedule (M2/M3 overlap; M4 sequential after M3; M5/M6 overlap M4's tail) —
delivery around late November 2026.

Team: Igor Mandrigin (CTO, crypto lead — full-time on M3/M4), Elliot (senior,
M2 lead), Ivan (senior, M5 lead), frontend contractor (M6).

> TODO(devrel): confirm Grant Agreement execution date, then set per-milestone
> `due` dates from the dependency graph; decide auditor contracting path for
> M7.
