# Canto Numbers

**Hear it or see it, type it in Yale, and watch it explode.** A fast drill for Cantonese numbers and money. Every right answer blows up into colourful pixel confetti, and the chaos grows with your streak.

Yale with tone marks only. Chinese characters are used only behind the scenes, as input for Azure TTS.

## Two modes
| Mode | You get | You type |
|---|---|---|
| **Listen** | 🔊 audio clip | digits: `38`, `3.20` |
| **Read** | `$3.20` + a *full* / *contracted* tag | Yale: `sāam go yih` |

## Five levels
| Level | Content | Example |
|---|---|---|
| 1 | 0–99 full | `sāam sahp baat` |
| 2 | 21–99 contracted | `yah yāt`, `sā-ah baat` |
| 3 | Dollars (`léuhng mān`) and hundreds/thousands (`baak yih`, `chīn ńgh`, `lìhng`) | `yāt baak lìhng ńgh` |
| 4 | Dollars + cents, full ⇄ contracted | `sāam mān léuhng hòuh` ⇄ `sāam go yih`, `yāt go bun` |
| 5 | Mix of everything, plus `maahn`, played at 1.3× | `maahn yih` |

A round is 60 seconds. Score = correct answers × level, plus a streak bonus. You can pick any level, so there's nothing to unlock.

## Contractions reference (draft: check against your CLA materials!)
| | Full | Contracted |
|---|---|---|
| 21–29 | `yih sahp X` | `yah X` |
| 31–99 | `N sahp X` | `N-ah X` (`sā-ah`, `sei-ah`, `ńgh-ah`…) |
| 120 / 1500 | `yāt baak yih sahp` / `yāt chīn ńgh baak` | `baak yih` / `chīn ńgh` |
| $3.20 / $1.50 | `sāam mān léuhng hòuh` / `yāt mān ńgh hòuh` | `sāam go yih` / `yāt go bun` |

**Answer checking:** ignores spaces, hyphens and letter case, normalizes Unicode, accepts listed variants, and points out tone errors separately ("tone on *sāam*").

**Input:** free typing with tone marks, plus a row of tone buttons that can be turned on or off (on by default on phones).

## Look and feel
Pixel art, colourful, chaotic. Everything visual is **made in code**, with no sprite sheets:
- Particle bursts made of coloured pixel squares, screen shake, a flash on correct answers, and a red glitch effect on misses.
- The streak meter speeds up the colours and makes bursts bigger.
- Phaser's `pixelArt: true` setting plus a low-res canvas, scaled up.

- Bursts throw out short pixel phrases in Chinese characters with Yale underneath, so even the feedback teaches you something:

| Right | Wrong / streak lost |
|---|---|
| 好嘢 `hóu yéh!` · 正 `jeng!` · 犀利 `sāi leih!` · 叻 `lēk!` | 唔啱 `m̀h ngāam` · 再試 `joi si` · 加油 `gā yàuh!` |

**Assets:**
1. **Silkscreen** for titles, numbers and buttons, and **Pixelify Sans** for anything in Yale. Silkscreen turned out to be missing ā (tone 1) and ń. Both fonts are self-hosted in `public/assets/fonts/`.
2. **A Traditional Chinese pixel font** for the popup phrases, e.g. *Fusion Pixel* (TC) or *Zpix*. Cut the font file down to just the ~15 characters above, so a multi-MB CJK font becomes a few KB.
3. **Your own sound effects and music.** Put them in `assets-incoming/`. If classmates will play it, check that the licences allow sharing.

## Scope: afternoon + evening (~9 h)
| | h |
|---|---|
| Scaffold | 0.5 |
| Number → Yale generator + tests | 2 |
| Azure script: ~300 clips, 1 voice | 1.5 |
| Game scene: prompt, input, tone buttons, checking | 2 |
| Pixel chaos effects + phrase popups + your SFX/music | 1.5 |
| Supabase leaderboard (nickname + score) | 1 |
| Deploy + phone test | 1 |

**Cut:** menus beyond a level picker, accounts, saved progress, dictation mode, phone numbers and times.

## Risk: test first (15 min)
Check whether Azure's Hong Kong Cantonese voice actually *says* the contracted forms. Generate 10 test clips, including the characters for `sā-ah baat mān`, `yah yāt` and `sāam go yih`, and listen. If they come out wrong, the fallback is to spell them differently in the TTS input, for example 三呀八.
