# Content Factory collection template

A collection is a named series of published resources — a tweet thread
series, a video playlist, a set of posts. One file per collection: copy the
template below into `data/content-factory/<short-name>.md`
(e.g. `data/content-factory/basecamp-tutorials.md`). The dashboard reads
every `.md` file in `data/content-factory/` (files starting with `_` are
ignored).

Items are listed in series order and shown as links on the board. `platform`
is optional. The markdown body is free-form notes, shown under the links.

---

```markdown
---
title: Collection name
platform: X                # where it's published (optional)
items:
  - title: Part 0
    url: https://x.com/you/status/123
  - title: Part 1
    url: https://x.com/you/status/456
---

Free-form notes about this collection (optional).
```
