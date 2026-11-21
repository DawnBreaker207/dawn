# DTS Native Lab — Plan

> **Dành cho AI agent thực thi.** Đọc hết file này trước khi chạm vào bất kỳ file nào.
> File này ghi lại TRẠNG THÁI HIỆN TẠI và CÁC VIỆC CẦN LÀM, không phải lịch sử.

---

## Bối cảnh hệ thống

Blog dùng **Astro 5 + React islands + Tailwind v4**, deploy Vercel. Có một hệ thống
lab tương tác (DTS — Designed to Scale) hiển thị sơ đồ kiến trúc isometric 3D.

DTS tồn tại ở **hai dạng song song**:

| Dạng | Nguồn | Dùng ở đâu |
|---|---|---|
| **Iframe bundle** | `public/dts/index.html` + `assets/` | `aws-cloud`, `microservices`, `request-lifecycle` |
| **Native Astro** | `src/lib/dts/` + `src/components/lab/architecture/` | `system-design` (đang trong quá trình hoàn thiện) |

Mục tiêu dài hạn là chuyển tất cả sang native. Tuy nhiên **hiện tại chỉ làm system-design** —
ba lesson còn lại (aws-cloud, microservices, request-lifecycle) **giữ nguyên iframe, không đụng vào**.

---

## Cấu trúc file quan trọng

```
src/
├── lib/dts/                          ← Native TypeScript engine
│   ├── DtsEngine.ts                  ← Class chính: SVG canvas, 60fps animation, camera
│   ├── types.ts                      ← BlockEntity, DbEntity, DeviceEntity, Lesson, Step, Flow...
│   ├── math.ts                       ← projectIso(), round2(), Point2D
│   ├── palettes.ts                   ← renderSvgDefs() — SVG gradients/shadows per theme
│   └── renderers/
│       ├── cube.ts                   ← renderCubeBlock()
│       ├── cylinder.ts               ← renderCylinderDb()
│       ├── device.ts                 ← renderLaptopDevice()
│       ├── links.ts                  ← renderLink()
│       ├── zone.ts                   ← renderZone()
│       ├── glyphs.ts                 ← icon SVG paths (server, balancer, db...)
│       └── pills.ts                  ← renderPills() — tag chips above/below entities
│
├── data/architecture/
│   ├── index.ts                      ← ARCH_LESSONS registry (export tất cả 4 lessons)
│   ├── system-design.ts              ← 6 steps, Dawn Blog System Architecture
│   ├── request-lifecycle.ts          ← data có, nhưng lesson dùng iframe
│   ├── aws-cloud.ts                  ← data có, nhưng lesson dùng iframe
│   └── microservices.ts              ← data có, nhưng lesson dùng iframe
│
├── components/lab/architecture/
│   ├── DtsNativeLab.astro            ← SWITCHER: native vs iframe
│   │                                    isNative = lessonId === 'system-design'
│   └── DtsCanvas.astro               ← Native workbench shell + <script> init
│
├── pages/lab/
│   ├── system-design.astro           ← dùng ArchitectureLabLayout, lessonId="system-design"
│   ├── aws-cloud.astro               ← dùng ArchitectureLabLayout, lessonId="aws-cloud"
│   ├── microservices.astro           ← dùng ArchitectureLabLayout, lessonId="microservices"
│   └── request-lifecycle.astro       ← dùng ArchitectureLabLayout, lessonId="request-lifecycle"
│
└── styles/
    ├── designed-to-scale.css         ← Entry point → @import "./dts/_index.css"
    ├── lab-architecture.css          ← .dts-window layout overrides (specificity fixes)
    └── dts/
        ├── _index.css                ← Import order: fonts→animations→tokens→theme→embedded→workbench→responsive
        ├── _fonts.css                ← 5x @font-face JetBrains Mono (400/500/600/700/800)
        ├── _animations.css           ← @keyframes
        ├── _tokens.css               ← :root CSS vars (DTS palette, layout vars)
        ├── _theme.css                ← Dawn Studio overrides (crimson palette, buttons)
        ├── _embedded.css             ← html.is-embedded layout (native embed mode)
        ├── _workbench.css            ← .dts-window { } + global resets + all component rules
        └── _responsive.css           ← @media breakpoints
```

