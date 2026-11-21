# DTS Isometric Style — Visual Reference & Prompt

Specification for replicating the Designed-to-Scale distributed systems visualization style.

---

## What it is

Isometric SVG visualization system for animated distributed systems diagrams.
Renders servers, databases, queues, and networks as 3D-looking tile-based objects
on a grid floor, with smooth animated transitions between diagram states.

Projection type: **dimetric** (commonly called isometric).
World unit: 1 unit = 28 screen pixels (2 tile widths).

---

## Projection Math

```ts
function projectIso(x: number, y: number, z: number): [number, number] {
  const sx = 14 * (x + y);
  const sy =  7 * (x - y) - z;
  return [sx, sy];
}
// tile half-width = 14, tile half-height = 7
// tile shape: diamond 28px wide × 14px tall
```

### Depth sorting (painter's algorithm)

| Entity type | Depth value |
|---|---|
| `zone`, `ring` | −10000 (renders first, floor layer) |
| `queue` | −1000 |
| `block`, `db`, `device` | `x − y` (natural iso depth) |
| `panel` | +10000 (always on top) |

### Camera / viewBox

```ts
// Camera state: { x, y, w, h } — SVG viewBox coords
// Zoom clamp: min=0.3, max=1.6
// Round to nearest 0.05: Math.floor(s * 20 + 1e-6) / 20

function camFromScene(bounds, hostW, hostH, zoom) {
  const scale = clampZoom(zoom);
  const w = hostW / scale;
  const h = hostH / scale;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
```

---

## Entity Types

### Block (server / generic box)

```
3 visible isometric faces:
  top   = brightest (~100% base color luminance)
  right = medium    (~80%)
  left  = darkest   (~65%)
```

### Device (server rack)

Same as Block, but **enter lift = 40px** (not 120px — devices are heavy).

### DB (database cylinder)

```
Rendered bottom → top:
  bottom ellipse  (darkest)
  rect body       (medium)
  top ellipse     (brightest)
```

### Zone (floor area)

Flat diamond on the grid floor, below all blocks.
Low-opacity fill (~0.08–0.15) + slightly more visible stroke.

### Queue (message queue)

Horizontal cylinder on its side.
Depth = −1000 (renders before blocks, after zones).

### Panel (HUD overlay)

Screen-space element, always on top. Depth = +10000.

---

## Transition Animation

Three overlapping phases per step change: **exits** → **moves** → **enters**.

### Timing constants (ms)

```
exit    = 420
move    = 820
enter   = 680
stagger = 130   (per entity)
draw    = 560   (link draw-in)
```

### Phase delays

```ts
const c = exits.length   ? exit  * 0.55 : 0;  // 231ms if exits
const l = enters.length
  ? changed.length        ? c + move * 0.75    // after moves settle
  : exits.length          ? exit * 0.7          // only exits: 294ms
  : 0                                           // no transition: immediate
  : 0;
const g = exits.length   ? exit  * 0.4  : 0;  // camera delay: 168ms
```

### Easing functions

```ts
// Smooth in-out cubic — exits, moves
function easeInOut(t: number): number {
  const v = clamp01(t);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
}

// Decelerate into position — enter opacity / position
function easeOut(t: number): number {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

// Overshoot spring — enter lift
// ⚠️  MUST use 2.35 / 1.35 — NOT the standard 1.70158 / 2.70158
function easeBack(t: number): number {
  const v = clamp01(t);
  return 1 + 2.35 * Math.pow(v - 1, 3) + 1.35 * Math.pow(v - 1, 2);
}
```

### Per-entity tweens

| Phase   | delay      | dur    | ease           | what changes |
|---------|------------|--------|----------------|---|
| EXIT    | 0          | exit   | easeInOut      | opacity 1→0, lift 0→−22px |
| CHANGED | c          | move   | easeInOut      | position interpolation |
| ENTER   | l + i×130  | enter  | easeOut        | opacity 0→1 |
| ENTER   | l + i×130  | enter  | easeBack       | lift +120px→0 (device: +40px→0) |

