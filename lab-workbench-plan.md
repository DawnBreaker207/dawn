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

### A. Phân định rõ ràng: Blog Architecture vs System Design vs Microservices
* **`architecture` (`/lab/architecture`):** Dành riêng 100% cho **Dawn Blog Architecture** (Cloudflare Edge-First, SSR + Static Astro, Neon Postgres, Zero-Trust DB, Notion Sync). Độc lập hoàn toàn, không nhồi nhét bài học lý thuyết vào đây.
* **`System Design`:** Môn học thiết kế hệ thống tổng thể cấp cao (HLD/LLD) và các Case Studies thực tế (*URL Shortener, News Feed, Chat System, Rate Limiter*).
* **`Microservices`:** Phong cách kiến trúc phân tán dịch vụ con (*Monolith vs Microservices, API Gateway, Service Discovery, Event-Driven Queues/Kafka, Sagas, Circuit Breakers*).
* **`Distributed Core`:** Các nguyên lý nền tảng của hệ thống phân tán (*CAP/PACELC, Raft Consensus, Sharding, Replication, Consistent Hashing, Snowflake ID*).

### B. Quy Hoạch 6 Cụm Chủ Đề Chuẩn (44 Bài Học Toàn Diện):

| Cụm Chủ Đề | Trọng tâm kỹ thuật | Danh sách bài học bao gồm (44 bài) |
|---|---|---|
| **I. Networking & Web Scale** *(Nền tảng Mạng & Chia tải)* | Từ lúc user gõ URL đến khi request chạm server | • `request-lifecycle` (How a Request Travels)<br>• `latency-throughput` (Latency & Throughput)<br>• `napkin-math` (Capacity Calculations)<br>• `vertical-horizontal` (Scaling Dimensions)<br>• `load-balancing` (L4/L7 Algorithms)<br>• `stateless` (Stateless Architecture)<br>• `caching` (Multi-layer Caching)<br>• `cdn` (Content Delivery Networks) |
| **II. Database & Storage Tier** *(Lưu trữ & Truy vấn dữ liệu)* | Bản chất tầng lưu trữ & index của Single Database | • `sql-nosql` (SQL vs NoSQL Trade-offs)<br>• `indexes` (B-Tree, Hash, Inverted)<br>• `storage-engines` (LSM-Tree, Page Buffer)<br>• `transactions` (ACID & Isolation Levels)<br>• `files` (Blob & Object Storage S3) |
| **III. Distributed Systems Core** *(Nguyên lý Hệ thống phân tán)* | Bài toán đồng thuận & chia tách trên nhiều node | • `replication` (Leader-Follower, WAL sync)<br>• `sharding` (Range, Hash, Directory)<br>• `consistent-hashing` (Virtual Nodes, Ring)<br>• `unique-ids` (Snowflake, UUID v7)<br>• `cap` (Định lý CAP & PACELC)<br>• `consensus` (Raft, Paxos, Quorum) |
| **IV. Microservices & Event-Driven** *(Kiến trúc Dịch vụ & Giao tiếp)* | Tách service, giao tiếp bất đồng bộ & phục hồi lỗi | • `microservices` (Monolith to Microservices)<br>• `service-discovery` (Registry & API Gateway)<br>• `apis` (REST, gRPC, GraphQL)<br>• `queues` (Message Queues SQS/Rabbit)<br>• `pubsub` (Event Streams & Kafka)<br>• `realtime` (WebSockets & SSE)<br>• `sagas` (Distributed Transactions & Outbox)<br>• `timeouts-retries` (Circuit Breakers)<br>• `observability` (Tracing, Metrics, Logs) |
| **V. System Design & Case Studies** *(Thiết kế Hệ thống Thực tế)* | Ghép toàn bộ thành phần thành sản phẩm thực tế | • `hld-lld` (Phương pháp tiếp cận HLD/LLD)<br>• `design-url-shortener` (TinyURL Scale)<br>• `design-news-feed` (Twitter/FB Fanout)<br>• `design-chat` (Slack/Discord WebSockets)<br>• `batch-stream` (Lambda/Kappa Architecture)<br>• `rate-limiting` (Token Bucket, Leaky Bucket)<br>• `redundancy` (Multi-AZ Failover)<br>• `aws-cloud` (AWS Cloud Resilience) |
| **VI. DevSecOps & Quality** *(Vận hành, An ninh & Kiểm thử)* | Bảo vệ hệ thống và quy trình phát hành | • `authentication` (JWT, Sessions, OAuth)<br>• `authorization` (RBAC, ABAC, OPA)<br>• `encryption` (At-rest, In-transit, Secrets)<br>• `testing` (Unit, Contract, E2E)<br>• `cicd` (Canary, Blue-Green, GitOps) |

### C. Quy Cách Bố Trí Điều Hướng (Navbar & Sidebar Explorer):

#### 1. Thanh Sidebar Explorer (Cột điều hướng bên trái):
* **`[BLOG ARCHITECTURE]`**:
  * `🏛️ dawn-blog.arch` (`/lab/architecture`): Kiến trúc thực tế Edge-First của Dawn Blog.
* **`[CURRICULUM TRACKS (44 BÀI HỌC)]`**:
  * `🌐 1. network-scale.track` (`/lab/foundations` hoặc `/lab/request-lifecycle`)
  * `🗄️ 2. storage-tier.track` (`/lab/storage-engines` hoặc `/lab/indexes`)
  * `⚖️ 3. distributed.track` (`/lab/consensus` hoặc `/lab/cap`)
  * `🧩 4. microservices.track` (`/lab/microservices`)
  * `📐 5. system-design.track` (`/lab/system-design` hoặc `/lab/hld-lld`)
  * `🛡️ 6. devsecops.track` (`/lab/authentication`)
* **`[DEEP-DIVE ENGINES (2 LAB ĐẶC BIỆT)]`**:
  * `🐘 sql-engine.lab` (`/lab/sql`): Mô phỏng tương tác PostgreSQL Query Planner, B-Tree, MVCC.
  * `☕ java-concurrency.lab` (`/lab/java`): Mô phỏng tương tác JVM Memory, Concurrency, Virtual Threads.
* **`[SIMULATORS & EXTRAS]`**:
  * `README.md` (`/lab`), `terminal.astro`, `pathfinding.astro`, `spider.astro`.

#### 2. Thanh Chapter Picker Dropdown (Trong từng bài Lab):
* **Header hiển thị:** `[Icon] [Tên Cụm Bài] ▾ (Số bài trong Cụm / 44)` kèm ô Search nhanh.
* **Popup Dropdown:** Phân chia rõ ràng thành 6 Section tương ứng với 6 Cụm Chủ Đề chuẩn ở bảng trên.
* **Item hiển thị:** Số thứ tự, Tên bài học, Badge cấp độ (`Beginner` / `Intermediate` / `Advanced`), dot chỉ báo trạng thái bài học hiện tại.

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

---

## 10. DTS Drawing Standards & Complete Concept Conversion Registry

### 10.1 DTS Isometric 2.5D Drawing Rules (Mandatory)
1. **Collision Thresholds:**
   - Critical Overlap ($D < 90\text{px}$): **STRICTLY FORBIDDEN**.
   - Crowded Distance ($90\text{px} \le D < 125\text{px}$): Discouraged.
   - Safe Healthy Distance ($D \ge 125\text{px}$): Mandatory for all components.