**Iframe bundle (không sửa):**
```
public/dts/
├── index.html                        ← DTS sub-app shell (Vite build, served as iframe)
├── dts-bridge.js                     ← postMessage theme sync (parent → iframe)
├── dts-theme.css                     ← Theme overrides loaded by iframe (= _theme.css + _embedded.css)
└── assets/
    ├── index-BeXJu_A0.js             ← Toàn bộ DTS app JS (minified Vite bundle)
    ├── index-CxX-BAVx.css            ← Toàn bộ DTS app CSS (minified, = nội dung src/styles/dts/)
    └── jetbrains-mono-latin-*.woff2  ← Font files (5 weights)
```

---

## Việc cần làm

### Task 1 — Verify & fix system-design native (1:1 với iframe)

**Mục tiêu:** Đảm bảo `/lab/system-design` với native DtsCanvas cho ra kết quả
trực quan giống 100% với iframe tương đương (`/dts/index.html#/system-design/1`).

**Cách verify:**

```bash
# 1. Chạy dev server
npm run dev
# → localhost:4321

# 2. So sánh hai URL:
#    Native: http://localhost:4321/lab/system-design
#    Iframe ref: http://localhost:4321/dts/index.html#/system-design/1
```

Dùng Playwright để chụp screenshot so sánh từng step:

```js
// Script gợi ý — đặt ở scratch, không commit
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Native
  await page.goto('http://localhost:4321/lab/system-design');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'native-step1.png', fullPage: false });

  // Iframe ref
  await page.goto('http://localhost:4321/dts/index.html#/system-design/1');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'iframe-step1.png', fullPage: false });

  await browser.close();
})();
```

**Các điểm cần kiểm tra cụ thể:**

| Điểm | File liên quan | Cần check |
|---|---|---|
| Layout tổng thể (2 cột: stage + guide) | `_embedded.css`, `lab-architecture.css` | Tỉ lệ cột, padding, gap |
| Chiều cao sheet (canvas area) | `DtsCanvas.astro` → `fixSheetHeight()` | Sheet phải fill grid cell, không overflow |
| Theme dark/light | `_theme.css`, `DtsEngine.ts` → `setTheme()` | Toggle dark mode, màu đổi đúng |
| Font JetBrains Mono | `_fonts.css` → woff2 từ `/dts/assets/` | Text render đúng font |
| Timeline dots (step indicator) | `DtsCanvas.astro` HTML + `_workbench.css` | Dot active, done state, click navigate |
| HUD chips (metrics per step) | `DtsCanvas.astro` → `updateUI()` | Metrics update khi next/prev |
| Nav buttons (Back / Next / Pause / Replay) | `DtsCanvas.astro` → event listeners | Click hoạt động, icon swap Pause/Play |
| Keyboard navigation | `DtsCanvas.astro` → `keyHandler` | ←→ chuyển step, Space pause, R replay |
| is-embedded class trên `<html>` | `DtsCanvas.astro` → `initDts()` | Phải thêm `is-embedded` và `data-layout="tablet"` |
| Cleanup khi navigate away | `DtsCanvas.astro` → `astro:before-swap` | Engine destroy, class remove |

**Các file được phép sửa trong task này:**
- `src/components/lab/architecture/DtsCanvas.astro`
- `src/lib/dts/DtsEngine.ts` và các file trong `src/lib/dts/`
- `src/data/architecture/system-design.ts`
- `src/styles/dts/_workbench.css`, `_theme.css`, `_embedded.css`, `lab-architecture.css`

**Không được sửa:**
- `public/dts/` (toàn bộ)
- `src/components/lab/architecture/DtsNativeLab.astro` → chỉ sửa nếu task này yêu cầu rõ ràng

---

### Task 2 — Triển khai các lab còn lại (aws-cloud, microservices, request-lifecycle)

> **Chưa làm task này.** Chỉ bắt đầu sau khi Task 1 xong và đã verify.

**Mục tiêu:** Chuyển 3 lesson còn lại từ iframe sang native DtsCanvas.

**Điều kiện bắt đầu:**
- Task 1 hoàn thành, system-design native xác nhận 1:1 với iframe
- Các lesson data đã có sẵn trong `src/data/architecture/` (aws-cloud, microservices, request-lifecycle)

**Các bước:**

