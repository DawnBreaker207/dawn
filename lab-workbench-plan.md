# Java & SQL Lab Workbench — Plan

> Task 6 — độc lập với Task 1–5, làm song song được.

---

## Execution Order

```
6A → 6B → 6C → 6D → ┬→ 6E  (parallel)
                      └→ 6F  (parallel)
```

6A–6D: sequential (có dependency).  
6E và 6F: song song với nhau sau khi 6D xong.

---

## Sub-tasks

### 6A — Tạo `LabWorkbench.astro`

**File mới:** `src/components/lab/LabWorkbench.astro`

Copy `DtsCanvas.astro`. Xóa tất cả DTS-specific imports (`ARCH_LESSONS`, `CHAPTERS`, `ICONS`, `LEGENDS`, `METRICS` từ `@/lib/dts/chrome`). Đổi props sang `WorkbenchLesson`. Thay `<DtsEngine>` / `#canvas` bằng `<slot name="canvas" />`. Giữ nguyên toàn bộ JS shell và CSS imports.

```ts
interface WorkbenchLesson {
  title: string;
  subtitle?: string;
  minutes?: number;
  level?: string;
  steps: {
    title: string;
    short: string;
    body: string[];
    why?: string;
    metrics?: Record<string, string>;
  }[];
  goals: { text: string; step: number }[];
}
```

**Rule:** `LabWorkbench.astro` không được import bất cứ gì từ `@/lib/dts/`.

---

### 6B — Disconnect broken 3D SVG

**Files sửa:**
- `src/components/lab/java/JavaConcurrencyTab.astro` — xóa import `Java3DStage`, thay `<Java3DStage />` bằng `<div class="stage-canvas-placeholder" />`
- `src/components/lab/java/JavaJvmTab.astro` — tương tự
- `src/components/lab/sql/EnginePipeline.astro` — xóa import `Sql3DStage`

**Rule:** Không xóa `Java3DStage.astro` / `Sql3DStage.astro` cho đến khi tất cả canvas slot có visual thay thế.

---

### 6C — Wire `JavaConcurrencyTab` → `LabWorkbench`

Thay `java-workbench-grid` layout bằng `<LabWorkbench>`. Map `SubTopic[]` → `WorkbenchLesson.steps`. Refactor `syncConcUI()` để gọi workbench step API thay vì `window.updateJava3DStage()`. Giữ Technical Specs accordion ở cuối.

**Files sửa:** `java/JavaConcurrencyTab.astro`

---

### 6D — Wire `JavaJvmTab` + SQL panes → `LabWorkbench`

Tương tự 6C.

- JVM tab HUD chips: `Heap%`, `MinorGCs`, `MajorGCs`, `Metaspace`
- SQL EnginePipeline: 8 panes → 8 steps
- Các SQL pane còn lại: quyết định per-pane khi đến

**Files sửa:** `java/JavaJvmTab.astro`, `sql/EnginePipeline.astro`

---

### 6E — 3D Isometric SVG visuals

> **Lưu ý:** Tái sử dụng engine 3D có sẵn (`StageEngine` + `DtsSceneRenderer` từ DTS/system-design) và các định nghĩa bài học tương ứng trong `src/lib/dts/lessons.ts` (ví dụ: `indexesLesson`, `replicationLesson`, `shardingLesson`, `javaConcurrencyLesson`). Không tạo mới engine nếu đã có sẵn.

Mỗi component: cắm vào `DtsSceneRenderer` hoặc inline SVG isometric có kết nối state. Thứ tự thực hiện:

| Component | Concept | Metaphor |
|---|---|---|
| `ThreadPoolStage.astro` | Thread Pool | Workers = cubes, queue = shelf |
| `JvmHeapStage.astro` | JVM Heap / GC | Eden/S0/S1/Old/Meta = tầng/phòng |
| `VirtualThreadStage.astro` | Virtual Threads | Carrier slots mount/unmount VTs |
| `BufferPoolStage.astro` | Buffer Pool | shared_buffers pages = stacked cubes |
| `ReplicationStage.astro` | Replication | Leader + standby + WAL stream |
| `PartitionStage.astro` | Partitioning | Shard cubes + partition key routing |
| `InfraStage.astro` | Infra / Indexes | Heap + index + TOAST = storage layers |