### Link draw-in timing

```ts
// stroke-dashoffset animation draws link in after entities settle
// p = link index (stagger order)
const drawStart =
  Math.max(settle[link.from], settle[link.to], c + (changed.length ? move * 0.6 : 0))
  + 60 + p * 90;

// Removed links: fade opacity 1→0 over 300ms
```

---

## Camera & HUD

### Grid vignette

```ts
// Radial gradient in SVG defs — fades grid at edges
// radius = viewBox.w × 0.56   (NOT 0.75)
// gradientTransform = "scale(1, 0.6)"  → elliptical falloff

gridFade.setAttribute('cx', `${cam.x + cam.w / 2}`);
gridFade.setAttribute('cy', `${cam.y + cam.h / 2}`);
gridFade.setAttribute('r',  `${cam.w * 0.56}`);
gridFade.setAttribute('gradientTransform',
  `translate(${cx} ${cy}) scale(1 0.6) translate(${-cx} ${-cy})`);
```

### HUD layer transform

```ts
// HUD renders at screen coordinates regardless of camera zoom/pan
// Scale precision: .toFixed(5)
const hudScale = (cam.w / hostWidth).toFixed(5);
hud.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${hudScale})`);
```

### Particle flows

- Small dots animated along link paths (stroke-dashoffset or point-on-path)
- Pre-warm on `settle()` at `acc = 0.6` — avoids cold-start empty paths
- Particles loop continuously, rate controlled per link

---

## Color Palette

| Entity type | Hue |
|---|---|
| compute / server | `#1f6feb` (blue) |
| database | `#f78166` (coral) |
| cache | `#3fb950` (green) |
| queue / broker | `#d29922` (amber) |
| client / device | `#bc8cff` (purple) |
| zone fill | entity hue × 0.1 opacity |

| Theme | Background | Grid stroke | Link | Label |
|---|---|---|---|---|
| dark | `#0d1117` | `#2d3748` op 0.4 | `#58a6ff` op 0.5 | `#8b949e` |
| light | `#ffffff` | `#d0d7de` op 0.6 | `#0969da` op 0.5 | `#57606a` |

---

## SVG Layer Structure

```html
<svg>
  <defs>  <!-- radial gradients, clip paths -->  </defs>
  <g id="grid-layer">    <!-- isometric grid tiles        --> </g>
  <g id="floor-layer">   <!-- zones and rings             --> </g>
  <g id="entity-layer">  <!-- blocks, dbs, devices        --> </g>
  <g id="link-layer">    <!-- connection lines            --> </g>
  <g id="label-layer">   <!-- entity labels (screen-space)--> </g>
  <g id="hud-layer">     <!-- step counter, zoom controls --> </g>
</svg>
```

---

## Visual Rules

- Derive all three face colors from a single base hue (top=100%, right=80%, left=65%)
- Labels render below each entity, centered, in a monospace or sans font
- Links: 1px stroke, dashed or solid, with animated particle dots
- **No drop shadows** — depth is implied by color and painter's order only
- Transitions feel physical: entities spring in from above (easeBack), sink slightly on exit

---

## Full Replication Prompt

Paste into any AI to generate a DTS-style isometric diagram system from scratch.