2. **Standard 4-Tier Layout Grid:**
   - Tier 1 (Client / Traffic): $y \in [-24, -18]$
   - Tier 2 (Ingress / Gateway): $y \in [-8, -4]$
   - Tier 3 (Compute / Services): $y \in [2, 6]$, $\Delta x \ge 8$
   - Tier 4 (Persistence / Storage / Queues): $y \in [12, 16]$
3. **Isometric Perspective & Links:**
   - $\vec{u}_x = (14, 7)$, $\vec{u}_y = (14, -7)$.
   - Direct link rays; zero dogleg / Z-bends (`['gw', [t, 'gw'], t]` is forbidden).
   - **Link Path Spacing (MANDATORY: Gap >= 7px):** Khi có nhiều đường dẫn chạy song song (Request/Response hoặc multiple data lanes), khoảng cách giữa các đường dẫn tối thiểu phải $\ge 7\text{px}$ để tránh dính nét, va chạm flow packets và đè mũi tên.
   - **Khoảng cách Block linh hoạt:** Khoảng cách giữa các block không gò ép một con số cố định mà linh hoạt tùy theo ngữ cảnh, quy mô cụm và phân tầng từng bài học.
4. **Block Dimensions & Text / Icon Boundary:**
   - Standard block size for text + icon: $s \ge 3.8$, $h \ge 42\sim 46\text{px}$.
   - Labels split into array (`label: ['Line 1', 'Line 2']`), subtitles $\le 24$ chars.
   - Glyphs raised ($y = o - 4$), text clamped between $[o + 7.5, (o + h) - \text{textH} - 5]$.
5. **Viewport Framing & Bounding Box:**
   - Keep world coordinates within $x \in [-16, 16]$ and $y \in [-24, 20]$ to prevent clipping.
6. **Goal Card Deck Separation:**
   - Goal checklist cards in the Guide deck must have minimum separation gap $\ge 7\text{px}$ (`margin-bottom >= 7px`). Never touch on `.goal-hit`.
7. **Automated Verification Per Lesson:**
   - Mandatory check via `node scratch/verify_lesson.cjs <lesson-id>` (0 collisions, 100% goals hit with $\ge 7\text{px}$ gap, 0 console errors, full frame visibility).
   - Pre-commit: `node scripts/lint-scenes.mjs` and `cmd /c npm run build` (exit code 0).

### 10.2 Concept Conversion Inventory (100% Converted)
- **Database & SQL Tier (Module 03 — 8 Chapters):**
  `sql-engine`, `sql-explain`, `indexes`, `storage-engines`, `sql-footprint`, `sql-nosql`, `sql-connection-pool`, `transactions`.
- **Java Core & JVM Engine (Module 05B — 15 Chapters):**
  `java-concurrency`, `java-executors`, `java-completable`, `java-virtual-threads`, `java-jvm-memory`, `java-string-pool`, `java-jit-compiler`, `java-collections`, `java-streams`, `java-lambda`, `java-io-nio`, `java-generics`, `java-exceptions-errors`, `java-metaprogramming`, `java-modern`.
- **Spring Enterprise Framework (Module 05C — 11 Chapters):**
  `java-spring-ioc`, `java-spring-scopes`, `java-spring-aop`, `java-spring-mvc`, `java-spring-tx`, `java-spring-jpa`, `java-spring-security`, `java-spring-boot-autoconfig`, `java-spring-testing`, `java-spring-messaging`, `java-spring-config`.

---

## 11. Kế hoạch Tái cấu trúc Java & SQL Labs: Code-Driven Mechanism & Trọng tâm 6–8 Bước (Master Plan)

> **Mục tiêu:** 
> 1. Gỡ bỏ hoàn toàn switch 2D để toàn bộ bài học chạy trên một màn hình duy nhất (Single Canvas Workbench).
> 2. Chuyển đổi nội dung từ mô tả lý thuyết trừu tượng sang mô hình **Code-Driven Mechanism**: Mỗi step có một **Code Panel Card** (`makePanel`) in đúng đoạn code/query thực tế, sơ đồ 3D mô phỏng trực tiếp tác động của dòng code đó trong RAM/CPU/Network.
> 3. Chuẩn hóa số bước thành **6 – 8 bước trọng tâm (Key Mechanism Milestones)**: Không ép cứng 4 bước gây nhồi nhét, không chia vụn vặt 20–33 bước gây loãng kiến thức.

### 11.1 Xử lý triệt để nút Switch 2D (View Toggle)
- **Hành động:**
  - Gỡ bỏ `<... slot="visualizer-2d" />` trong `src/pages/lab/java.astro` và `src/pages/lab/[lesson].astro`.
  - Xóa bỏ nút `.view-toggle` (`[ 3D Simulator | 2D Deep-Dive ]`) trong `SimulationWorkbench.astro`.
  - Canvas 3D trở thành không gian hiển thị thống nhất duy nhất, tích hợp sẵn thẻ Code/Query Panel.

### 11.2 Mô hình chuẩn Code-Driven Mechanism (Học tập từ `sql-nosql`)
Mỗi step trong bài học tuân thủ công thức 3 phần:
1. **Code Panel Card (`card: makePanel`):** Đặt ở góc thoáng của canvas (`x: -12, y: -4` hoặc cạnh node), in đúng đoạn code Java hoặc câu lệnh SQL của step đó.
2. **Hình học mô phỏng (Isometric Visual Stage):** Chỉ vẽ đúng các thành phần chịu tác động trực tiếp của đoạn code (Stack Frame, Heap Object, Pointer, Monitor Lock, Socket Buffer, Carrier Thread...).
3. **Guide Deck bên phải:** Giải thích duy nhất cơ chế ngầm thực thi của đoạn code đó.

---

### 11.3 Chi tiết Kế hoạch 27 Bài học Java (6 – 8 Bước Trọng Tâm)

#### Nhóm 1: Concurrency & Multithreading Engine (6 bài)
1. **`java-concurrency` (7 bước) — Race Condition & ObjectMonitor:**
   - *Code:* `count++` $\to$ `synchronized(lock)` $\to$ `lock.wait()` $\to$ `lock.notify()`.
   - *Milestones:* Lost update $\to$ mark word biased/lightweight $\to$ heavyweight monitor $\to$ `_EntryList` $\to$ `_WaitSet` $\to$ reentrant counter $\to$ spurious wakeup.
2. **`java-executors` (7 bước) — ThreadPoolExecutor Sizing:**
   - *Code:* `new ThreadPoolExecutor(2, 4, 60s, queue(2), AbortPolicy)`.
   - *Milestones:* Pool khởi tạo $\to$ ăn vào Core $\to$ tràn vào Queue $\to$ bung Max workers $\to$ kích hoạt `AbortPolicy` $\to$ thử `CallerRunsPolicy` $\to$ idle keepalive thu hồi.
3. **`java-completable` (7 bước) — CompletableFuture DAG:**
   - *Code:* `supplyAsync()` $\to$ `thenApply()` $\to$ `thenCompose()` $\to$ `allOf().join()`.
   - *Milestones:* Khởi tạo ForkJoin thread $\to$ map transform $\to$ async compose nối luồng $\to$ phân nhánh DAG $\to$ bắt lỗi `exceptionally()` $\to$ gom barrier `allOf` $\to$ đua tốc độ `anyOf`.