---

### 6F — 2D Animated visuals & Synced Code Flow (Non-3D Architecture)

> **Nguyên tắc cốt lõi:**
> 1. **Khung chung (`LabWorkbench.astro`):** Tất cả các bài 2D vẫn dùng chung 100% khung `LabWorkbench`, nhận event `wb:step-change` từ Guide deck bên phải để đồng bộ trạng thái.
> 2. **Tách vùng Stage (Split Stage Pattern):** Không để sơ đồ 2D đơn độc trên một canvas lớn. Vùng `<slot name="canvas">` được chia tầng để đồng thời hiển thị **Sơ đồ trực quan (Visual)** và **Khung Code đồng bộ (Code Flow Tracker)**.
> 3. **Code-to-Visual Synced Execution:** Khi chuyển step, mũi tên/node trên sơ đồ 2D kích hoạt animation, đồng thời dòng code tương ứng bên dưới sáng lên (`.line-active`), có badge hiển thị runtime metrics/biến tức thời.

#### Bố cục chuẩn của 2D Stage Component:
```
┌─────────────────────────────────────────────────────────────┐
│ 1. VISUAL STAGE (Tầng trên ~60%): Sơ đồ 2D SVG động        │
│    Hiển thị State Machine, B-Tree, hoặc Timeline Swimlanes  │
├─────────────────────────────────────────────────────────────┤
│ 2. CODE FLOW TRACKER (Tầng dưới ~40%): Code snippet đồng bộ │
│    Đánh số dòng, highlight dòng lệnh đang thực thi          │
│    Kèm live runtime values (vd: thread state, xmin/xmax)    │
└─────────────────────────────────────────────────────────────┘
```

#### Chi tiết các component 2D:

| Component | Concept | Dạng Visual | Code Flow Tracking đi kèm |
|---|---|---|---|
| `ThreadStateDiagram.astro` | Threads / Monitors | 2D State Machine (NEW→RUNNABLE→BLOCKED→WAITING→TIMED_WAITING→TERMINATED) | Code Java: `start()`, `synchronized(lock)`, `wait()`, `notify()`. Line highlight theo trạng thái luồng. |
| `FuturePipeline.astro` | CompletableFuture | 2D Horizontal Pipeline + nhánh rẽ Exception | Code Java: `supplyAsync()` → `thenApply()` → `exceptionally()`. Toggle kịch bản Thành công vs Ngoại lệ. |
| `SqlPipelineDiagram.astro` | Engine Pipeline | 2D Process Pipeline (Parser → Rewriter → Planner → Executor) | Câu lệnh SQL + AST node/Plan node tương ứng với từng giai đoạn xử lý. |
| `BTreeDiagram.astro` | B-Tree Index | 2D Vertical Tree (Phân cấp Root → Internal Nodes → Leaf Pages) | Pseudo-code thuật toán tìm kiếm / split trang + truy vấn `WHERE id = ?` tương ứng. |
| `MvccTimeline.astro` | PostgreSQL MVCC | 2D Temporal Swimlanes ($t_0 \to t_5$) giữa Txn A (Writer) và Txn B (Reader) | 2 khung code SQL song song của Txn A và Txn B. Tuple `xmin`/`xmax` đổi màu trực tiếp khi commit/rollback. |
| *(existing jx-row)* | Collections, Streams | Code annotation tương tác | Giữ nguyên dạng chú giải dòng code từng bước (API-driven). |

---

## Visualization Decisions