```
Draw an animated isometric distributed systems diagram in SVG using this exact specification:

## PROJECTION
Use dimetric (isometric) projection:
  sx = 14 * (x + y)
  sy = 7  * (x - y) - z
World units: 1 unit = 28 screen pixels (2 tile widths).
Tile shape: diamond, 28px wide × 14px tall.

## GRID
Draw an isometric grid on the floor. Grid lines every 1 world unit.
Fade grid at edges using an SVG radial gradient
(r = viewBox.w × 0.56, gradientTransform="scale(1 0.6)" for an elliptical falloff).

## ENTITY TYPES
Render entities depth-sorted (painter's algorithm) in this order:
1. ZONE (depth −10000): flat diamond on the floor, low-opacity fill + stroke
2. RING (depth −10000): circular zone variant
3. QUEUE (depth −1000): horizontal cylinder lying on its side
4. BLOCK (depth = x − y): isometric box with 3 faces (top / left / right)
   - top face: brightest (~100% luminance of base color)
   - right face: medium (~80%)
   - left face: darkest (~65%)
5. DB (depth = x − y): vertical cylinder (top ellipse + rect body + bottom ellipse)
6. DEVICE (depth = x − y): same as BLOCK but enter-lift = 40px (not 120px)
7. PANEL (depth +10000): screen-space overlay, always on top

## ANIMATION (step transitions)
Three overlapping phases per step change:

Timing constants (ms): exit=420, move=820, enter=680, stagger=130, draw=560

Phase delays:
  c = exits?  exit × 0.55 : 0
  l = enters? (changed? c + move×0.75 : exits? exit×0.7 : 0) : 0
  g = exits?  exit × 0.4  : 0   (camera delay)

Easing functions — USE THESE EXACT IMPLEMENTATIONS:
  easeInOut(t): t<0.5 ? 4t³ : 1 − (−2t+2)³/2       (exits, moves)
  easeOut(t):   1 − (1−t)³                            (enter opacity)
  easeBack(t):  1 + 2.35·(t−1)³ + 1.35·(t−1)²       (enter lift, overshoot)
  NOTE: easeBack uses 2.35/1.35, NOT the standard 1.70158/2.70158 constants.

Per-entity tweens:
  EXIT:    delay=0,         dur=exit,  ease=easeInOut, opacity: 1→0, lift: 0→−22px
  CHANGED: delay=c,         dur=move,  ease=easeInOut, position interpolation
  ENTER:   delay=l+i×130ms, dur=enter, ease=easeOut (opacity), easeBack (lift: +120px→0)
  DEVICE enter lift = +40px (not +120px)

Link draw-in timing (stroke-dashoffset animation):
  drawStart = max(settle[from], settle[to], c + (changed? move×0.6 : 0)) + 60 + p×90
  Removed links: fade opacity 1→0 over 300ms

## CAMERA
  viewBox = { x: cx−w/2, y: cy−h/2, w: hostW/zoom, h: hostH/zoom }
  Zoom clamp: [0.3, 1.6], round to nearest 0.05
  HUD transform: translate(cam.x cam.y) scale((cam.w/hostW).toFixed(5))
  Camera animate with easeInOut, delay = g

## PARTICLE FLOWS
  Animate small dots along link paths (stroke-dashoffset or point-on-path).
  Pre-warm flows at acc=0.6 so paths are populated immediately on settle.

## COLOR TOKENS
  Semantic hues (consistent across light/dark themes):
    compute/server: #1f6feb   database: #f78166   cache: #3fb950
    queue/broker:   #d29922   device:   #bc8cff
  Dark bg: #0d1117,  grid stroke: #2d3748 opacity 0.4
  Light bg: #ffffff, grid stroke: #d0d7de opacity 0.6
  Link: #58a6ff opacity 0.5    Label text: fg-dim token

## SVG LAYER STRUCTURE
  <svg>
    <defs>  radial gradients, clip paths  </defs>
    <g id="grid-layer">    isometric grid tiles         </g>
    <g id="floor-layer">   zones and rings              </g>
    <g id="entity-layer">  all blocks, dbs, devices     </g>
    <g id="link-layer">    connection lines             </g>
    <g id="label-layer">   entity labels (screen-space) </g>
    <g id="hud-layer">     step counter, zoom controls  </g>
  </svg>

## VISUAL RULES
- Always derive face colors from a single base hue (top=100%, right=80%, left=65%)
- Labels render below each entity, centered, in a monospace or sans font
- Links: 1px stroke, dashed or solid, with animated particle dots
- No drop shadows — depth is implied by color and painter's order only
- Transitions feel physical: entities enter from above with a spring overshoot,
  exit by sinking slightly while fading, and move smoothly between positions
```