4. **`java-virtual-threads` (7 bước) — Loom Continuation & Carrier:**
   - *Code:* `Thread.startVirtualThread(() -> socket.read())`.
   - *Milestones:* Platform (1MB) vs Virtual (KB) $\to$ Carrier ForkJoin scheduling $\to$ Mount $\to$ Blocking I/O $\to$ Unmount frame lên Heap $\to$ Carrier rảnh nhận VT khác $\to$ Epoll wakeup remount $\to$ Pinning gotcha (`synchronized`).
5. **`java-async` (6 bước) — @Async Proxy & Interception:**
   - *Code:* `@Async public void sendEmail()` $\to$ `orderService.sendEmail()`.
   - *Milestones:* Khai báo `@Async` $\to$ AOP proxy intercept $\to$ gói task submit TaskExecutor $\to$ trả Future/void ngay $\to$ `AsyncUncaughtExceptionHandler` $\to$ trap tự gọi `this.method()`.
6. **`java-jmm` (7 bước) — Memory Model & Cache Coherence:**
   - *Code:* `volatile boolean ready = true;` $\to$ `AtomicInteger count;`.
   - *Milestones:* Kiến trúc L1/L2 cache CPU $\to$ store buffer reordering $\to$ stale read $\to$ từ khóa `volatile` $\to$ rào cản bộ nhớ (Memory Barriers) $\to$ `happens-before` $\to$ CAS atomic.

#### Nhóm 2: JVM Internals & Memory Architecture (7 bài)
7. **`java-string-pool` (6 bước) — String Interning & Memory:**
   - *Code:* `String s1 = "a"; String s2 = new String("a"); s2.intern();`.
   - *Milestones:* Literal tra cứu C++ `StringTable` $\to$ `new String()` trên Heap $\to$ `s1 == s2` false $\to$ `intern()` trỏ lại pool $\to$ Compact Strings `byte[]` $\to$ GC dọn pool.
8. **`java-lambda` (6 bước) — invokedynamic & Metafactory:**
   - *Code:* `Function<String, Integer> fn = s -> s.length();`.
   - *Milestones:* Cú pháp functional $\to$ bytecode `invokedynamic` $\to$ Bootstrap method $\to$ `LambdaMetafactory` sinh `CallSite` $\to$ `MethodHandle` invocation $\to$ capture variables.
9. **`java-io-nio` (7 bước) — BIO Syscall vs NIO Epoll:**
   - *Code:* `FileInputStream.read()` $\to$ `BufferedInputStream` $\to$ `ByteBuffer.allocateDirect()` $\to$ `Selector.select()`.
   - *Milestones:* BIO 1 byte = 1 Syscall $\to$ Buffer đệm khối 8KB $\to$ giới hạn thread per connection $\to$ Direct Buffer zero-copy $\to$ Channel hai chiều $\to$ Epoll Selector multiplexing $\to$ Non-blocking Reactor.
10. **`java-generics` (6 bước) — Type Erasure & PECS:**
    - *Code:* `List<String> list;` $\to$ `void copy(List<? super T> dst, List<? extends T> src)`.
    - *Milestones:* Type safety compile-time $\to$ Type erasure về `Object` $\to$ Javac chèn `checkcast` $\to$ Synthetic bridge method $\to$ Covariance `? extends` (read) $\to$ Contravariance `? super` (write).
11. **`java-jit-compiler` (7 bước) — Tiered Compilation (Interpreter $\to$ C1 $\to$ C2):**
    - *Code:* `for(int i=0; i<10000; i++) add(x, y);`.
    - *Milestones:* Tier 0 Interpreter đếm counter $\to$ ngưỡng Hot method $\to$ Tier 1–3 C1 compile nhanh $\to$ Tier 4 C2 tối ưu sâu $\to$ Method Inlining $\to$ Escape Analysis phẳng hóa object lên stack $\to$ Deoptimization.
12. **`java-exceptions-errors` (7 bước) — Exception Table & OutOfMemoryError:**
    - *Code:* `try { ... } catch (E e) { ... } finally { ... }`.
    - *Milestones:* Lệnh `throw` đóng băng stack $\to$ tra cứu Exception Table bytecode $\to$ Stack Unwinding hủy frame $\to$ catch block bắt $\to$ finally luôn chạy $\to$ Error vs Exception $\to$ OOM Heap vs Metaspace.
13. **`java-metaprogramming` (7 bước) — Reflection & Dynamic Proxies:**
    - *Code:* `Method.invoke()` $\to$ `Proxy.newProxyInstance()` $\to$ `Enhancer.create()`.
    - *Milestones:* Reflection overhead $\to$ tối ưu `MethodHandle` $\to$ JDK Proxy (Interface-based) $\to$ CGLIB (Subclass bytecode) $\to$ Annotation Processing compile-time $\to$ Bytecode manipulation ASM.

#### Nhóm 3: Collections & Modern Java (3 bài)
14. **`java-collections` (7 bước) — HashMap Internals & CAS:**
    - *Code:* `map.put(key, val);` $\to$ `ConcurrentHashMap.put()`.
    - *Milestones:* Băm `(h ^ (h >>> 16))` $\to$ Index modulo $\to$ Va chạm chèn Linked List $\to$ Treeify thành Red-Black tree khi bin $\ge 8$ $\to$ Load Factor 0.75 resize $\times 2$ $\to$ ConcurrentHashMap CAS node đầu $\to$ Synchronized bin.
15. **`java-streams` (6 bước) — Lazy Evaluation & Spliterator:**
    - *Code:* `list.stream().filter(...).map(...).findFirst();`.
    - *Milestones:* Khởi tạo Stream $\to$ Nối Intermediate Ops (chưa chạy) $\to$ Terminal Op kích hoạt $\to$ Spliterator kéo dữ liệu $\to$ Short-circuiting ngắt sớm $\to$ Parallel stream ForkJoinPool.
16. **`java-modern` (6 bước) — Records, Sealed Classes & Pattern Matching:**
    - *Code:* `record Order(String id) {}` $\to$ `sealed interface Pay permits Card, Cash {}` $\to$ `switch(p)`.
    - *Milestones:* Records bất biến $\to$ Compact constructor $\to$ Sealed Classes $\to$ Pattern matching `instanceof` $\to$ Exhaustive `switch` expression $\to$ Record deconstruction.

#### Nhóm 4: Spring Framework & Enterprise (11 bài)
17. **`java-spring-ioc` (7 bước) — Container Lifecycle & PostProcessor:**
    - *Code:* `@Component class Svc { @Autowired Repo r; }`.
    - *Milestones:* Quét nạp `BeanDefinition` $\to$ Constructor Instantiation $\to$ Xử lý Circular Dependency $\to$ Populate fields $\to$ `BeanPostProcessor` $\to$ `@PostConstruct` $\to$ Cache `singletonObjects`.
18. **`java-spring-scopes` (7 bước) — Scopes & Scoped Proxies:**
    - *Code:* `@Scope("prototype", proxyMode = TARGET_CLASS)`.
    - *Milestones:* Singleton shared $\to$ Prototype per-request $\to$ Bẫy Prototype trong Singleton $\to$ Giải pháp Scoped Proxy CGLIB $\to$ Proxy ủy quyền runtime $\to$ `@RequestScope` ThreadLocal $\to$ `@PreDestroy` bỏ prototype.