| Concept | Lab | Type | Lý do |
|---|---|---|---|
| Thread Pool | Java | 3D iso | Workers + queue + dispatch = spatial kitchen |
| Virtual Threads | Java | 3D iso | Carrier slots mounting VTs = slot machine |
| JVM Heap / GC | Java | 3D iso | Memory zones (Eden/Old/Meta) = tầng/phòng |
| Threads / Monitors | Java | 2D state | State machine — không có chiều sâu không gian |
| CompletableFuture | Java | 2D pipeline | Callback chain = horizontal, lỗi = stage |
| Collections / Streams | Java | Code annotation | API-driven, không spatial metaphor |
| Buffer Pool / Footprint | SQL | 3D iso | Memory pages = stacked cubes |
| Infra / Indexes | SQL | 3D iso | Heap + index + TOAST = storage layers |
| Partitioning | SQL | 3D iso | Shards = split cubes + key routing |
| Replication | SQL | 3D iso | Leader + follower + WAL = server topology |
| Engine Pipeline | SQL | 2D pipeline | Parse→Optimize→Execute = ordered stages |
| B-Tree | SQL | 2D tree | Tree structure cần vertical clarity |
| MVCC | SQL | 2D timeline | Version chains + txn IDs = temporal |

**Rule:** 3D iso khi có spatial metaphor tự nhiên; 2D animated khi có thứ tự thời gian/stages; code annotation khi gắn chặt cú pháp API.

---

## Constraints

- `LabWorkbench.astro` không import từ `@/lib/dts/`
- Không xóa `Java3DStage.astro` / `Sql3DStage.astro` cho đến khi tất cả canvas slot có visual thay thế
- Mỗi visual component chỉ được import vào đúng tab component của nó
- `npx astro check` sau mỗi sub-task — 0 errors
- CSS token: `var(--paper)` / `var(--ink)` cho DTS workbench elements; `var(--bg)` / `var(--fg)` cho blog shell

---

## 7. Kiến Trúc Route & Phân Định Chủ Đề (Tracks & Architecture)

### A. Route miêu tả Blog: `architecture` (`/lab/architecture`)
* **Tên hiển thị:** Dawn Blog Architecture
* **Nội dung:** Miêu tả flow thực tế của chính website này (Cloudflare Edge-First, C4 Container Model, Data Plane vs Control Plane, Zero-Trust DB).
* **Đặc tính:** Độc lập hoàn toàn, không dùng chung dropdown bài học lý thuyết với các môn học khác.

### B. 6 Trục Chủ Đề Giáo Trình (Curriculum Learning Tracks):
1. **`foundations`** (`/lab/foundations`): Nền tảng mạng & Web (Request Lifecycle, Latency/Throughput, Napkin Math).
2. **`system-design`** (`/lab/system-design`): Thiết kế hệ thống phân tán (Consistent Hashing, Caching, Rate Limiter, Message Queues, Snowflake ID, CAP/Consensus).
3. **`cloud-aws`** (`/lab/aws-cloud`): Điện toán đám mây AWS (Route 53, ALB, ECS Fargate, SQS Queue, ElastiCache, Aurora Multi-AZ).
4. **`microservices`** (`/lab/microservices`): Kiến trúc phân tán Microservices & Sagas (API Gateway, Sagas, Circuit Breaker).
5. **`sql`** (`/lab/sql`): Database & Postgres Engine (B-Tree, MVCC, Buffer Pool, Partitioning, Replication, Pipeline).
6. **`java`** (`/lab/java`): Java & Runtime Internals (Concurrency, Thread Pool, Virtual Threads, JVM Heap/GC).

### C. Quy cách Navbar & Dropdown:
* **UI/UX chuẩn `request-lifecycle`:** Giữ nguyên 100% form dáng quen thuộc của `ArchitectureChapterPicker.astro` (trigger font-mono có icon, tên bài, badge đếm bài ▾; floating panel 320px có ô search filter và danh sách bài có dot `●` + pill trạng thái).
* **Contextual Data Scope:** Ở trang nào thì dropdown chỉ load danh sách các bài học con thuộc riêng trang đó (3–8 bài), thay vì nhét chung toàn bộ 42 bài.

