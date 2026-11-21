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