19. **`java-spring-aop` (7 bước) — Proxy Interception & Self-Invocation:**
    - *Code:* `@Transactional public void pay() {}` $\to$ `this.pay();`.
    - *Milestones:* Advised bean $\to$ Bọc Dynamic Proxy $\to$ Lời gọi vào Proxy $\to$ Chuỗi `MethodInterceptor` proceed $\to$ Bẫy `this.method()` né proxy $\to$ Sửa bằng `AopContext.currentProxy()` $\to$ JDK vs CGLIB.
20. **`java-spring-mvc` (8 bước) — Request Pipeline & Resolvers:**
    - *Code:* `@PostMapping("/orders") public Order create(@Valid @RequestBody OrderReq req)`.
    - *Milestones:* HTTP Ingress $\to$ `DispatcherServlet` $\to$ `HandlerMapping` $\to$ Interceptor `preHandle()` $\to$ `ArgumentResolver` Jackson JSON $\to$ Controller method $\to$ `HttpMessageConverter` $\to$ `@ExceptionHandler` ProblemDetail.
21. **`java-spring-tx` (7 bước) — Declarative Transactions & Propagation:**
    - *Code:* `@Transactional(propagation = REQUIRES_NEW, rollbackFor = Exception.class)`.
    - *Milestones:* Proxy intercept $\to$ Mở DB connection `autoCommit=false` $\to$ Bind vào `TransactionSynchronizationManager` (ThreadLocal) $\to$ `REQUIRES_NEW` treo connection cha $\to$ Commit $\to$ Bẫy Checked Exception không rollback $\to$ `rollbackFor`.
22. **`java-spring-jpa` (7 bước) — Persistence Context & N+1 Problem:**
    - *Code:* `@Query("SELECT o FROM Order o JOIN FETCH o.items")`.
    - *Milestones:* `EntityManager` cache cấp 1 $\to$ `findById` cache hit $\to$ Dirty Checking tự sinh `UPDATE` $\to$ Thảm họa N+1 Query $\to$ Khắc phục bằng `JOIN FETCH` (1 query) $\to$ Flush SQL $\to$ Cache cấp 2 (Redis).
23. **`java-spring-security` (7 bước) — SecurityFilterChain:**
    - *Code:* `SecurityFilterChain filterChain(HttpSecurity http)`.
    - *Milestones:* `DelegatingFilterProxy` $\to$ `SecurityFilterChain` $\to$ `JwtAuthenticationFilter` $\to$ `AuthenticationManager` $\to$ Nạp `SecurityContextHolder` (ThreadLocal) $\to$ `AuthorizationFilter` $\to$ 403 vs 200.
24. **`java-spring-boot-autoconfig` (7 bước) — Auto-Configuration:**
    - *Code:* `@ConditionalOnClass(DataSource.class)` `@ConditionalOnMissingBean`.
    - *Milestones:* `@SpringBootApplication` $\to$ Đọc `AutoConfiguration.imports` $\to$ Đánh giá `@ConditionalOnClass` $\to$ Đánh giá `@ConditionalOnMissingBean` $\to$ Sắp xếp `@AutoConfigureAfter` $\to$ Đăng ký bean $\to$ Báo cáo `--debug`.
25. **`java-spring-testing` (7 bước) — TestContext & Context Caching:**
    - *Code:* `@SpringBootTest` `@MockBean PaymentService mock;` `@WebMvcTest`.
    - *Milestones:* Boot context lần 1 $\to$ Context Caching lưu hash key $\to$ Test class sau tái sử dụng (15ms) $\to$ `@MockBean` phá vỡ cache miss boot lại $\to$ `@DirtiesContext` hủy cache $\to$ Giải pháp Test Slices `@WebMvcTest` (300ms) $\to$ Testcontainers.
26. **`java-spring-messaging` (7 bước) — KafkaTemplate, Commit & DLT:**
    - *Code:* `kafkaTemplate.send()` `@KafkaListener` `ack.acknowledge()`.
    - *Milestones:* `KafkaTemplate` async send $\to$ `@KafkaListener` đa thread $\to$ Commit `AckMode.MANUAL_IMMEDIATE` sau khi lưu DB $\to$ Lỗi retry $\to$ Đẩy poison pill sang `.DLT` topic $\to$ Idempotent Consumer chống trùng $\to$ Transactional Outbox.
27. **`java-spring-config` (7 bước) — 17-Tier Hierarchy & Relaxed Binding:**
    - *Code:* `@ConfigurationProperties(prefix = "app")` `SPRING_PROFILES_ACTIVE=prod`.
    - *Milestones:* Tháp 17 tầng (CLI > OS Env > Profile yml > Default) $\to$ Ghi đè $\to$ Relaxed Binding (kebab, camel, SNAKE) $\to$ Type-safe Record binding $\to$ Profile activation $\to$ Vault giải mã secret $\to$ `@RefreshScope`.

---

### 11.4 Chi tiết 8 Bài học SQL Core (Tương tự 6 – 8 Bước)
1. **`sql-engine` (7 bước):** Parser $\to$ AST $\to$ Analyzer/Catalog $\to$ Rewriter (View/Subquery) $\to$ Cost Optimizer $\to$ Executor $\to$ Buffer Manager.
2. **`sql-explain` (7 bước):** `EXPLAIN ANALYZE` $\to$ Cost Model $(N \times \text{cpu} + P \times \text{io})$ $\to$ Seq Scan $\to$ Index Scan $\to$ Bitmap Index Scan $\to$ Hash Join $\to$ Nested Loop.
3. **`indexes` (7 bước):** B-Tree Root $\to$ Internal node binary search $\to$ Leaf node $\to$ TID (Page, Offset) $\to$ Node split $50/50$ $\to$ Index scan range $\to$ Covering Index (Index-Only Scan).
4. **`storage-engines` (7 bước):** In-place update B-Tree $\to$ Random I/O write amplification $\to$ Append-only LSM Log $\to$ MemTable (SkipList) $\to$ WAL durability $\to$ Immutable SSTable $\to$ Compaction.
5. **`sql-footprint` (7 bước):** 8KB Page anatomy $\to$ PageHeader $\to$ ItemId pointers $\to$ HeapTupleHeader (`xmin`, `xmax`, `ctid`) $\to$ Tuple data $\to$ Bloat due to dead tuples $\to$ `VACUUM` reclaim.
6. **`sql-nosql` (7 bước):** Relational tables $\to$ JOIN cost $\to$ Transactions ACID $\to$ Document store JSON denormalization $\to$ Key-Value O(1) cache $\to$ Polyglot persistence.
7. **`sql-connection-pool` (7 bước):** PostgreSQL Process-per-connection model $\to$ Fork overhead $\to$ Thundering herd $\to$ HikariCP pool sizing formula $\to$ PgBouncer Epoll proxy $\to$ Transaction pooling.
8. **`transactions` (7 bước):** ACID properties $\to$ Snapshot Isolation $\to$ `xmin`/`xmax` visibility check $\to$ Dirty Read anomaly $\to$ Non-repeatable Read $\to$ Phantom Read $\to$ Serializable (SSI).

---

## 12. Kế hoạch Quy hoạch Navbar Topics & Series Mở rộng (Docker, K8s, Redis, Kafka, RabbitMQ)

