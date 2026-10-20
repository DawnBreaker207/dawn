// EO_SQL: Giant single statement for the execution-order dissection.
// Clause spans carry data-step = the phase in which the ENGINE actually runs that clause.
export const EO_SQL = `<span class="eo-cl" data-step="1">WITH top_products AS ( -- CTE: parsed up here… runs where it is joined
  SELECT   product_id,
           SUM(quantity) AS sold
  FROM     order_items
  GROUP BY product_id
  HAVING   SUM(quantity) > 500
),
avg_ticket AS ( -- consumed once, materialized when WHERE first reads it
  SELECT AVG(total_usd) AS avg_total
  FROM   orders
)</span>
<span class="eo-cl" data-step="13">SELECT
  c.name                                      AS customer,
  SUM(oi.quantity)                            AS units,
  ROUND(SUM(oi.quantity * oi.unit_price), 2)  AS revenue,
  <span class="eo-cl" data-step="13">CASE -- per-row at projection time
    WHEN c.country = 'VN' THEN 'domestic'
    WHEN c.tier IS NOT NULL THEN c.tier
    ELSE COALESCE(c.segment, 'international')
  END</span> AS segment,
  <span class="eo-cl" data-step="14">ROW_NUMBER() OVER ( -- window fn: after GROUP BY/HAVING, before ORDER BY
    PARTITION BY c.country
    ORDER BY SUM(oi.quantity * oi.unit_price) DESC
  )</span> AS cc_rank</span>
FROM <span class="eo-cl" data-step="2">( -- inner query: base of the whole pipeline
  SELECT   o.customer_id,
           SUM(o.total_usd) AS lifetime_spend
  FROM     orders o</span>
  <span class="eo-cl" data-step="3">WHERE  o.status IN ('paid', 'shipped')
    AND  o.created_at >= DATE '2026-01-01'</span>
  <span class="eo-cl" data-step="4">GROUP BY o.customer_id</span>
) AS big_spenders
JOIN <span class="eo-cl" data-step="5">orders o      ON o.customer_id = big_spenders.customer_id</span>
JOIN <span class="eo-cl" data-step="6">order_items oi ON oi.order_id   = o.id</span>
JOIN <span class="eo-cl" data-step="7">products p     ON p.id          = oi.product_id
JOIN top_products tp ON tp.product_id = p.id -- CTE executes here</span>
JOIN <span class="eo-cl" data-step="8">customers c    ON c.id = o.customer_id</span>
WHERE <span class="eo-cl" data-step="9">c.country = 'VN'
  AND o.total_usd > (SELECT avg_total FROM avg_ticket)</span>
  AND <span class="eo-cl" data-step="10">EXISTS ( -- correlated: re-evaluated PER candidate row
        SELECT 1
        FROM   reviews r
        WHERE  r.order_id = o.id
          AND  r.rating >= 4 )</span>
<span class="eo-cl" data-step="11">GROUP BY c.name, c.country</span>
<span class="eo-cl" data-step="12">HAVING SUM(oi.quantity * oi.unit_price) > 1000000
   AND COUNT(*) > 3</span>
<span class="eo-cl" data-step="15">UNION
SELECT '— (no segment)', 0, 0, 'domestic', 0</span>
<span class="eo-cl" data-step="16">ORDER BY revenue DESC</span>
<span class="eo-cl" data-step="17">LIMIT 10;</span>`;

export interface EoStep {
  clause: string;
  title: string;
  detail: string;
  rows: string;
}

