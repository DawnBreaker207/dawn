// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

export const javaSpringBootAutoconfigLesson = {
  id: `java-spring-boot-autoconfig`,
  title: `Spring Boot Auto-Configuration Engine`,
  summary: `How Spring Boot eliminates boilerplate: @SpringBootApplication composition, AutoConfigurationImportSelector, conditional evaluation (@ConditionalOnClass/Bean), and AutoConfiguration.imports.`,
  minutes: 14,
  level: `advanced`,
  metrics: ['boot_stage', 'candidates_loaded', 'conditions_evaluated', 'beans_registered', 'startup_time_ms'],
  legend: ['req', 'res', ['ping', 'condition evaluation'], 'fail'],
  goals: [
    { text: '@SpringBootApplication meta-annotation decomposition', step: 0 },
    { text: 'AutoConfiguration import discovery mechanism', step: 1 },
    { text: '@ConditionalOnClass and @ConditionalOnMissingBean', step: 2 },
    { text: 'AutoConfiguration phase ordering directives', step: 3 },
    { text: 'ConditionEvaluationReport & startup diagnostics', step: 4 },
  ],
  steps: [
    {
      short: `Bootstrap`,
      chapter: `technique`,
      title: `@SpringBootApplication Decomposition`,
      body: [
        `The single <code>@SpringBootApplication</code> annotation is actually a composite of three essential annotations:`,
        `1. <code>@SpringBootConfiguration</code> (marks configuration source)<br/>2. <code>@ComponentScan</code> (scans user code in current package)<br/>3. <code>@EnableAutoConfiguration</code> (activates the auto-config engine).`,
      ],
      callout: { kind: `insight`, text: 'Auto-configuration is executed after user beans are scanned, allowing user beans to override default auto-configurations.' },
      metrics: { boot_stage: 'Context Bootstrap', candidates_loaded: '0', conditions_evaluated: '0', beans_registered: 'User Beans Scanned', startup_time_ms: '150ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, '@SpringBootApplication Decomposition', [
            '@SpringBootApplication // Metapackage combining 3 annotations:',
            '= @SpringBootConfiguration // Specialized @Configuration',
            '= @EnableAutoConfiguration // Triggers AutoConfigurationImportSelector',
            '= @ComponentScan           // Scans current package for @Component, @Service',
          ]),
          app_entry: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['App', 'Main'], sub: '@SpringBootApplication' }),
          component_scan: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'workflow', label: ['@Comp.', 'Scan'], sub: 'User Services & Repos' }),
          enable_auto: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'server', label: ['@EnableAutoConfig'], sub: 'Triggers ImportSelector' }),
        },
        links: {
          ac: h('app_entry', 'component_scan', ['app_entry', 'component_scan'], { heads: 'end', label: 'scans package' }),
          ae: h('app_entry', 'enable_auto', ['app_entry', 'enable_auto'], { heads: 'end', label: 'activates autoconfig' }),
        },
        flows: [
          { route: ['ac'], bounce: false, rate: 1.8 },
          { route: ['ae'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Discovery`,
      chapter: `technique`,
      title: `AutoConfigurationImportSelector`,
      body: [
        `<strong>AutoConfigurationImportSelector</strong> loads candidates declared in <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code> (Spring Boot 3.x) or legacy <code>spring.factories</code>.`,
        `Typically ~140 auto-configuration candidates are discovered from starter dependencies (e.g. DataSourceAutoConfiguration, RedisAutoConfiguration, SecurityAutoConfiguration).`,
      ],
      callout: { kind: `insight`, text: 'In Spring Boot 3.x, AutoConfiguration.imports replaced spring.factories to improve discovery performance and modularity.' },
      metrics: { boot_stage: 'Candidate Discovery', candidates_loaded: '142 candidates', conditions_evaluated: 'Pending', beans_registered: 'User Beans Only', startup_time_ms: '380ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'AutoConfiguration Discovery', [
            '# Spring Boot 3 reads auto-configurations from file:',
            '= META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports',
            '// Example entries loaded by AutoConfigurationImportSelector:',
            'org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration',
            'org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration',
          ]),
          selector: d(-11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['ImportSelector'], sub: 'AutoConfig Engine' }),
          imports_file: d(0, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'storage', label: ['Auto', 'Imports'], sub: 'Classpath Manifests' }),
          candidate_list: d(11, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'code', label: ['Candidate Classes (142)'], sub: 'DataSource, Redis, MVC...' }),
        },
        links: {
          si: h('selector', 'imports_file', ['selector', 'imports_file'], { heads: 'end', label: 'reads classpath' }),
          sc: h('imports_file', 'candidate_list', ['imports_file', 'candidate_list'], { heads: 'end', label: 'parses class names' }),
        },
        flows: [
          { route: ['si', 'sc'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Conditionals`,
      chapter: `technique`,
      title: `Conditional Filtering (@ConditionalOn...)`,
      body: [
        `Spring filters the candidates using <strong>ConditionEvaluator</strong> without loading unneeded classes:`,
        `• <strong>@ConditionalOnClass:</strong> Checks if a class is on classpath (e.g. <code>org.postgresql.Driver</code>).<br/>• <strong>@ConditionalOnMissingBean:</strong> Checks if user already declared a bean (e.g. DataSource). If absent, auto-config steps in!<br/>• <strong>@ConditionalOnProperty:</strong> Checks if a configuration property is true.`,
      ],
      callout: { kind: `insight`, text: '@ConditionalOnMissingBean enables seamless zero-config defaults while preserving 100% user customizability.' },
      metrics: { boot_stage: 'Condition Evaluation', candidates_loaded: '142 candidates', conditions_evaluated: '38 matched / 104 skipped', beans_registered: 'Auto-configured beans active', startup_time_ms: '620ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, '@Conditional Filtering Guards', [
            '@AutoConfiguration',
            '= @ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })',
            '= @ConditionalOnMissingBean(DataSource.class)',
            'public class DataSourceAutoConfiguration {',
            '= @Bean public DataSource dataSource() { return createHikari(); }',
            '} // Only activates if DataSource is on classpath and user defined none!',
          ]),
          evaluator: d(-11, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'cpu', label: ['ConditionEvaluator'], sub: 'Inspects Classpath & IoC' }),
          passed_cfg: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['Positive Matches (38)'], sub: 'DataSourceAutoConfig' }),
          skipped_cfg: d(11, -4, { s: 3.8, h: 50, color: 'gray', glyph: 'storage', label: ['Negative Matches (104)'], sub: 'Cassandra, Redis (Skipped)' }),
        },
        links: {
          ep: h('evaluator', 'passed_cfg', ['evaluator', 'passed_cfg'], { heads: 'end', label: 'classes present' }),
          es: h('evaluator', 'skipped_cfg', ['evaluator', 'skipped_cfg'], { heads: 'none', label: 'conditions false' }),
        },
        flows: [
          { route: ['ep'], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `Ordering`,
      chapter: `technique`,
      title: `Configuration Phase Ordering`,
      body: [
        `Auto-configurations depend on one another. For example, <code>HibernateJpaAutoConfiguration</code> must execute <strong>after</strong> <code>DataSourceAutoConfiguration</code>.`,
        `Spring Boot resolves these dependencies using <code>@AutoConfigureAfter</code>, <code>@AutoConfigureBefore</code>, and topological sorting before registering beans into BeanDefinitionRegistry.`,
      ],
      callout: { kind: `insight`, text: 'AutoConfigurationSorter sorts the dependency DAG to guarantee deterministic bean creation order.' },
      metrics: { boot_stage: 'DAG Topological Sort', candidates_loaded: '38 ordered', conditions_evaluated: 'Complete', beans_registered: 'Dependencies ordered', startup_time_ms: '850ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'AutoConfiguration Ordering Directives', [
            '@AutoConfiguration(',
            '= after = DataSourceAutoConfiguration.class,',
            '= before = HibernateJpaAutoConfiguration.class',
            ')',
            'public class MyCustomDbAutoConfiguration { ... }',
            '# Guarantees prerequisites are registered before dependent beans',
          ]),
          datasource_cfg: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'storage', label: ['DataSource', 'Config'], sub: 'Step 1: HikariPool Bean' }),
          jpa_cfg: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['JpaAutoConfig'], sub: 'Step 2: EntityManagerFactory' }),
          tx_cfg: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['TxAutoConfig'], sub: 'Step 3: PlatformTxManager' }),
        },
        links: {
          dj: h('datasource_cfg', 'jpa_cfg', ['datasource_cfg', 'jpa_cfg'], { heads: 'end', label: '@AutoConfigureAfter' }),
          jt: h('jpa_cfg', 'tx_cfg', ['jpa_cfg', 'tx_cfg'], { heads: 'end', label: '@AutoConfigureAfter' }),
        },
        flows: [
          { route: ['dj', 'jt'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Diagnostics`,
      chapter: `technique`,
      title: `ConditionEvaluationReport & Debugging`,
      body: [
        `When an auto-configuration does not behave as expected, starting with <code>--debug</code> produces the <strong>ConditionEvaluationReport</strong>.`,
        `The report categorizes every candidate into: <strong>Positive Matches</strong> (why it was enabled), <strong>Negative Matches</strong> (which condition failed), and <strong>Exclusions</strong>.`,
      ],
      callout: { kind: `insight`, text: 'Understanding the ConditionEvaluationReport is essential for troubleshooting complex Spring Boot starter interactions.' },
      metrics: { boot_stage: 'Startup Complete', candidates_loaded: '142', conditions_evaluated: '100% Done', beans_registered: 'Ready for traffic', startup_time_ms: '1,240ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'ConditionEvaluationReport (--debug)', [
            '# Run app with: java -jar app.jar --debug',
            '= ============================',
            '= CONDITIONS EVALUATION REPORT',
            '= ============================',
            '= Positive matches: DataSourceAutoConfiguration matched on Class HikariCP',
            '! Negative matches: RedisAutoConfiguration did not find RedisConnectionFactory',
          ]),
          cli_flag: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['--debug Flag'], sub: 'Diagnostic Trigger' }),
          report_engine: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['EvalReport'], sub: 'Full Audit Trail' }),
          console_out: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'cpu', label: ['Positive / Negative Log'], sub: 'Explains every bean' }),
        },
        links: {
          cr: h('cli_flag', 'report_engine', ['cli_flag', 'report_engine'], { heads: 'end', label: 'activates logging' }),
          rc: h('report_engine', 'console_out', ['report_engine', 'console_out'], { heads: 'end', label: 'outputs report' }),
        },
        flows: [
          { route: ['cr', 'rc'], bounce: false, rate: 1.5 },
        ],
      },
    },
  ],
};