> **Nguyên tắc định vị:**
> 1. Mỗi công nghệ cấp hệ thống (Docker, K8s, Redis, Kafka, RabbitMQ) không thể là một bài đơn lẻ mà là **một Topic Series hoàn chỉnh gồm nhiều bài học chuyên sâu (Chapters)**.
> 2. Quy hoạch Navbar / Sidebar Explorer gồm **8 Topic lớn (`.sim`)**, phân bổ hợp lý giữa các mảng Hạ tầng (Cloud-Native), Dữ liệu (Database/In-Memory), và Giao tiếp (Event-Driven).

### 12.1 Topic Mới trên Navbar: `k8s.sim` — Containers & Kubernetes (Series 8 bài)
Tách riêng thành một Topic độc lập trên Navbar đại diện cho kỷ nguyên Cloud-Native:
1. **`docker-internals` (7 bước):** Linux Namespaces (PID, NET, MNT), Cgroups giới hạn CPU/RAM & Container Runtime (containerd).
2. **`docker-images-storage` (7 bước):** Cơ chế UnionFS & OverlayFS (Read-only Image Layers vs Writable Container Layer).
3. **`k8s-control-plane` (7 bước):** Bộ não K8s: API Server, etcd (Raft state store), Kube-Scheduler & Controller Manager.
4. **`k8s-worker-node` (7 bước):** Cỗ máy Worker: Kubelet, Pod Lifecycle, Container Runtime Interface (CRI) & Pod Probes (Liveness/Readiness).
5. **`k8s-networking-cni` (7 bước):** Mạng K8s: Pod-to-Pod flat network, CNI (Flannel/Calico overlay) & Kube-Proxy (iptables vs IPVS).
6. **`k8s-services-ingress` (7 bước):** Dịch vụ & Cổng vào: ClusterIP, NodePort, LoadBalancer & Ingress Controller (NGINX/Envoy routing).
7. **`k8s-storage-csi` (7 bước):** Lưu trữ trong K8s: PersistentVolumes (PV), PersistentVolumeClaims (PVC), StorageClass & Dynamic CSI Provisioning.
8. **`k8s-autoscaling-hpa` (7 bước):** Tự động co giãn: Horizontal Pod Autoscaler (HPA metrics-server), VPA & Cluster Autoscaler.

### 12.2 Mở rộng Topic `storage.sim` — Database & In-Memory Tier (Tổng 14 bài)
- **Phân nhánh 1: PostgreSQL & Relational Engine (8 bài):**
  `sql-engine`, `sql-explain`, `indexes`, `storage-engines`, `sql-footprint`, `sql-nosql`, `sql-connection-pool`, `transactions`.
- **Phân nhánh 2: Redis Engine Internals (Series 6 bài):**
  1. **`redis-event-loop` (7 bước):** Single-threaded Reactor Pattern, Non-blocking I/O multiplexing với `epoll` (`ae.c` event library).
  2. **`redis-data-structures` (7 bước):** Cấu trúc dữ liệu ngầm C: Simple Dynamic String (SDS), Dict/Hashes, IntSet, QuickList.
  3. **`redis-sorted-sets` (7 bước):** Bản chất của ZSET: Kết hợp Hash Table (tra cứu O(1)) + SkipList (truy vấn dải khoảng O(log N)).
  4. **`redis-persistence-rdb-aof` (7 bước):** Bền vững dữ liệu: RDB Snapshot (Copy-on-Write `bgsave`) vs AOF (Append-only file `fsync` policies) & AOF Rewrite.
  5. **`redis-memory-eviction` (7 bước):** Cơ chế giải phóng RAM: Thuật toán xấp xỉ LRU, LFU, TTL Expiration (Active cron vs Passive access).
  6. **`redis-cluster-sharding` (7 bước):** Phân tán cụm: 16.384 Hash Slots, CRC16 hashing, `MOVED` vs `ASK` redirects, và Sentinel High Availability failover.

### 12.3 Mở rộng Topic `microservices.sim` — Microservices & Event-Driven Architecture (Tổng 14 bài)
- **Phân nhánh 1: Microservices Core (7 bài):**
  `microservices`, `service-discovery`, `sagas`, `apis`, `queues`, `pubsub`, `realtime`.
- **Phân nhánh 2: Message Brokers Deep-Dive (Kafka & RabbitMQ — Series 7 bài):**
  1. **`kafka-cluster-kraft` (7 bước):** Kiến trúc Broker, Topics, Partitions, và cơ chế KRaft consensus (bỏ ZooKeeper).
  2. **`kafka-storage-engine` (7 bước):** Bộ máy lưu trữ: Commit Log segments (`.log`), Sparse Index (`.index`), PageCache & Zero-Copy OS `sendfile()`.
  3. **`kafka-replication-isr` (7 bước):** Sao chép phân tán: Leader-Follower, In-Sync Replicas (ISR), High Watermark (HW), và ngữ nghĩa `acks=all`.
  4. **`kafka-consumer-groups` (7 bước):** Cơ chế tiêu thụ: Consumer Group Rebalance Protocol, Offset Commit & Exactly-Once Semantics (EOS).
  5. **`rabbitmq-amqp-model` (7 bước):** Mô hình AMQP 0-9-1: Connection TCP vs Multiplexed Channels, Virtual Hosts (vhosts).
  6. **`rabbitmq-exchanges-routing` (7 bước):** Bộ định tuyến: Direct Exchange, Fanout Exchange, Topic Exchange (Wildcard `*` và `#`), và Bindings.
  7. **`rabbitmq-reliability-dlx` (7 bước):** Độ tin cậy: Publisher Confirms, Prefetch Count (QoS), Message Acknowledgments & Dead Letter Exchange (DLX).

---

### 12.4 Bảng Tổng hợp Toàn diện 8 Topic trên Navbar / Sidebar Explorer:

| Item Navbar | Tên Topic | Số bài học | Công nghệ trọng tâm |
|---|---|:---:|---|
| **`network.sim`** | Network & Web Scale | **15 bài** *(Mở rộng)* | **Protocols (TCP, TLS, HTTP/3, DNS), L4/L7, Edge & DDoS** |
| **`storage.sim`** | Database & In-Memory Tier | **14 bài** | **PostgreSQL Engine (8 bài) + Redis Internals (6 bài)** |
| **`distributed.sim`** | Distributed Systems Core | 6 bài | Replication, Sharding, Consistent Hashing, Raft, CAP |
| **`microservices.sim`**| Microservices & Event-Driven | **14 bài** | **Sagas, Discovery + Kafka (4 bài) + RabbitMQ (3 bài)** |
| **`k8s.sim`** *(MỚI)* | **Containers & Kubernetes** | **8 bài** | **Docker Internals (2 bài) + K8s Core & Networking (6 bài)** |
| **`java.sim`** | Java Runtime & Spring Enterprise | 27 bài | Concurrency, JVM Internals, Collections, Spring Boot/Security |
| **`system-design.sim`**| System Design Case Studies | 9 bài | HLD/LLD, TinyURL, News Feed, Chat, Rate Limiting |
| **`aws-cloud.sim`** | AWS Cloud Architecture | 6 bài | VPC, Multi-AZ, S3, Serverless Lambda/SQS |

---

## 13. Kế hoạch Mở rộng Chuyên sâu Topic `network.sim` — Network Protocols & Edge Scaling (Tổng 15 bài)