1. Test từng lesson data với DtsCanvas bằng cách tạm thời đổi `isNative`:

```ts
// DtsNativeLab.astro — tạm thời để test
const isNative = ['system-design', 'aws-cloud'].includes(lessonId);
```

2. Verify từng lesson (cùng phương pháp Playwright ở Task 1, so sánh native vs iframe):
   - `aws-cloud` — 9 steps (9 entities phức tạp hơn: AZ zones, ALB, ECS, Aurora)
   - `request-lifecycle` — nhiều flow animation (TCP, TLS, HTTP pipeline)
   - `microservices` — nhiều block entity, deployment flows

3. Fix từng vấn đề phát sinh per-lesson (renderer thiếu, layout off, flow animation sai...)

4. Sau khi cả 3 lesson xác nhận OK, cập nhật `DtsNativeLab.astro`:

```ts
// DtsNativeLab.astro — final
const isNative = true; // tất cả lessons dùng native
```

5. Xóa script iframe sync (phần `initLabEmbed` trong DtsNativeLab.astro) vì không còn iframe

**Command verify build sau mỗi lesson:**

```bash
npx astro check           # 0 errors
npm run build             # full build phải pass
```

---

## Quy tắc không được vi phạm

1. **Không sửa `public/dts/`** — đây là upstream bundle, chỉ dùng để reference
2. **Không sửa lesson data** (`aws-cloud.ts`, `microservices.ts`, `request-lifecycle.ts`) khi làm Task 1
3. **Không tự commit** — user quyết định khi nào commit
4. **Luôn chạy `npx astro check` trước khi báo xong** — 0 errors bắt buộc
5. **CSS token**: dùng `var(--bg)`, `var(--fg)`, `var(--accent)` cho blog shell; dùng `var(--paper)`, `var(--ink)` cho DTS workbench (hai hệ thống token khác nhau)

---

## Trạng thái hiện tại (Nov 20 2026)

| Hạng mục | Trạng thái |
|---|---|
| CSS split `src/styles/dts/` (7 partials) | ✅ Done — `_fonts`, `_animations`, `_tokens`, `_theme`, `_embedded`, `_workbench`, `_responsive` |
| CSS brace fix (`_workbench.css`) | ✅ Done — `.dts-window {}` đóng đúng vị trí sau nested rules |
| Font-face moved to `_fonts.css` | ✅ Done — xóa duplicate khỏi `lab-architecture.css` |
| Native engine `src/lib/dts/` | ✅ Done — DtsEngine, renderers, types |
| Lesson data 4 lessons | ✅ Done — system-design, aws-cloud, microservices, request-lifecycle |
| `npm run build` pass | ✅ Done — 0 errors |
| system-design native verify 1:1 | ❌ Chưa verify — **Task 1** |
| aws-cloud native | ❌ Chưa — **Task 2** |
| microservices native | ❌ Chưa — **Task 2** |
| request-lifecycle native | ❌ Chưa — **Task 2** |

---

## Task 4 — Exhaustive public DTS engine port

### Rule

Native không được xem là sẵn sàng cho đến khi native và iframe đạt:

- 0 mismatch DOM/rect/text/computed CSS
- 0 mismatch SVG viewBox/entity/link/packet markup
- 0 mismatch animation frame tại 0/80/200/380/680/820/1400ms
- 0 mismatch control/theme/gesture/frame across desktop/tablet/mobile

Không được đánh dấu đã xong chỉ vì build pass.

### Public engine constants

Port these values exactly:

- exit: 420ms
- move: 820ms
- enter: 680ms
- stagger: 130ms
- draw: 560ms
- packet: 155 units/s
- kind scales: heavy 0.7, ping 0.85, slow 0.32

### Public engine features to port

1. `layoutOf`, `planFor`, collision/dock planning
2. Scene diff: removed, changed, added entities
3. Entity exit/move/enter stagger
4. Entity tagSwap/labelSwap/cardSwap morph
5. Link remove/draw/fade/arrow/label reposition
6. Packet route/pattern/weights/burst/held/bounce/leave
7. Spotlight at new/changed entities
8. Camera 820ms move and zoom/pan gestures
9. Replay, pause, hash, keyboard, touch swipe, pinch, double-click
10. Theme retheme and exact SVG defs

