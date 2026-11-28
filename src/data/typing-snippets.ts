// Snippets for the /lab/typing test. Plain ASCII only (no curly quotes or tabs) so every
// character can be typed on a normal keyboard; indentation uses spaces.

export type TypingLang = 'java' | 'sql' | 'git' | 'typescript' | 'docker';

export interface TypingSnippet {
  id: string;
  lang: TypingLang;
  title: string;
  code: string;
}

export const TYPING_LANGS: ReadonlyArray<{ id: TypingLang; label: string }> = [
  { id: 'java', label: 'Java' },
  { id: 'sql', label: 'SQL' },
  { id: 'git', label: 'Git' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'docker', label: 'Docker & YAML' },
];

export const TYPING_SNIPPETS: TypingSnippet[] = [
  {
    id: 'java-record-stream',
    lang: 'java',
    title: 'Record and stream',
    code: `record Point(int x, int y) {}

List<Point> pts = List.of(new Point(1, 2), new Point(3, 4));
int sum = pts.stream()
    .mapToInt(Point::x)
    .sum();`,
  },
  {
    id: 'java-try-resources',
    lang: 'java',
    title: 'try-with-resources',
    code: `try (var in = Files.newBufferedReader(path)) {
    String line;
    while ((line = in.readLine()) != null) {
        System.out.println(line);
    }
}`,
  },
  {
    id: 'java-spring-controller',
    lang: 'java',
    title: 'Spring REST controller',
    code: `@RestController
@RequestMapping("/api/orders")
class OrderController {
    @GetMapping("/{id}")
    Order get(@PathVariable long id) {
        return service.find(id);
    }
}`,
  },
  {
    id: 'sql-join-group',
    lang: 'sql',
    title: 'Join, group, having',
    code: `SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
HAVING COUNT(o.id) > 3
ORDER BY orders DESC;`,
  },
  {
    id: 'sql-window-cte',
    lang: 'sql',
    title: 'CTE with a window function',
    code: `WITH ranked AS (
    SELECT id, dept, salary,
           RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS r
    FROM employees
)
SELECT * FROM ranked WHERE r = 1;`,
  },
  {
    id: 'sql-index-explain',
    lang: 'sql',
    title: 'Index and EXPLAIN',
    code: `CREATE INDEX idx_orders_customer
    ON orders (customer_id, created_at DESC);

EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42;`,
  },
  {
    id: 'git-feature-flow',
    lang: 'git',
    title: 'Feature branch flow',
    code: `git switch -c feature/login
git add -p
git commit -m "feat: add login form"
git fetch origin
git rebase origin/main
git push --force-with-lease`,
  },
  {
    id: 'git-bisect',
    lang: 'git',
    title: 'Bisect a regression',
    code: `git bisect start
git bisect bad HEAD
git bisect good v1.4.0
git bisect run npm test
git bisect reset`,
  },
  {
    id: 'ts-group-by',
    lang: 'typescript',
    title: 'Generic groupBy',
    code: `function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}`,
  },
  {
    id: 'ts-debounce',
    lang: 'typescript',
    title: 'Debounce',
    code: `function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}`,
  },
  {
    id: 'ts-promise-all',
    lang: 'typescript',
    title: 'Parallel requests',
    code: `const [user, posts] = await Promise.all([
  fetch("/api/user").then((r) => r.json()),
  fetch("/api/posts").then((r) => r.json()),
]);`,
  },
  {
    id: 'docker-multistage',
    lang: 'docker',
    title: 'Multi-stage Dockerfile',
    code: `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html`,
  },
  {
    id: 'yaml-github-actions',
    lang: 'docker',
    title: 'GitHub Actions workflow',
    code: `name: ci
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test`,
  },
];