---

## 8. Kế Hoạch Xẻ Nhỏ File & Tối Ưu Cấu Trúc Code (Modularization & File Hygiene)

Mục tiêu kỹ thuật: **Không có file nào vượt quá 500 dòng**, tuân thủ đúng phân tầng (Data tĩnh $\to$ `src/data/`, Giao diện $\to$ `src/components/`, Logic $\to$ `src/scripts/`, Page $\to$ thin shell).

### 8.1 Xẻ nhỏ `src/pages/lab/sql.astro` (1.474 dòng → < 80 dòng)
* **Thực trạng:** 1 file page ôm đồm cả 10 tab, style ẩn, concept strips và SVG definition.
* **Tái cấu trúc:**
  * Page `sql.astro` chỉ làm thin shell nạp Layout và Component chủ `<SqlLab />`.
  * Tách 10 tab thành các component con trong `src/components/lab/sql/tabs/`:
    * `EnginePipelineTab.astro`, `BTreeTab.astro`, `MvccTab.astro`, `BufferPoolTab.astro`, `PartitionTab.astro`, `ReplicationTab.astro`...
  * Dữ liệu lý thuyết tĩnh (stages, OIDs, concept strips) chuyển sang `src/data/sql/`.

### 8.2 Module hóa `lessons.ts` & `runtime-curriculum.ts` (19.000 dòng → Domain Modules)
* **Thực trạng:** Hơn 19.000 dòng dữ liệu bài học dồn vào 2 file duy nhất gây chậm IDE và không thể review code.
* **Tái cấu trúc:**
  * Tạo thư mục module `src/lib/dts/lessons/`:
    * `foundations/` (`request-lifecycle.ts`, `latency.ts`...)
    * `cloud/` (`aws-cloud.ts`...)
    * `data/` (`indexes.ts`, `replication.ts`, `sharding.ts`...)
    * `concurrency/` (`java-concurrency.ts`...)
  * File `src/lib/dts/lessons.ts` chỉ làm nhiệm vụ barrel export index mỏng (< 50 dòng): `export * from './lessons/...'`.
  * Dọn dẹp loại bỏ các file bundle thừa (`runtime-curriculum.ts`, `runtime-app.ts`).

### 8.3 Chuyển `java-data.ts` (1.927 dòng) sang `src/data/java/`
* **Thực trạng:** File data tĩnh nằm sai vị trí trong `src/scripts/` (vốn chỉ dành cho TS điều khiển DOM).
* **Tái cấu trúc:**
  * Chuyển sang `src/data/java/` và chia nhỏ theo domain:
    * `src/data/java/concurrency.ts` (~300 dòng)
    * `src/data/java/jvm-memory.ts` (~300 dòng)
    * `src/data/java/collections.ts` (~200 dòng)
  * Thư mục `src/scripts/lab/java/` chỉ giữ lại script logic chạy mô phỏng (`sim-engine.ts`, `java-tabs.ts`), giảm 80% kích thước.

### 8.4 Dọn dẹp File Backup (`.bak`) & File rác
* Xóa dứt điểm các file backup cũ trôi nổi:
  * `src/pages/lab/sql.astro.bak`
  * `src/pages/lab/sql.astro.pre3d.bak`
  * `src/pages/lab/java.astro.bak`
* Đảm bảo `src/pages/lab/` chỉ chứa các file route `.astro` chính thức.

---

## 9. Giải Mã & Chuẩn Hóa Engine (Engine De-obfuscation & Clean Architecture)

> **Mục tiêu:** Xóa bỏ hoàn toàn mã nguồn bị Vite nén (mangled/minified 1–2 ký tự), khôi phục mã TypeScript tường minh, kiểu dữ liệu strict, và xóa bỏ `// @ts-nocheck`.