### Verification matrix

- Lessons: system-design, aws-cloud, microservices, request-lifecycle
- Steps: every step
- Viewports: 1600x900, 1440x900, 1024x768, 390x844
- Themes: light/dark
- Frame clock: 0, 80, 200, 380, 680, 820, 1400ms
- Controls: Next, Back, Replay, Pause, 0/Fit, fullscreen, arrow keys, Space, R

---

## Task 3 — Native system-design 1:1 parity execution plan

> Trạng thái: chỉ là bản kế hoạch đối chiếu; chưa xem là hoàn thành.
> Public iframe là reference duy nhất. Không sửa `public/dts/`.

### Mục tiêu đo được

Native `/lab/system-design` phải khớp iframe
`/dts/index.html#/system-design/<step>` ở:

- DOM hierarchy và class names
- computed CSS
- bounding rects
- SVG `viewBox`, entity/link/packet markup
- 0/80/200/380/680/820ms transition frames
- light/dark
- desktop/tablet/mobile
- next, back, replay, pause, keyboard, touch, zoom, fit, fullscreen

### Kết quả đối chiếu ban đầu

| Phạm vi | Trạng thái |
|---|---|
| Title và guide step text | Khớp ở step 1–6 |
| Entity count | Khớp ở step 1–6 |
| Link count | Khớp ở step 1–6 |
| SVG `viewBox` | Chưa khớp |
| KPI formatting | Chưa khớp |
| Shell rect/viewport | Chưa khớp khi native so trong blog shell |
| Packet frame timing | Chưa khớp |
| Next/Back/Replay frame | Chưa verify pixel-level |

Các viewBox chênh đã đo:

| Step | Native | Iframe reference |
|---|---|---|
| 1 | `-628.35 -365.37 808.7 441.74` | `-627.02 -316.55 750 365` |
| 2 | `-432.35 -365.37 808.7 441.74` | `-417 -321.5 750 365` |
| 3 | `-432.35 -337.37 808.7 441.74` | `-417 -286.5 750 365` |
| 4 | `-432.35 -337.37 808.7 441.74` | `-417 -286.5 750 365` |
| 5 | `-482.24 -309.92 964.48 526.84` | `-426.48 -262.53 923.08 449.23` |
| 6 | `-482.24 -309.92 964.48 526.84` | `-426.48 -262.53 923.08 449.23` |

### Cách thực thi

1. Không sửa `public/dts/`.
2. Đưa native engine về public bundle engine behavior:
   - exact `planFor/layoutOf/dockRect/cardClear`
   - exact frame timing `exit 420ms`, `move 820ms`, `enter 680ms`, `stagger 130ms`, `draw 560ms`
   - exact packet timing `155px/s`, kind multipliers `heavy .7`, `ping .85`, `slow .32`
   - exact removed/added entity morph, shared entity morph, label fade/tag fade/card fade
   - exact link fade/draw/label reposition/marker and arrow state
   - exact `ok/fail` burst and packet leave behavior
   - exact zoom/pan/swipe/double-click/Fit/replay/pause behavior
3. Khớp lesson scene data trực tiếp với bundle:
   - verify `system-design.ts` theo từng step/entity/link/flow
   - data bị khác thì sửa data native
   - không thay public bundle
4. Khớp shell native với iframe reference:
   - `.window`, `.body`, `.sheet`, `.stage`, `.timeline`, `.rail`, `.guide`, `.goals`
   - measured rects phải lệch không quá 2px
   - CSS computed property phải trùng cho owner surface
5. Khớp KPI:
   - format string/number theo lesson data gốc
   - không còn `NaN`
   - label, spacing, icon, width, level animation phải giống reference
6. Khớp animation:
   - capture native và iframe cùng frame clock
   - normalize shell offset trước đối chiếu
   - so screenshot và SVG innerHTML tại từng frame
7. Khớp responsive:
   - 1600×900
   - 1440×900
   - 1024×768
   - 390×844
   - desktop/tablet/stack
8. Chỉ xác nhận task này xong khi:
   - 0 mismatch DOM text/class/geometry
   - 0 mismatch computed CSS quan trọng
   - 0 mismatch entity/link/packet markup
   - 0 mismatch frame snapshot theo tất cả mốc đã nêu
   - `npx astro check` 0 errors
   - `npm run build` pass

