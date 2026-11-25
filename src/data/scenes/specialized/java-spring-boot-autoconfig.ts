/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringBootAutoconfigLesson: Lesson = {
  id: 'java-spring-boot-autoconfig',
  title: 'Spring Boot Auto-Config',
  summary:
    'Trace Spring Boot startup from @SpringBootApplication through AutoConfiguration.imports, @Conditional filtering, PropertySources precedence, and @ConfigurationProperties binding.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['boot_phase', 'conditions', 'config_source', 'bean_status'],
  legend: ['flow', ['req', 'scan / merge'], ['res', 'bind / active'], ['fail', 'back-off']],
  goals: [
    { text: 'Trigger @EnableAutoConfiguration from @SpringBootApplication', step: 1 },
    { text: 'Load candidates from AutoConfiguration.imports', step: 2 },
    { text: 'Filter beans via @ConditionalOnClass & MissingBean', step: 3 },
    { text: 'Merge PropertySources hierarchy (Env > YAML)', step: 4 },
    { text: 'Bind immutable @ConfigurationProperties records', step: 5 },
    { text: 'Produce ready DataSource with user overrides', step: 6 },
  ],
  steps: [
    {
      short: 'Boot Entry',
      chapter: 'autoconfig',
      title: '1. @SpringBootApplication Entry Point',
      body: [
        '<code>@SpringBootApplication</code> combines three annotations: <code>@SpringBootConfiguration</code>, <code>@ComponentScan</code>, and <code>@EnableAutoConfiguration</code>.',
        'Instead of writing hundreds of lines of XML or boilerplate <code>@Bean</code> factories, Spring Boot inspects your classpath and configures sensible defaults automatically.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Boot does NOT generate magic code — it runs standard @Configuration classes gated by @Conditional checks.',
      },
      metrics: { boot_phase: 'Bootstrap', conditions: 'Pending', config_source: 'Main class', bean_status: 'Starting' },
      scene: {
        entities: {
          main: d(-14, -14, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['SpringApp.run'], sub: '@SpringBootApp' }),
          enable: d(2, -6, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['EnableAutoCfg'], sub: 'ImportSelector' }),
          card: S({ x: -12, y: 12 }, '1. @SpringBootApplication Composition', [
            '@SpringBootApplication // = 3 annotations:',
            '// 1. @SpringBootConfiguration',
            '// 2. @ComponentScan (your packages)',
            '// 3. @EnableAutoConfiguration (starter JARs)',
          ], { icon: 'terminal' }),
        },
        links: {
          m_en: h('main', 'enable', ['main', 'enable'], { heads: 'end', label: 'trigger' }),
        },
        flows: [{ route: ['m_en'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'imports File',
      chapter: 'autoconfig',
      title: '2. Reading AutoConfiguration.imports from Starters',
      body: [
        '<code>AutoConfigurationImportSelector</code> scans every JAR on the classpath for <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>.',
        'Over 140 candidate configuration classes (Tomcat, Jackson, DataSource, Security) are discovered, but most will be skipped if their libraries aren’t present.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run with --debug (or /actuator/conditions) to see the exact Conditions Evaluation Report of what matched or skipped.',
      },
      changes: ['+ Scans all JARs for AutoConfiguration.imports', '+ ~140 candidate configs queued'],
      metrics: { boot_phase: 'Discovery', conditions: '140 candidates', config_source: 'Starter JARs', bean_status: 'Queued' },
      scene: {
        entities: {
          enable: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['ImportSelector'], sub: 'Boot 3.x' }),
          jars: b(0, -14, { r: 2.2, h: 48, color: 'purple', label: ['Starter JARs'], sub: '.imports file' }),
          cands: d(0, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Candidates'], sub: '140 configs' }),
          card: S({ x: -12, y: 12 }, '2. Spring Boot 3 AutoConfiguration.imports', [
            '// META-INF/spring/...AutoConfiguration.imports',
            'org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration',
            'org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration',
          ], { icon: 'terminal' }),
        },
        links: {
          en_jr: h('enable', 'jars', ['enable', 'jars'], { heads: 'end', label: 'read META-INF' }),
          jr_cn: h('jars', 'cands', ['jars', 'cands'], { heads: 'end', label: 'load list' }),
        },
        flows: [{ route: ['en_jr', 'jr_cn'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: '@Conditional',
      chapter: 'autoconfig',
      title: '3. @ConditionalOnClass & @ConditionalOnMissingBean',
      body: [
        'Each candidate is filtered by conditions: <code>@ConditionalOnClass(HikariDataSource.class)</code> checks if the driver JAR exists; <code>@ConditionalOnMissingBean</code> backs off if you defined your own custom bean!',
        'This "opinionated defaults with zero-friction override" is the secret behind Spring Boot.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Boot always backs off politely when you declare your own @Bean DataSource or ObjectMapper.',
      },
      changes: ['+ @ConditionalOnClass checks classpath', '+ @ConditionalOnMissingBean yields to user'],
      metrics: { boot_phase: 'Filter Match', conditions: 'Matched / Skip', config_source: 'Classpath', bean_status: 'Filtered' },
      scene: {
        entities: {
          cands: d(-14, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Candidates'], sub: '140 configs' }),
          cond: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'shield', label: ['@Conditional'], sub: 'Class + Bean' }),
          skip: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Back-Off'], sub: 'user bean wins' }),
          card: S({ x: -12, y: 12 }, '3. Conditional Evaluation & Back-Off', [
            '@AutoConfiguration',
            '@ConditionalOnClass({ DataSource.class, HikariDataSource.class })',
            '@ConditionalOnMissingBean(DataSource.class) // backs off!',
            'public DataSource hikariDataSource(...) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          cn_cd: h('cands', 'cond', ['cands', 'cond'], { heads: 'end', label: 'evaluate' }),
          cd_sk: h('cond', 'skip', ['cond', 'skip'], { heads: 'end', label: 'user exists' }),
        },
        flows: [{ route: ['cn_cd'], kind: 'req', rate: 1.8 }, { route: ['cd_sk'], kind: 'fail', rate: 1.3 }],
      },
    },
    {
      short: 'Config Order',
      chapter: 'config',
      title: '4. PropertySources Precedence & Profiles',
      body: [
        'Spring Environment merges configuration from multiple <code>PropertySource</code> layers in strict priority order: <strong>CLI args &gt; OS Env Vars &gt; <code>application-{profile}.yml</code> &gt; <code>application.yml</code></strong>.',
        'Relaxed binding automatically maps <code>SPRING_DATASOURCE_URL</code> (env var) to <code>spring.datasource.url</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never commit production secrets in application.yml — inject them via Env Vars or Vault/K8s Secrets at higher precedence.',
      },
      changes: ['+ Env Vars override profile YAML', '+ Relaxed binding normalizes SNAKE_CASE'],
      metrics: { boot_phase: 'Env Merge', conditions: 'Active Profile', config_source: 'Env > YAML', bean_status: 'Resolved' },
      scene: {
        entities: {
          yml: b(-2, -16, { r: 2.2, h: 48, color: 'sky', label: ['app-prod.yml'], sub: 'tier 6 YAML' }),
          env: d(-2, -2, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['OS Env Vars'], sub: 'tier 3 wins!' }),
          reg: d(12, -9, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Environment'], sub: 'PropSources' }),
          card: S({ x: -12, y: 12 }, '4. Spring Boot Property Precedence', [
            '// Highest -> Lowest priority:',
            '// 1. CLI args: --server.port=9090',
            '// 2. OS Env:   SERVER_PORT=9090 (relaxed binding)',
            '// 3. Profile:  application-prod.yml',
            '// 4. Default:  application.yml',
          ], { icon: 'terminal' }),
        },
        links: {
          y_reg: h('yml', 'reg', ['yml', 'reg'], { heads: 'end', label: 'fallback' }),
          e_reg: h('env', 'reg', ['env', 'reg'], { heads: 'end', label: 'wins' }),
        },
        flows: [{ route: ['e_reg'], kind: 'res', rate: 2.0 }, { route: ['y_reg'], kind: 'req', rate: 1.3 }],
      },
    },
    {
      short: 'ConfigProps',
      chapter: 'config',
      title: '5. Type-Safe @ConfigurationProperties Binding',
      body: [
        'Instead of scattering fragile <code>@Value("${...}")</code> strings, bind an entire prefix into an immutable Java <code>record</code> with Bean Validation (<code>@Validated</code>).',
        'Invalid or missing required config fails fast at startup with a clear diagnostics banner.',
      ],
      callout: {
        kind: 'insight',
        text: '@ConfigurationProperties on a Java record gives immutability, IDE autocomplete, and @NotBlank validation at boot.',
      },
      changes: ['+ @ConfigurationProperties binds prefix', '+ @Validated fails fast on bad config'],
      metrics: { boot_phase: 'Bind Props', conditions: 'Validated', config_source: 'Typed Record', bean_status: 'Immutable' },
      scene: {
        entities: {
          reg: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Environment'], sub: 'app.payment.*' }),
          binder: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Binder'], sub: 'validate types' }),
          rec: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['PaymentProps'], sub: 'Java record' }),
          card: S({ x: -12, y: 12 }, '5. Immutable @ConfigurationProperties Record', [
            '@Validated',
            '@ConfigurationProperties(prefix = "app.payment")',
            'public record PaymentProps(',
            '  @NotBlank String apiKey,',
            '  @Positive Duration timeout) {}',
          ], { icon: 'terminal' }),
        },
        links: {
          r_bnd: h('reg', 'binder', ['reg', 'binder'], { heads: 'end', label: 'read keys' }),
          bnd_rc: h('binder', 'rec', ['binder', 'rec'], { heads: 'end', label: 'bind record' }),
        },
        flows: [{ route: ['r_bnd', 'bnd_rc'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Live Bean',
      chapter: 'autoconfig',
      title: '6. Auto-Configured DataSource Bean Ready',
      body: [
        'Putting it all together: Spring Boot detects Postgres + HikariCP on the classpath, binds <code>spring.datasource.*</code> from Env/YAML, and registers a production-ready <code>HikariDataSource</code> bean.',
        'Your <code>@Service</code> beans inject it immediately with zero manual setup.',
      ],
      callout: {
        kind: 'insight',
        text: 'Auto-configuration + externalized PropertySources lets the exact same JAR run in dev, staging, and prod.',
      },
      changes: ['+ HikariDataSource bean instantiated', '+ Ready for @Service & @Repository DI'],
      metrics: { boot_phase: 'Ready', conditions: 'All Passed', config_source: 'Bound', bean_status: 'Live HikariCP' },
      scene: {
        entities: {
          cond: d(-14, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AutoConfig'], sub: 'matched' }),
          ds: b(-14, -14, { r: 2.3, h: 50, color: 'green', label: ['HikariPool'], sub: 'live bean' }),
          app: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'ready to serve' }),
          card: S({ x: -12, y: 12 }, '6. Final Result: Live Auto-Configured Stack', [
            '// Same JAR, zero code changes across environments:',
            '// 1. HikariDataSource auto-configured from Env Vars',
            '// 2. Injected into JdbcTemplate / EntityManager',
            '// 3. Tomcat listening on :8080 -> Ready!',
          ], { icon: 'terminal' }),
        },
        links: {
          cd_ds: h('cond', 'ds', ['cond', 'ds'], { heads: 'end', label: 'create @Bean' }),
          ds_ap: h('ds', 'app', ['ds', 'app'], { heads: 'end', label: 'inject' }),
        },
        flows: [{ route: ['cd_ds', 'ds_ap'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
};