export const EO_STEPS: EoStep[] = [
  { clause: '1', title: 'WITH — CTEs parsed, not run', detail: 'Non-recursive CTEs are parsed up here and INLINED where referenced (avg_ticket) — forcing MATERIALIZED would run them standalone.', rows: '2 CTEs defined' },
  { clause: '2', title: 'FROM — inner query base', detail: 'orders enters the pipeline first; the inner query is a black box the outer one waits on.', rows: '172,000 rows' },
  { clause: '3', title: 'WHERE — inner query', detail: 'Pushes down the status + date filters before any grouping happens.', rows: '64,300 rows' },
  { clause: '4', title: 'GROUP BY — derived table', detail: 'Hash-aggregates spend per customer_id; the result materializes as big_spenders.', rows: '9,850 groups' },
  { clause: '5', title: 'JOIN ← big_spenders', detail: 'Re-attaches each matching order to its spender (nested loop + PK index lookup).', rows: '64,300 rows' },
  { clause: '6', title: 'JOIN order_items', detail: 'Hash join: small build side in work_mem, then probe the line-items stream.', rows: '511,700 rows' },
  { clause: '7', title: 'CTE + products join', detail: 'top_products runs for real right here (its HAVING keeps >500 sold); semi filter against the product dim.', rows: '214,900 rows' },
  { clause: '8', title: 'JOIN customers', detail: 'PK join to the dimension fetches name/country/tier for every surviving row.', rows: '511,700 rows' },
  { clause: '9', title: 'WHERE — outer filters', detail: 'Country = VN and spend > the cached avg_ticket — first read of the CTE materializes it as one constant.', rows: '88,400 rows' },
  { clause: '10', title: 'EXISTS — correlated, per row', detail: 'The OPPOSITE of the cached scalar: re-evaluated for every candidate row until one match; planners turn it into a semi-join.', rows: '61,900 rows' },
  { clause: '11', title: 'GROUP BY — outer', detail: 'Hash-aggregates by (name, country); only grouped columns stay available downstream.', rows: '6,120 groups' },
  { clause: '12', title: 'HAVING — aggregate filter', detail: 'Filters on SUM and COUNT(*) together; WHERE sees raw rows, HAVING sees group aggregates.', rows: '214 groups' },
  { clause: '13', title: 'SELECT — CASE & projection', detail: 'CASE chains are evaluated per row with COALESCE fallbacks; column names only exist from here on.', rows: '214 rows' },
  { clause: '14', title: 'window function', detail: 'ROW_NUMBER runs after GROUP BY/HAVING but before ORDER BY — PARTITION BY slices, no rows removed.', rows: '+1 rank col' },
  { clause: '15', title: 'UNION — dedupe pass', detail: 'Appends the guard branch, then sorts + de-duplicates both sides. UNION ALL would skip this.', rows: '215 rows' },
  { clause: '16', title: 'ORDER BY — top-N', detail: 'Sorts on the aliased output column revenue — it references the projection, not a source column.', rows: 'sorted' },
  { clause: '17', title: 'LIMIT — the handoff', detail: 'Caps the stream at 10 rows and hands the result set to the client.', rows: '10 rows' },
];

export interface CaseBranch {
  pill: string;
  plan: string;
  skips: string;
  note: string;
  code: string;
}

export const CASE_BRANCHES: CaseBranch[] = [
  {
    pill: "metric = 'revenue'",
    plan: 'full 17-phase pipeline — exactly the dissected statement',
    skips: 'nothing — CTEs, window, UNION all run',
    note: "Revenue keeps the giant statement. Note the split of responsibilities: CASE routes a VALUE inside SQL; routing the QUERY SHAPE was decided in the app layer before the statement was ever sent.",
    code: `-- the full dissection from the panel above, verified digest:
WITH top_products AS (...), avg_ticket AS (...)
SELECT ... CASE segment ... ROW_NUMBER() OVER (...)
FROM (inner) JOIN ×5 ... GROUP BY ... HAVING ...
UNION ... ORDER BY revenue LIMIT 10
-- 2 CTEs · 5 joins · correlated EXISTS · window · UNION`,
  },
  {
    pill: "metric = 'units'",
    plan: '6-phase lean pipeline',
    skips: 'inner query, both CTEs, HAVING, window, UNION',
    note: 'A leaner metric takes a leaner shape — no big_spenders black box, so the planner starts straight from the fact tables and skips every aggregation layer.',
    code: `SELECT p.name, SUM(oi.quantity) AS units
FROM   order_items oi
JOIN   products p ON p.id = oi.product_id
WHERE  oi.shipped_at >= DATE '2026-01-01'
GROUP BY p.name
ORDER BY units DESC
LIMIT 10;
-- phases: FROM → JOIN → WHERE → GROUP BY → ORDER BY → LIMIT`,
  },
  {
    pill: "metric = 'refund'",
    plan: '3-phase detail report',
    skips: 'all aggregation, customers dim, ranking, dedupe',
    note: 'Line-item shape — refunds report row by row, so every GROUP BY/HAVING/UNION stage disappears from the pipeline.',
    code: `SELECT o.id, r.reason, -(o.total_usd) AS refund_amount
FROM   refunds r
JOIN   orders o ON o.id = r.order_id
WHERE  r.created_at >= DATE '2026-01-01';
-- phases: FROM → JOIN → WHERE — everything else never runs`,
  },
  {
    pill: 'metric IS NULL',
    plan: 'COALESCE guard — tiny default view',
    skips: 'the branching logic entirely',
    note: 'No branch was chosen, so no branch ran. CASE can pick a VALUE inside an expression (COALESCE fallback here); SQL has no IF around statements — a NULL metric sends a different, much smaller query.',
    code: `SELECT 'no metric selected' AS notice,
       COALESCE((SELECT AVG(total_usd) FROM orders), 0) AS default_view
LIMIT 1;
-- CASE-in-expression fallback: the value is picked inside SQL,
-- the missing branch is picked by the caller.`,
  },
];