---

## Task 5 — Native route parity gate

Native route switching is forbidden until:

1. Public engine `planFor/layoutOf/dock/card-clear` is ported fully.
2. Native and iframe system-design frame sequences match at:
     - 0ms
     - 80ms
     - 200ms
     - 380ms
     - 680ms
     - 820ms
     - 1400ms
3. Entity/link/pill/label positions match within 2px.
4. SVG viewBox and class names match.
5. Theme, metrics, packet, and control states match.

Verified 2026-11-20:

- native and iframe entity/link counts match for system-design steps 1–6
- native and iframe Next settle at step 2 has matching title/hash
- 80/380/820/1400ms screenshots showed remaining camera/viewBox and
    link/label placement differences
- native route is therefore still gated

---

---

## Task 6 — Java & SQL Labs: Tái sử dụng DTS Shell Layout

> **Trạng thái:** Đang plan. Chưa làm bước nào.
> **Tiền đề:** Không phụ thuộc vào Task 1–5. Task này độc lập, làm song song được.

### Bối cảnh

Java và SQL lab hiện có cấu trúc 2-cột tự build riêng (`java-workbench-grid`, `sql-stage-col`),
nhưng có vấn đề:
- Cả hai đang import `Java3DStage.astro` và `Sql3DStage.astro` — hai file SVG tĩnh thủ công,
  hiện bị lỗi và chưa bao giờ được commit.
- Layout và visual language của Java/SQL không đồng bộ với DTS architecture lab.

**Mục tiêu:** Dùng lại shell `.dts-window > .window > .body > main.sheet + aside.rail`
từ `DtsCanvas.astro` cho cả Java và SQL — đồng bộ visual language, bỏ 3D SVG cũ,
thay bằng visualizer phù hợp từng concept.

---

### Quyết định visualization (đã thống nhất)

| Concept | Lab | Visualization | Lý do |
|---|---|---|---|
| Thread Pool | Java | 3D iso SVG | Workers/queue/dispatch = spatial |
| Virtual Threads | Java | 3D iso SVG | Carrier slots mounting VTs = spatial |
| JVM Heap / GC | Java | 3D iso SVG | Eden/Old/Meta zones = tầng/phòng |
| Threads/Monitors | Java | 2D state diagram | State machine, không có chiều sâu |
| CompletableFuture | Java | 2D pipeline animated | Callback chain = horizontal flight path |
| Collections | Java | Code annotation | API-driven, không spatial metaphor |
| Streams / Lambda | Java | Code annotation | Pipeline là text linear |
| Buffer Pool / Footprint | SQL | 3D iso SVG | Memory pages = stacked blocks |
| Infra / Indexes | SQL | 3D iso SVG | Table heap + index = storage layers |
| Partitioning | SQL | 3D iso SVG | Shards = split cubes |
| Replication | SQL | 3D iso SVG | Leader/follower nodes = server topology |
| Engine Pipeline | SQL | 2D pipeline animated | Parse→Optimize→Execute = stages |
| B-Tree | SQL | 2D tree animated | Tree structure = vertical clarity |
| MVCC | SQL | 2D timeline | Version chains + txn IDs = temporal |

**Rule:** 3D iso khi concept có spatial metaphor tự nhiên; 2D animated khi có thứ tự
thời gian/stages; code annotation khi gắn chặt cú pháp API.

---

### Task 6A — Tạo `LabWorkbench.astro` (generic shell)

**Mục tiêu:** Extract shell từ `DtsCanvas.astro`, thay `#canvas` bằng slot.

**File tạo mới:** `src/components/lab/LabWorkbench.astro`

**Interface:**

```ts
interface WorkbenchLesson {
  title: string;
  subtitle?: string;
  minutes?: number;
  level?: string;
  steps: {
    title: string;
    short: string;        // hiển thị trên timeline dot tooltip
    body: string[];       // các đoạn trong guide panel
    why?: string;         // callout "Why" block
    metrics?: Record<string, string>;  // HUD chips
  }[];
  goals: {
    text: string;
    step: number;         // step nào unlock goal này
  }[];
}

interface Props {
  lesson: WorkbenchLesson;
  color?: 'amber' | 'sky' | 'violet' | 'mint';  // accent color cho tab này
}
```