---

*Source: extracted from `public/dts/assets/index-BeXJu_A0.js` (DTS bundle)*
*Native implementation: `src/lib/dts/DtsEngine.ts`*

---

## Concept Map — Java Lab

Quyết định visualization cho từng concept trong `/lab/java`.

### Decision rule

> **Dùng isometric 3D khi concept có spatial metaphor tự nhiên** — tức là "cái gì đang ở đâu, ai đang block ai, luồng di chuyển ra sao" có thể vẽ thành vị trí trên không gian.
>
> **Dùng timeline / sequence diagram khi concept là thứ tự sự kiện theo thời gian** — tức là "cái gì xảy ra trước, cái gì xảy ra sau" quan trọng hơn vị trí.
>
> **Dùng code annotation / highlight khi concept gắn với cú pháp ngôn ngữ** — tức là bạn muốn chỉ vào một dòng code và giải thích nó làm gì.

---

### Java Concurrency tab — **Isometric 3D (DTS style)**

**Lý do:** Concurrency có spatial metaphor mạnh — thread là actor di chuyển trong không gian, monitor/lock là cánh cổng, shared memory là khu vực có ranh giới. Người xem nhìn vào scene và trực giác hiểu "thread đang đứng chờ trước cổng kia."

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Thread | BLOCK (cube) | Mỗi thread 1 màu riêng | Label = tên thread (T1, T2…) |
| Monitor / lock | ZONE (floor area) + cổng SVG | amber `#d29922` | Vùng sàn highlight khi bị giữ |
| Shared variable / heap object | DB (cylinder) | coral `#f78166` | Nhiều thread cùng trỏ tới |
| CPU core | DEVICE (rack) | blue `#1f6feb` | Thread đứng "trên" core = đang chạy |
| Thread pool | ZONE lớn bao quanh nhiều BLOCK | blue nhạt | Ranh giới pool |
| Queue (blocking queue) | QUEUE (horizontal cylinder) | amber `#d29922` | Packet chạy qua = item trong queue |

**Step sequence gợi ý (Synchronized example):**
1. Hai thread T1, T2 ngoài monitor zone
2. T1 đi vào zone (acquire lock) — T2 bị block ngoài cổng
3. T1 đọc/ghi DB entity (shared var)
4. T1 rời zone — T2 đi vào
5. T2 đọc/ghi DB entity

**Particle flows:** Chạy từ thread → shared object khi đang read/write. Dừng khi thread bị block.

---

### Java JVM tab — **Isometric 3D (DTS style) + text overlay**

**Lý do:** JVM memory regions (heap, stack, metaspace) là không gian vật lý có thể vẽ thành zone. GC là "sweeper" di chuyển trong zone. Stack frames stack lên nhau theo chiều cao (trục Z) rất tự nhiên với isometric.

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Heap (Young Gen) | ZONE lớn | green `#3fb950` | Eden + Survivor chia sub-zone |
| Heap (Old Gen) | ZONE lớn | blue `#1f6feb` | |
| Metaspace | ZONE nhỏ ở góc | purple `#bc8cff` | |
| Stack frame | BLOCK xếp chồng (Z tăng dần) | amber `#d29922` | Label = method name |
| Object instance | DB nhỏ trong heap zone | coral `#f78166` | |
| GC thread | DEVICE di chuyển qua zone | xám | Particle = objects bị sweep |
| ClassLoader | BLOCK đặc biệt → metaspace | purple | |