> **Mục tiêu:**
> Mạng máy tính là xương sống của mọi hệ thống phân tán. Mở rộng `network.sim` từ 8 bài đại cương lên **15 bài học chuyên sâu**, đi thẳng vào các cơ chế then chốt: bắt tay TCP/TLS, tiến hóa HTTP/3 QUIC, phân giải Anycast DNS, cân bằng tải L4 DSR vs L7 Envoy, WebSocket scaling, và phòng thủ DDoS.

### 13.1 Phân bổ 2 Module trong Topic `network.sim`:

#### Module 01: Network Foundations & Protocols (8 bài)
1. **`request-lifecycle` (Hiện có - 6 bước):** Chu trình một gói tin đi từ trình duyệt qua DNS, Gateway, Cache, App Server đến Database.
2. **`latency-throughput` (Hiện có - 7 bước) — Độ trễ, Băng thông & Đo lường Percentiles (P50/P90/P95/P99):**
   - *Bản chất Percentiles:* Vì sao số trung bình cộng (Average) là "cú lừa" che giấu lỗi. Đo lường P50 (Median), P90/P95 (SLA chuẩn) và P99 (Tail Latency - Độ trễ đuôi).
   - *Toán học độ trễ đuôi (Tail at scale):* Trong kiến trúc Microservices gọi song song $N$ services, xác suất dính request chậm là $1 - (1 - 0.01)^N \approx 40\%$ với $N=50$.
   - *Biểu đồ:* Little's Law, Hockey Stick latency curve khi Server vượt 70% CPU saturation.
3. **`napkin-math` (Hiện có - 6 bước):** Tính toán nhanh dung lượng RAM, đĩa, CPU, và băng thông mạng quy mô triệu người dùng.
4. **`tcp-internals` (MỚI - 7 bước) — Cơ chế lõi TCP:**
   - *Code/Packets:* SYN $\to$ SYN-ACK $\to$ ACK $\to$ FIN $\to$ `TIME_WAIT` (2MSL).
   - *Milestones:* 3-Way Handshake $\to$ Sliding Window flow control $\to$ Congestion Slow Start $\to$ Fast Retransmit $\to$ TCP Cubic vs BBR $\to$ Trạng thái `TIME_WAIT` & Port exhaustion $\to$ TCP Keepalive.
5. **`tls-handshake` (MỚI - 7 bước) — Mật mã học & TLS 1.3 / mTLS:**
   - *Code/Ciphers:* ECDHE Key Exchange $\to$ Certificate Verify $\to$ 0-RTT Early Data $\to$ mTLS.
   - *Milestones:* So sánh TLS 1.2 (2 RTT) vs TLS 1.3 (1 RTT) $\to$ Diffie-Hellman ECDHE sinh khóa phiên $\to$ Chuỗi chứng chỉ CA & SNI $\to$ 0-RTT Session Resumption $\to$ mTLS xác thực 2 chiều trong Service Mesh $\to$ ALPN đàm phán giao thức.
6. **`http-evolution` (MỚI - 7 bước) — Tiến hóa HTTP/1.1 $\to$ HTTP/2 $\to$ HTTP/3 (QUIC):**
   - *Code/Frames:* HTTP/1.1 Pipelining $\to$ H2 Binary Frames (HEADERS, DATA) $\to$ H3 QUIC UDP.
   - *Milestones:* HTTP/1.1 giới hạn 6 TCP conn & HoL blocking $\to$ HTTP/2 Multiplexing trên 1 TCP conn $\to$ Nén header HPACK $\to$ Nhược điểm TCP-level HoL blocking $\to$ HTTP/3 chuyển sang QUIC (UDP) $\to$ Zero-RTT Transport+TLS $\to$ Connection Migration (Wi-Fi sang 4G không đứt mạng).
7. **`dns-anycast` (MỚI - 7 bước) — Phân giải tên miền & Anycast Routing:**
   - *Code/Queries:* `dig +trace example.com` $\to$ Record types (A, AAAA, CNAME, ALIAS, MX, TXT).
   - *Milestones:* Truy vấn Recursive vs Iterative $\to$ Root `.` $\to$ TLD `.com` $\to$ Authoritative Name Server $\to$ TTL Caching $\to$ BGP Anycast routing (1 IP broadcast tại 300 PoPs) $\to$ GeoDNS & GSLB.
8. **`websocket-realtime-protocols` (MỚI - 7 bước) — Giao thức thời gian thực:**
   - *Code/Frames:* `HTTP/1.1 101 Switching Protocols` $\to$ WebSocket frame (Opcode, Mask, Payload) $\to$ SSE.
   - *Milestones:* HTTP Upgrade handshake $\to$ Full-duplex framing 2-byte header $\to$ Heartbeat Ping/Pong $\to$ So sánh Server-Sent Events (SSE 1 chiều trên H2) $\to$ Cạn kiệt RAM socket khi mở triệu kết nối $\to$ Redis Pub/Sub backplane đồng bộ giữa các cụm server.

#### Module 02: Traffic Scaling & Edge Security (7 bài)
9. **`vertical-horizontal` (Hiện có - 6 bước):** Mở rộng dọc (Scale Up) vs mở rộng ngang (Scale Out), định luật Amdahl.
10. **`load-balancing` (Hiện có - 6 bước):** Cân bằng tải L4 vs L7, cơ chế Health Check và định tuyến cơ bản.
11. **`reverse-proxy-l4-l7` (MỚI - 7 bước) — Chuyên sâu NLB vs ALB / Envoy:**
    - *Code/Configs:* Envoy cluster config $\to$ NGINX upstream $\to$ AWS NLB DSR.
    - *Milestones:* Layer 4 (NLB/IPVS) không giải mã HTTP, hàng triệu conn/s $\to$ Direct Server Return (DSR backend trả thẳng client) $\to$ Layer 7 (ALB/Envoy) giải mã TLS & path routing $\to$ Thuật toán Round Robin vs Least Connections $\to$ Consistent Hash (IP Sticky) $\to$ Power of Two Random Choices $\to$ Connection Draining.
12. **`stateless` (Hiện có - 6 bước):** Loại bỏ session cục bộ, đưa state ra Shared Storage (Redis/DB) để scale tự do.
13. **`caching` (Hiện có - 6 bước):** Cache-aside, Read-through, Write-through, Write-back, và chiến lược vô hiệu hóa cache.
14. **`cdn` (Hiện có - 6 bước):** Content Delivery Network, Edge PoP Caching, Cache-Control headers (stale-while-revalidate).
15. **`network-security-ddos` (MỚI - 7 bước) — Tấn công & Phòng thủ Mạng:**
    - *Code/Attacks:* SYN Flood $\to$ UDP Amplification $\to$ Slowloris $\to$ WAF Rules.
    - *Milestones:* Tấn công L3/L4 SYN Flood làm tràn backlog $\to$ UDP Amplification reflection $\to$ Phòng thủ Anycast Scrubbing Centers $\to$ SYN Cookies $\to$ Tấn công L7 Slowloris ngâm connection $\to$ WAF Token Bucket Rate Limiting tại Edge $\to$ Cloudflare Under Attack Mode.

---