**HTML structure (copy từ DtsCanvas, chỉ thay canvas):**

```
.dts-window.is-embedded
  .window
    .body
      main.sheet
        #head.lesson-head         ← title, tags (minutes/level/steps)
        section.stage             ← <slot name="canvas" /> + #hud + tools
        section.timeline          ← dots + fill + step counter
      aside.rail
        section#guide             ← renderGuide() output
        section#goals             ← goals checklist
```

**JS giữ nguyên từ DtsCanvas:**
- `renderGuide(step)` — render guide panel
- `updateTimeline(step, total)` — sync dots
- `updateChips(metrics)` — HUD chips
- keyboard handler (←→ Space R)
- fixSheetHeight()
- theme observer

**CSS:** import `@/styles/designed-to-scale.css` + `@/styles/lab-architecture.css`
(không cần tạo file CSS mới cho shell vì đã có sẵn).

**Steps:**
1. Copy `DtsCanvas.astro` → `LabWorkbench.astro`
2. Xóa tất cả DTS-specific imports: `ARCH_LESSONS`, `lessonMeta`, `CHAPTERS`, `ICONS`, `LEGENDS`, `METRICS` từ `@/lib/dts/chrome`
3. Đổi props từ `lessonId?: string` → `lesson: WorkbenchLesson`
4. Thay `<DtsEngine>` / `<div id="canvas">` bằng `<slot name="canvas" />`
5. Giữ nguyên toàn bộ HTML shell, JS logic, CSS imports
6. Chạy `npx astro check` — 0 errors

---

### Task 6B — Disconnect 3D SVG cũ khỏi Java tabs

**Mục tiêu:** Bỏ dependency `Java3DStage.astro` khỏi tab components. Không xóa
file ngay — chỉ disconnect import để không block rendering.

**Files sửa:**
- `src/components/lab/java/JavaConcurrencyTab.astro` — xóa import `Java3DStage`, thay `<Java3DStage />` bằng `<div class="stage-canvas-placeholder" />`
- `src/components/lab/java/JavaJvmTab.astro` — tương tự
- `src/components/lab/sql/EnginePipeline.astro` — xóa import `Sql3DStage`, thay bằng placeholder

**Sau bước này:** Java và SQL lab phải render được mà không crash, dù canvas trống.

---

### Task 6C — Wire `JavaConcurrencyTab` vào `LabWorkbench`

**Mục tiêu:** Thay layout tự build (`java-workbench-grid`) bằng `<LabWorkbench>`.

**Map data hiện tại → `WorkbenchLesson`:**
- Mỗi `SubTopic` trong `SUBS` → 1 step
- `sub.explain` → `step.body[0]`
- `sub.why` → `step.why`
- `sub.label` → `step.title`
- `sub.id` → dùng để map metrics cho HUD chips

**Canvas slot:** Giữ placeholder `<div>` trước, 3D SVG sẽ điền sau ở Task 6E.

**Guide accordion (Technical Specs):** Giữ nguyên `<details>` accordion ở cuối
(code snippet + mechanism flow) — chỉ wrap thêm `<LabWorkbench>` ở bên ngoài.

**JS sync:** Hiện tại `JavaConcurrencyTab` có inline `<script>` với `syncConcUI()`.
Phần này cần refactor: thay vì gọi `window.updateJava3DStage()`, gọi
`workbench.goToStep(idx)` từ `LabWorkbench` API.

---

### Task 6D — Wire `JavaJvmTab` và SQL panes vào `LabWorkbench`

**JavaJvmTab:**
- Tương tự Task 6C
- HUD metrics: Heap%, MinorGCs, MajorGCs, Metaspace

**SQL EnginePipeline:**
- 8 panes → `WorkbenchLesson` với 8 steps
- Canvas slot: placeholder (2D pipeline animated sẽ điền ở Task 6F)

**SQL các pane còn lại (MVCC, B-Tree, Footprint, Partition, Replication):**
- Mỗi pane nhỏ có thể dùng `LabWorkbench` riêng hoặc giữ layout cũ
- Quyết định per-pane khi đến bước đó

---

### Task 6E — Tạo 3D iso SVG visuals (canvas slot filler)

> Thực hiện từng concept theo thứ tự độ phức tạp tăng dần.