### 9.1 Xóa sạch > 20.000 dòng Dead/Ghost Code trong `src/lib/dts/`
* Xóa các file bundle tàn dư không được import ở bất kỳ đâu trong `src/`:
  * `src/lib/dts/runtime-curriculum.ts` (12.749 dòng)
  * `src/lib/dts/runtime-app.ts` (5.489 dòng)
  * 8 file `src/lib/dts/runtime-lessons-*.ts` (> 2.500 dòng)
* Giảm ngay 50% tổng dung lượng thư mục `src/lib/dts/`.

### 9.2 Giải mã biến & hàm trong `runtime-draw.ts` (1.000 dòng)
Dựa theo bản đặc tả gốc trong `LAB_VIZ.md`, đổi toàn bộ định danh bị nén sang tên chuẩn:
* Phép chiếu & toán:
  * `j(x, y, z)` $\to$ `projectIso(x, y, z)`
  * `A(val)` $\to$ `round(val, decimals=2)`
  * `Tr(path)` / `Er(path)` $\to$ `trimPathStart(path)` / `trimPathEnd(path)`
  * `Sr(poly)` / `Cr(path)` $\to$ `smoothPolygon(poly)` / `smoothPath(path)`
  * `sf(hex)` / `cf(h, s, l)` $\to$ `hexToHsl(hex)` / `hslToRgb(h, s, l)`
  * `vr` $\to$ `PALETTE_SHADES` (top / right / left faces)
* Renderers theo thực thể:
  * `Zr` $\to$ `renderBlockEntity(entity)`
  * `li` $\to$ `renderDeviceEntity(entity)`
  * `fi` $\to$ `renderDbEntity(entity)`
  * `mi` $\to$ `renderZoneEntity(entity)`
  * `gi` $\to$ `renderQueueEntity(entity)`
  * `zr` $\to$ `renderPill(pill)`
  * `jr` $\to$ `buildDefs(theme)`
* Tách nhỏ thành các module trong `src/lib/dts/renderers/`: `block.ts`, `cylinder.ts`, `device.ts`, `zone.ts`, `link.ts`.

### 9.3 Tái cấu trúc & giải mã `stage-engine.ts` (1.386 dòng)
* Tên class & thuộc tính:
  * `ap` $\to$ `StageEngine`
  * `c` $\to$ `exitDelay` (`exit * 0.55`)
  * `l` $\to$ `enterDelay` (`move * 0.75`)
  * `g` $\to$ `cameraDelay` (`exit * 0.4`)
  * `Fr` $\to$ `fontWidthCache`
  * `Ir` $\to$ `measureCanvasContext`
  * `Oi` $\to$ `ENTITY_RENDERERS`
  * `Mi` $\to$ `getEntityDepth` (Painter's algorithm: $x - y$)
* Tách `stage-engine.ts` thành 4 module độc lập:
  * `camera.ts`: Tính toán bounds, clamp zoom `[0.3, 1.6]`, camera tweening và `fit()`.
  * `animation-clock.ts`: Vòng lặp `requestAnimationFrame` 60fps, hàm vật lý `easeBack`, `easeInOut`, `easeOut`.
  * `particles.ts`: Hệ thống hạt packet flow dọc theo link paths.
  * `stage-renderer.ts`: Quản lý DOM SVG (layer `#grid`, `#floor`, `#entities`, `#links`, `#hud`), theme observer.
* Gỡ bỏ hoàn toàn `// @ts-nocheck` và `/* eslint-disable */`.

### 9.4 Hợp nhất Vòng lặp mô phỏng (`SimulationRunner` dùng chung)
* Tạo `src/lib/simulation-runner.ts` (~60 dòng):
  * Dùng chung cho Java Concurrency, SQL MVCC, 2D State Machine và Pipeline.
  * Quản lý `currentStep`, `isPlaying`, `speed`, `play()`, `pause()`, `stepNext()`, `stepPrev()`, `reset()`.
  * Loại bỏ việc viết lại logic `stepWait()` và timer lặp lại trong `sim-engine.ts` và `scenario-engine.ts`.