### 13.2 Tổng hợp Thống kê Toàn bộ Hệ thống sau Quy hoạch:
- **8 Topics lớn trên Navbar / Sidebar Explorer:**
  - `network.sim`: **15 bài** (8 Foundations + 7 Traffic Scaling)
  - `storage.sim`: **14 bài** (Postgres 8 + Redis 6)
  - `distributed.sim`: **6 bài**
  - `microservices.sim`: **14 bài** (Microservices 7 + Kafka/RabbitMQ 7)
  - `k8s.sim`: **8 bài** (Docker 2 + K8s 6)
  - `java.sim`: **27 bài** (Concurrency, JVM, Collections, Spring)
  - `system-design.sim`: **10 bài** (9 bài System Design truyền thống + 1 bài Flagship `ai-agent-architecture`)
  - `aws-cloud.sim`: **10 bài** (Chuẩn 100% chứng chỉ AWS SAA-C03: Networking, Security, Compute, Storage, Analytics)
- **Tổng cộng toàn hệ thống: Tròn 104 bài học mô phỏng kiến trúc 3D chuyên sâu.**

---

## 14. Kế hoạch Bài học Flagship: The Anatomy of Modern AI Agent Architecture

> **Mã bài học (Lesson ID):** `ai-agent-architecture`  
> **Tiêu đề:** *The Anatomy of Modern AI Agents (Giải phẫu Kiến trúc Hệ sinh thái AI Agent)*  
> **Định vị:** Tích hợp vào **Topic `system-design.sim`** (nâng tổng số bài của topic lên 10 bài, đưa tổng toàn hệ thống lên tròn **100 bài học**).  
> **Mô hình kiến trúc:** **Mô hình Vỏ hành tây (Onion Architecture)** — bóc tách từ lõi LLM qua các tầng tối ưu bao bọc: RAG, MCP, Loop, Harness, Superpowers, LangChain/LangGraph, và Multi-Agent Swarms.  
> **Quy chuẩn hiển thị:** Đúng **8 bước trọng tâm (Key Milestones)** với Code Panel Card (`card: makePanel`) trực quan.

### 14.1 Kịch bản 8 Bước Bóc Tách Kiến Trúc AI Agent:

#### Step 1: The Naked LLM — Lõi suy luận trần trụi
- **Code Card:** `response = llm.predict("Fix bug in index.ts")`
- **Mô phỏng Canvas 3D:** Khối cầu não bộ (LLM) phát sáng cô độc ở tâm canvas.
- **Cơ chế ngầm:** Bản chất LLM chỉ là bộ dự đoán xác suất token tiếp theo (Next-token Predictor). Nó không có mắt (không đọc được file hệ thống), không có tay chân (không chạy được lệnh), không có trí nhớ dài hạn. Trả lời 1 lượt xong là tắt ngấm.

#### Step 2: The RAG Layer — Bọc lớp Tri thức & Chống ảo giác
- **Code Card:** `docs = vector_db.similarity_search(query); prompt = inject(docs, query)`
- **Mô phỏng Canvas 3D:** Thêm khối Vector Database (Embedding) bên cạnh LLM với luồng truyền dữ liệu vào prompt.
- **Cơ chế ngầm:** Cắt nhỏ dữ liệu (Chunking) $\to$ Vector hóa $\to$ Lưu trữ Vector Store $\to$ Truy xuất tài liệu tương đồng ngữ nghĩa. Giải quyết điểm yếu "não ngắn" và triệt tiêu 99% ảo giác (Hallucination).

#### Step 3: The MCP Layer — Cắm "Tay Chân" qua Cổng USB-C Chuẩn hóa
- **Code Card:** `client.call_tool("mcp://filesystem/read_file", { path: "index.ts" })`
- **Mô phỏng Canvas 3D:** Xuất hiện cổng kết nối MCP Hub (giao thức JSON-RPC) chìa ra các đầu cắm: File System, Git, SQL Database, Terminal runner.
- **Cơ chế ngầm:** Tiêu chuẩn mở Model Context Protocol (Anthropic). AI bắt đầu có khả năng tương tác với thế giới thực qua các tool chuẩn hóa mà không phải viết API plugin thủ công cho từng mô hình.

#### Step 4: The Agentic Loop (ReAct) — Thổi hồn "Ý thức" tự sửa sai
- **Code Card:** `while not done: think() -> act(tool) -> observe(result) -> reflect()`
- **Mô phỏng Canvas 3D:** Một vòng xoay mũi tên tròn khép kín bao quanh LLM, RAG và MCP Tools.
- **Cơ chế ngầm:** Vòng lặp tự trị ReAct (Reason + Act). Chạy lệnh bash bị lỗi $\to$ Agent tự đọc stderr $\to$ suy nghĩ phương án sửa $\to$ tự sửa code $\to$ chạy lại test cho đến khi thành công. Biến Chatbot thụ động thành Agent tự hành.

#### Step 5: The Harness & Sandbox — Khung gầm bảo vệ & Dây cương an toàn
- **Code Card:** `harness.run(agent, sandbox=Docker, timeout=10s, max_tokens=8000)`
- **Mô phỏng Canvas 3D:** Một lồng kính bảo vệ (Sandbox) bao bọc toàn bộ chu trình bên trong.
- **Cơ chế ngầm:** Môi trường máy chủ (Execution Harness): Cô lập quyền OS (chặn các lệnh phá hoại `rm -rf`), tự động nén ngữ cảnh khi token đầy (Context Compaction), quản lý ngân sách chi phí, và cơ chế Reactive Wakeup đánh thức agent khi tác vụ nền xong.

#### Step 6: Superpowers & Skills — Trang bị Siêu năng lực Chuyên môn
- **Code Card:** `await browser.goto("localhost:3000"); page.click("#login")`
- **Mô phỏng Canvas 3D:** Các module vũ khí phụ trợ gắn ngoài vào Harness (Playwright Headless Browser, AST Parser, Dynamic Workflow Scripts).
- **Cơ chế ngầm:** Nâng cấp Agent thành kỹ sư đa năng có thể tự mở trình duyệt web click chuột, phân tích cây cú pháp mã nguồn, và tự viết script python điều phối công việc.

#### Step 7: The Orchestration Framework (LangChain & LangGraph)
- **Code Card:** `graph = StateGraph(State); graph.add_node("coder"); graph.add_conditional_edges(...)`
- **Mô phỏng Canvas 3D:** Sơ đồ mạch điều khiển (State Machine) với các nút rẽ nhánh có điều kiện, checkpoint lưu vết trạng thái và cổng can thiệp của con người (Human-in-the-loop).
- **Cơ chế ngầm:** Bản chất của LangChain/LangGraph: Không phải là AI, mà là chất keo kết dính (The Glue Code / Orchestration Framework) giúp quản lý đồ thị trạng thái, duy trì bộ nhớ phiên và rẽ nhánh luồng công việc linh hoạt.

#### Step 8: BMAD & Multi-Agent Swarms — Biến thành Cả Đội Ngũ Kỹ Sư Tự Trị
- **Code Card:** `coordinator.delegate(task, to=["researcher", "developer", "tester"])`
- **Mô phỏng Canvas 3D:** Toàn bộ hệ thống mở rộng thành một tòa nhà làm việc gồm 4 Agent chuyên biệt (Coordinator $\to$ Researcher $\to$ Coder $\to$ Tester) trao đổi qua Bảng tin chung (Message Board / Event Bus).
- **Cơ chế ngầm:** Phân rã bài toán lớn thành các sub-task. Mỗi Agent đóng đúng vai trò chuyên môn theo chuẩn BMAD (Behavior, Memory, Action, Decision), phối hợp ăn ý như một team kỹ sư ngoài đời thực, giải quyết các dự án khổng lồ mà không bị tràn context window.