**Mỗi visual là 1 `.astro` component** với:
- Inline SVG static (không dùng DtsEngine — vì Java/SQL concepts không có entity/link data format của DTS)
- JS `window.update<Name>Stage(state)` function để sync với guide steps

**Thứ tự làm:**
1. `ThreadPoolStage.astro` — workers (3–5 cubes), queue (shelf), dispatcher arrow
2. `JvmHeapStage.astro` — Eden/S0/S1/Old Gen/Metaspace zones as floors
3. `VirtualThreadStage.astro` — carrier slots + VT mount/unmount animation
4. `BufferPoolStage.astro` — shared_buffers pages as stacked cubes
5. `ReplicationStage.astro` — leader + standby + WAL stream topology
6. `PartitionStage.astro` — shard cubes với partition key routing
7. `InfraStage.astro` — heap + index + TOAST storage layers

**CSS:** Dùng lại `.dts-window` CSS đã có; không tạo thêm class nếu có sẵn equivalent.

---

### Task 6F — Tạo 2D animated visuals

**Mỗi visual là 1 `.astro` component** với inline SVG + CSS animation:

1. `ThreadStateDiagram.astro` — state machine NEW→RUNNABLE→BLOCKED→WAIT→TERMINATED
2. `FuturePipeline.astro` — horizontal callback chain với animated arrows
3. `SqlPipelineDiagram.astro` — Parse→Rewrite→Optimize→Execute stages (horizontal flow)
4. `BTreeDiagram.astro` — 2D tree với highlighted node traversal
5. `MvccTimeline.astro` — version chain + txn snapshot timeline

---

### Thứ tự thực thi

```
6A (LabWorkbench shell)
  → 6B (disconnect 3D)
  → 6C (wire ConcurrencyTab)
  → 6D (wire JvmTab + SQL panes)
  → 6E (3D visuals, từng cái)
  → 6F (2D visuals, từng cái)
```

6A–6D cần làm theo thứ tự (có dependency). 6E và 6F độc lập với nhau, làm song song được.

---

### Quy tắc riêng cho task này

1. Không xóa `Java3DStage.astro` / `Sql3DStage.astro` cho đến khi tất cả canvas slot đã có visual thay thế
2. `LabWorkbench.astro` không được import bất cứ gì từ `@/lib/dts/` — shell chỉ dùng CSS và generic JS
3. Mỗi 3D/2D visual component chỉ được import vào đúng tab component của nó
4. Chạy `npx astro check` sau mỗi sub-task
5. CSS token: dùng `var(--paper)`, `var(--ink)` cho DTS workbench elements; `var(--bg)`, `var(--fg)` cho blog shell elements bên ngoài workbench

---

## Trạng thái tạm dừng — 2026-11-20 16:32

### Đang có vấn đề

1. Native DTS engine mới được port một phần; chưa verify 1:1.
2. Camera và `viewBox` vẫn lệch iframe reference.
3. Card/panel/collision-aware link labels vẫn chưa chính xác.
4. Entity/link/packet transitions chưa có zero-diff frame-by-frame.
5. Native shell sizing trong blog shell chưa khớp standalone iframe.
6. KPI, pills, và label placement vẫn có kết quả chưa chính xác.

### Việc cần làm khi tiếp tục

1. Hoàn tất public engine behavior:
   - `layoutOf`
   - `planFor`
   - `dockRect`
   - `cardClear`
   - label collision placement
   - entity tag/label/card morph
   - link label/draw/arrow morph
   - packet route/burst/fail/leave
2. Chạy native và iframe cùng:
   - lesson
   - step
   - viewport
   - theme
   - performance frame clock
3. Capture `0/80/200/380/680/820/1400ms`.
4. So:
   - DOM
   - computed CSS
   - bounding rect
   - SVG markup
   - viewBox
   - entity/link/packet/pill positions
5. Chỉ bỏ gate native khi toàn bộ mismatch bằng 0.

### Cấu hình route hiện tại

Tất cả architecture route đang dùng iframe public:

- `/lab/system-design`
- `/lab/aws-cloud`
- `/lab/microservices`
- `/lab/request-lifecycle`

Native được giữ làm work-in-progress, không phải implementation chuẩn cho đến khi parity gate qua.