**Step sequence gợi ý (GC cycle):**
1. Nhiều object nhỏ trong Eden
2. Minor GC: các object "chết" fade out, object sống move sang Survivor
3. Object sống lâu promote lên Old Gen (move animation)
4. Full GC: sweeper quét toàn heap

**Text overlay (PANEL entity):** Hiển thị heap usage % và GC pause time như HUD chip.

---

### Java Regular tab — **Code annotation + sequence**

**Lý do:** Các concept ở tab này (generics, streams, lambdas, annotations) gắn chặt với cú pháp — người xem cần nhìn vào code để hiểu. Không có spatial metaphor rõ ràng. Dùng code block với highlight + mũi tên annotation thay vì 3D.

| Concept | Format |
|---|---|
| Generics type bounds | Code snippet + highlight dòng + text note bên phải |
| Stream pipeline | Horizontal flow diagram: `source → filter → map → collect` với boxes + arrows |
| Lambda / method ref | Code snippet + highlight + "shorthand for" annotation |
| Annotation processing | Vertical flow: `@Annotation` → APT → generated class |
| Exception hierarchy | Tree diagram (SVG, không phải isometric) |

**Vì sao không dùng 3D ở đây:** Streams và generics là về type transformation — không có "ai đứng ở đâu". Dùng 3D sẽ tạo ra metaphor giả tạo và làm phức tạp hơn thay vì giải thích rõ hơn.

---

## Concept Map — SQL Lab

Quyết định visualization cho từng tab trong `/lab/sql`.

---

### Engine Pipeline tab — **Isometric 3D (DTS style)**

**Lý do:** Query execution pipeline là luồng di chuyển qua các stage vật lý: Parser → Planner → Optimizer → Executor → Storage. Đây là pipeline tuyến tính với spatial metaphor rõ ràng — query đi từ trái sang phải qua các "trạm".

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Parser | BLOCK | blue `#1f6feb` | Label: "Parser" |
| Planner | BLOCK | blue | Label: "Planner" |
| Optimizer | BLOCK | amber `#d29922` | Label: "Optimizer" |
| Executor | DEVICE (rack) | blue | Label: "Executor" |
| Storage / Heap file | DB | coral `#f78166` | Label: "Heap" |
| Index (B-Tree) | DB đặc biệt | green `#3fb950` | Label: "Index" |
| Query token / result row | Particle | — | Chạy dọc theo pipeline |

**Step sequence gợi ý:**
1. SQL text token đi vào Parser
2. Parse tree rời Parser, vào Planner
3. Planner tạo plan tree, Optimizer chọn path
4. Executor đọc từ Index hoặc Heap (particle path rẽ)
5. Result rows trả về client

---

### MVCC tab — **Isometric 3D + timeline overlay**

**Lý do:** MVCC có hai chiều đồng thời: không gian (version chain trong heap page) và thời gian (transaction snapshot). Dùng 3D cho version chain (các DB entity xếp chồng = version cũ→mới), và thêm horizontal timeline ở HUD để show transaction timestamp.

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Heap page | ZONE | xám nhạt | Chứa các tuple version |
| Tuple version (live) | DB nhỏ | green `#3fb950` | xmin/xmax label |
| Tuple version (dead) | DB nhỏ, opacity 40% | xám | Đã bị supersede |
| Transaction | BLOCK di chuyển | Mỗi txn 1 màu | Label: txid |
| Vacuum thread | DEVICE | xám | Sweep dead tuples |

**Step sequence gợi ý:**
1. T1 đọc row (particle từ T1 block → tuple, snapshot highlight)
2. T2 UPDATE tạo tuple mới (DB mới xuất hiện, DB cũ opacity giảm)
3. T1 vẫn thấy version cũ (snapshot isolation — particle vẫn trỏ tuple cũ)
4. T2 COMMIT — tuple cũ marked dead
5. VACUUM sweep: dead tuple fade out

---

### B-Tree tab — **Isometric 3D (tree layout)**