---

## 15. Kế hoạch Mở rộng Toàn diện Topic `aws-cloud.sim` — Chuẩn 100% AWS Certified Solutions Architect (SAA-C03)

> **Mục tiêu:**
> Nâng cấp topic `aws-cloud.sim` từ 5 bài cơ bản lên trọn bộ **10 bài học kiến trúc chuyên sâu**, bao phủ đầy đủ 4 Miền Kiến thức (4 Domains) của đề thi chứng chỉ quốc tế **AWS SAA-C03** (Security, Resiliency, High Performance, Cost Optimization).

### 15.1 Phân bổ 2 Module trong Topic `aws-cloud.sim` (Tổng 10 bài):

#### Module 01: Core Infrastructure, Security & Hybrid Networking (5 bài)
1. **`aws-vpc` (Hiện có - 5 bước nâng cấp lên 6–7 bước) — VPC & Network Security:**
   - *Concepts:* CIDR, Multi-AZ Public/Private Subnets, Internet Gateway (IGW), NAT Gateway, Stateful Security Groups vs Stateless NACL, VPC Gateway Endpoints (S3/DynamoDB) vs Interface Endpoints (AWS PrivateLink).
2. **`aws-hybrid-networking` (MỚI - 7 bước) — Hybrid Cloud & Transit Gateway:**
   - *Concepts:* Site-to-Site IPSec VPN (dual tunnels) vs AWS Direct Connect (DX - dedicated 10Gbps line) $\to$ Direct Connect Gateway $\to$ Giới hạn của VPC Peering (non-transitive mesh n*(n-1)/2) $\to$ **AWS Transit Gateway (TGW)** mô hình Hub-and-Spoke kết nối hàng trăm VPCs & On-Premise $\to$ TGW Route Tables & Security inspection VPC.
3. **`aws-iam-security` (MỚI - 7 bước) — Identity & Data Protection (Chiếm 30% SAA-C03):**
   - *Concepts:* IAM Roles vs Users $\to$ IAM Policies (Least Privilege, Resource-based policies) $\to$ EC2 Instance Profiles $\to$ AWS Organizations & Service Control Policies (SCP) $\to$ **AWS KMS Envelope Encryption** (Customer Master Key CMK, Data Key sinh tại client) $\to$ Secrets Manager (Auto-rotation) vs Systems Manager (SSM) Parameter Store.
4. **`aws-edge-security` (MỚI - 7 bước) — Edge Protection & Auditing:**
   - *Concepts:* Amazon CloudFront CDN Edge & Route 53 DNS $\to$ Origin Access Control (OAC) chặn truy cập trực tiếp S3 $\to$ **AWS WAF** (SQLi, XSS, Rate-limiting rules) $\to$ **AWS Shield** (Standard miễn phí L3/L4 vs Shield Advanced bảo vệ L7 có nhóm phản ứng nhanh SRT) $\to$ AWS CloudTrail (kiểm toán API calls) $\to$ AWS Config (kiểm tra compliance cấu hình).
5. **`aws-ha-dr` (Hiện có `aws-ha` - 5 bước nâng cấp lên 7 bước) — High Availability & Disaster Recovery:**
   - *Concepts:* Route 53 Routing Policies (Latency, Geolocation, Geoproximity, Multi-Value, Failover) $\to$ Cross-Zone ALB $\to$ Auto Scaling Groups (Target Tracking, Step Scaling, Scheduled, Cooldowns) $\to$ Mô phỏng sập AZ $\to$ **4 Chiến lược Disaster Recovery (DR):** Backup & Restore (RTO/RPO tính bằng giờ) $\to$ Pilot Light $\to$ Warm Standby $\to$ Multi-Region Active-Active.

#### Module 02: Compute, Storage, Serverless & Data Analytics (5 bài)
6. **`aws-compute-scaling` (MỚI - 7 bước) — Compute Portfolio & Cost Optimization:**
   - *Concepts:* EC2 Purchasing Models: On-Demand vs Spot Instances (tiết kiệm đến 90%, cơ chế 2-minute interruption notice) vs Reserved Instances/Savings Plans $\to$ EC2 Placement Groups (Cluster, Spread, Partition) $\to$ Container compute: ECS (EC2 launch type vs Serverless Fargate) vs EKS (Kubernetes managed) $\to$ AWS Batch xử lý job tính toán phân tán.
7. **`aws-storage-tiering` (Hiện có `aws-storage-db` tách phần Storage - 7 bước) — Storage Portfolio:**
   - *Concepts:* Amazon S3 Storage Classes (Standard, Infrequent Access, Glacier Instant/Flexible/Deep Archive) $\to$ S3 Intelligent-Tiering & Lifecycle Transitions $\to$ S3 Object Lock (WORM compliance) $\to$ Amazon EBS (gp3, io2 Block Express, Multi-Attach) $\to$ Amazon EFS (Shared POSIX file system Multi-AZ) vs Amazon FSx (FSx for Windows, FSx for Lustre hiệu năng cao).
8. **`aws-databases` (Hiện có `aws-storage-db` tách phần DB - 7 bước) — Database Tiering:**
   - *Concepts:* Amazon RDS Multi-AZ (Sync standby) vs Read Replicas (Async) $\to$ **Amazon Aurora Shared Storage Architecture** (6 bản sao phân bổ 3 AZs, tự động mở rộng storage 128TB, sub-30s failover) $\to$ Aurora Serverless v2 $\to$ **Amazon DynamoDB** (Partitions, WCU/RCU, Global Tables multi-region active-active, DAX in-memory cache) $\to$ Amazon ElastiCache (Redis Cluster vs Memcached).
9. **`aws-serverless-event` (Hiện có `aws-serverless` - 5 bước nâng cấp lên 7 bước) — Event-Driven Serverless:**
   - *Concepts:* Amazon SQS (Standard at-least-once vs FIFO exactly-once, Visibility Timeout, DLQ) $\to$ Amazon SNS Fanout Pattern $\to$ **Amazon EventBridge** (Event bus, JSON content-based routing, tích hợp bên thứ ba) $\to$ AWS Lambda (Concurrency limits, Provisioned Concurrency triệt tiêu Cold Start) $\to$ **AWS Step Functions** (State Machine điều phối distributed workflows, Saga pattern, retry/backoff logic).
10. **`aws-data-migration` (MỚI - 7 bước) — Migration & Big Data Analytics:**
    - *Concepts:* AWS Snow Family (Snowball Edge, Snowmobile chuyển Petabytes vật lý) $\to$ **AWS DMS (Database Migration Service)** & AWS Schema Conversion Tool (SCT) di chuyển DB minimal downtime $\to$ Realtime Streaming: Amazon Kinesis Data Streams vs Kinesis Data Firehose $\to$ **Serverless Analytics:** AWS Glue (Data Catalog, Crawler) $\to$ Amazon Athena (Query trực tiếp S3 bằng SQL) $\to$ Amazon Redshift (Data Warehouse columnar MPP).

---