**Lý do:** B-Tree là cấu trúc không gian thuần túy — node root ở trên, leaf ở dưới, path search là di chuyển từ trên xuống. Isometric 3D render tree theo chiều dọc (trục Y) + chiều sâu (trục Z) rất tự nhiên.

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Internal node | BLOCK | blue `#1f6feb` | Label: key range |
| Leaf node | BLOCK nhỏ hơn | green `#3fb950` | Label: row pointer |
| Root node | BLOCK to hơn, lifted Z | amber `#d29922` | |
| Search path | Link highlight + particle | — | Particle chạy từ root → leaf |
| Page split | Animation: 1 node → 2 nodes | — | easeBack enter |

**Step sequence gợi ý (B-Tree search):**
1. Query đi vào root
2. Particle chạy xuống internal nodes theo key comparison
3. Particle đến leaf node, found/not-found state
4. *(Insert sequence)* Key insert → leaf full → page split animation

---

### Partitioning tab — **Isometric 3D (DTS style)**

**Lý do:** Partitioning là phân chia dữ liệu ra nhiều "kho" vật lý — rất phù hợp isometric ZONE + DB. Partition pruning là việc "bỏ qua" các zone không liên quan — có thể show bằng opacity.

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Partition (range/list/hash) | ZONE + DB bên trong | Mỗi partition 1 màu | Label: range hoặc hash key |
| Partition key column | PANEL overlay | — | Show formula: `partition_by` |
| Query scan path | Particle | — | Chỉ chạy qua partition relevant |
| Pruned partition | ZONE opacity 20% | xám | "Skipped" |
| Parent table | ZONE bao ngoài tất cả | xám nhạt | |

**Step sequence gợi ý:**
1. Toàn bộ partitions hiển thị
2. Query với `WHERE month = 'Nov'` vào
3. Planner prune: 11/12 partitions fade
4. Particle chỉ scan partition tháng 11
5. Rows trả về

---

### Replication tab — **Isometric 3D (distributed topology)**

**Lý do:** Replication là topology mạng phân tán — primary/replica là nodes, WAL stream là flow, failover là topology thay đổi. Đây là use case gần nhất với DTS architecture diagrams. Reuse DTS patterns trực tiếp.

| Concept | Hình dạng entity | Màu | Ghi chú |
|---|---|---|---|
| Primary DB | DB lớn | coral `#f78166` | Label: "Primary" |
| Replica DB | DB nhỏ hơn | coral nhạt | Label: "Replica N" |
| WAL stream | QUEUE | amber `#d29922` | Packet = WAL record |
| Client write | DEVICE | blue `#1f6feb` | |
| Client read | DEVICE khác | purple | Trỏ tới replica |
| Failover | Animation: replica promote lên primary | — | Label swap + màu đổi |

**Step sequence gợi ý:**
1. Client write vào Primary → WAL record tạo ra
2. WAL packet stream sang Replica 1, Replica 2
3. Replica apply — replication lag hiển thị ở PANEL chip
4. *(Failover)* Primary fail (fade) → Replica 1 promote (move up + màu đổi)
5. Client read redirect tới Replica 2

---

## Shared component — Lab shell

Tất cả Java và SQL tabs đều dùng **cùng một shell layout** như DTS:

```
.window
  .body
    main.sheet          ← 3D canvas (DtsEngine / custom SVG)
    aside.rail          ← guide card + timeline + goals
      .guide
        .eyebrow        ← "Step N / M"
        h2.title
        .explain
        .why
      .timeline
        ol > li > button
      .goals
      .chips            ← HUD metrics (optional)
```

Tại sao dùng cùng shell:
- Người dùng học layout 1 lần, dùng mọi nơi
- Timeline + guide là pattern phổ biến cho "step-by-step walkthrough"
- Chip HUD linh hoạt: Java dùng để show thread count / lock contention, SQL dùng để show rows scanned / cost estimate
