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

export const javaSpringConfigLesson = {
  id: `java-spring-config`,
  title: `Spring Configuration, Profiles & Property Hierarchy`,
  summary: `Mastering enterprise configuration: The 17-tier PropertySource precedence order, @ConfigurationProperties type-safety, Relaxed Binding, and multi-profile setups.`,
  minutes: 13,
  level: `advanced`,
  metrics: ['active_profile', 'active_tier', 'source_origin', 'bound_class', 'validation_state'],
  legend: ['req', 'res', ['ping', 'property resolution'], 'fail'],
  goals: [
    { text: 'The 17-tier PropertySource override hierarchy', step: 0 },
    { text: '@ConfigurationProperties type-safe binding & validation', step: 1 },
    { text: 'Relaxed binding engine (camelCase vs KEBAB_CASE)', step: 2 },
    { text: 'Profile activation (@Profile) & conditional loading', step: 3 },
    { text: 'Cloud secrets & HashiCorp Vault externalization', step: 4 },
  ],
  steps: [
    {
      short: `Hierarchy`,
      chapter: `technique`,
      title: `The 17-Tier PropertySource Hierarchy`,
      body: [
        `Spring Boot defines a strict order of precedence across 17 property sources. A value defined in a higher-priority source overrides any lower-priority source!`,
        `Top tiers include: 1. DevTools global settings, 2. @TestPropertySource, 3. Command line arguments (<code>--server.port=9090</code>), 4. OS environment variables (<code>SERVER_PORT=8080</code>), 5. Profile-specific files (<code>application-prod.yml</code>), 6. Default <code>application.yml</code>.`,
      ],
      callout: { kind: `insight`, text: 'Command-line arguments and OS environment variables always take precedence over packaged application.yml configuration files.' },
      metrics: { active_profile: 'prod', active_tier: 'Tier 3 (CLI / Env Var)', source_origin: 'OS Env: APP_TIMEOUT_MS', bound_class: 'AppProperties', validation_state: 'Valid' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'PropertySource Priority Order', [
            '1. Command line args: --server.port=9090 (Highest)',
            '2. OS Environment vars: SERVER_PORT=9090',
            '3. Config file profile: application-prod.yml',
            '4. Config file default: application.yml',
            '= 5. @PropertySource on @Configuration classes (Lowest)',
            '# Higher priority tier completely overrides lower tier values',
          ]),
          os_env: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'cloud', label: ['OS Env / CLI'], sub: 'Tier 3 (High Priority)' }),
          env_registry: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'storage', label: ['Standard', 'Env'], sub: 'PropertySources Registry' }),
          app_yml: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'code', label: ['app.yml'], sub: 'Tier 6 (Default Fallback)' }),
        },
        links: {
          oe: h('os_env', 'env_registry', ['os_env', 'env_registry'], { heads: 'end', label: 'overrides default' }),
          ay: h('app_yml', 'env_registry', ['app_yml', 'env_registry'], { heads: 'end', label: 'fallback value' }),
        },
        flows: [
          { route: ['oe'], bounce: false, rate: 2.2 },
          { route: ['ay'], bounce: false, rate: 1.0 },
        ],
      },
    },
    {
      short: `Type-Safe Config`,
      chapter: `technique`,
      title: `@ConfigurationProperties vs @Value`,
      body: [
        `Avoid <code>@Value("&#36;{app.timeout}")</code> in production: it lacks type safety, doesn't support structured hierarchies, and fails late at runtime.`,
        `<strong>@ConfigurationProperties(prefix = "app")</strong> binds entire configuration subtrees to type-safe Java Records or POJOs with JSR-380 validation (<code>@NotNull</code>, <code>@Min(100)</code>) at startup.`,
      ],
      callout: { kind: `insight`, text: 'Using Java Records with @ConfigurationProperties provides immutable, thread-safe configuration objects.' },
      metrics: { active_profile: 'prod', active_tier: 'ConfigurationPropertiesBindingPostProcessor', source_origin: 'app.yml', bound_class: 'AppProperties Record', validation_state: 'Validated @Min(100)' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Type-Safe @ConfigurationProperties', [
            '@ConfigurationProperties(prefix = "app.mail")',
            '@Validated',
            'public record MailProperties(',
            '= @NotBlank String host,',
            '= @Min(1) @Max(65535) int port,',
            '= Duration timeout',
            ') {} // Strong type checking + JSR-380 validation on boot',
          ]),
          yml_tree: d(-11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'storage', label: ['pool.*'], sub: 'Hierarchical YAML' }),
          binder: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'workflow', label: ['ConfigProps', 'Binder'], sub: 'Validation & Binding' }),
          record_pojo: d(11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['AppConfig (Record)'], sub: 'Immutable Type-Safe Bean' }),
        },
        links: {
          yb: h('yml_tree', 'binder', ['yml_tree', 'binder'], { heads: 'end', label: 'reads properties' }),
          br: h('binder', 'record_pojo', ['binder', 'record_pojo'], { heads: 'end', label: 'instantiates record' }),
        },
        flows: [
          { route: ['yb', 'br'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Relaxed Binding`,
      chapter: `technique`,
      title: `Relaxed Binding Engine`,
      body: [
        `Spring Boot uses <strong>Relaxed Binding</strong> to map environment variables, system properties, and YAML entries flexibly:`,
        `All of these map cleanly to the Java field <code>maxPoolSize</code>:`,
        `• <code>app.datasource.max-pool-size</code> (kebab-case, YAML recommended)<br/>• <code>app.datasource.maxPoolSize</code> (camelCase)<br/>• <code>APP_DATASOURCE_MAX_POOL_SIZE</code> (SCREAMING_SNAKE, OS env)`,
      ],
      callout: { kind: `insight`, text: 'Relaxed binding ensures Docker containers and Kubernetes Pods can override any YAML setting using standard OS environment variables.' },
      metrics: { active_profile: 'prod', active_tier: 'RelaxedDataBinder', source_origin: 'APP_DATASOURCE_MAX_POOL_SIZE', bound_class: 'DataSourceProperties', validation_state: 'Kebab/Snake mapped' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Relaxed Binding Engine', [
            '// All of these map to the exact same field "poolTimeout":',
            '= app.datasource.poolTimeout     // Standard camelCase',
            '= app.datasource.pool-timeout    // Kebab-case (recommended for YAML)',
            '= APP_DATASOURCE_POOLTIMEOUT    // OS Environment variable',
            '= APP_DATASOURCE_POOL_TIMEOUT   // Environment friendly underscore',
            '# Decouples YAML config naming from strict Java field names',
          ]),
          env_snake: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'cloud', label: ['APP_POOL_TIMEOUT'], sub: 'SCREAMING_SNAKE' }),
          relaxed_engine: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'cpu', label: ['RelaxedDataBinder'], sub: 'Normalizes to kebab/camel' }),
          target_prop: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'code', label: ['poolTimeout (Duration)'], sub: 'Mapped cleanly' }),
        },
        links: {
          er: h('env_snake', 'relaxed_engine', ['env_snake', 'relaxed_engine'], { heads: 'end', label: 'normalizes key' }),
          rt: h('relaxed_engine', 'target_prop', ['relaxed_engine', 'target_prop'], { heads: 'end', label: 'binds field' }),
        },
        flows: [
          { route: ['er', 'rt'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `Profiles`,
      chapter: `technique`,
      title: `Profile Activation & Conditional Components`,
      body: [
        `Profiles segregate environment-specific configurations: <code>dev</code>, <code>staging</code>, <code>prod</code>.`,
        `Active profiles are configured via <code>SPRING_PROFILES_ACTIVE=prod</code>. Beans can be conditionally enabled via <code>@Profile("prod")</code> (e.g. RealSmsSender vs MockSmsSender in dev).`,
      ],
      callout: { kind: `insight`, text: 'Profile groups allow grouping multiple profiles together (e.g. production: [prod-db, prod-metrics, prod-cloud]).' },
      metrics: { active_profile: 'prod (Activated)', active_tier: 'ProfileAwareEnvironment', source_origin: 'application-prod.yml', bound_class: 'RealPaymentGateway', validation_state: 'Active' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Profile Activation (@Profile)', [
            '# Run app with: java -jar app.jar -Dspring.profiles.active=prod',
            '@Configuration',
            '= @Profile("prod")',
            'public class ProdDataSourceConfig {',
            '= @Bean public DataSource hikari() { return new HikariDataSource(); }',
            '}',
            '@Profile("dev") -> loads H2 in-memory embedded DB instead',
          ]),
          profile_flag: d(-11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['PROFILES', 'ACTIVE'], sub: 'prod' }),
          profile_env: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'server', label: ['Profile Filter'], sub: 'Matches @Profile("prod")' }),
          prod_bean: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'code', label: ['AwsSqsClient Bean'], sub: 'MockSqsClient ignored' }),
        },
        links: {
          fp: h('profile_flag', 'profile_env', ['profile_flag', 'profile_env'], { heads: 'end', label: 'activates prod' }),
          pb: h('profile_env', 'prod_bean', ['profile_env', 'prod_bean'], { heads: 'end', label: 'registers bean' }),
        },
        flows: [
          { route: ['fp', 'pb'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Cloud Secrets`,
      chapter: `technique`,
      title: `Externalized Secrets & Vault Integration`,
      body: [
        `In production cloud deployments, passwords and API keys should never be committed to YAML files.`,
        `<strong>Spring Cloud Vault</strong> or Kubernetes ConfigMaps inject secrets as first-class <code>PropertySource</code> instances early in the bootstrap phase, decrypting values transparently before application beans boot.`,
      ],
      callout: { kind: `insight`, text: 'Secrets rotation is supported via @RefreshScope or Spring Cloud Bus, updating bean properties dynamically without restarting the JVM.' },
      metrics: { active_profile: 'prod', active_tier: 'VaultPropertySource (Tier 1)', source_origin: 'HashiCorp Vault / K8s Secret', bound_class: 'DatabaseCredentials', validation_state: 'Encrypted & Rotated' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Externalized Cloud Secrets (Vault)', [
            'spring.cloud.vault:',
            '= uri: https://vault.infra.internal:8200',
            '= token: vault_secret_token',
            '= kv.backend: secret',
            '# Spring Cloud Vault bootstraps before application context,',
            '# populates PropertySource with dynamic short-lived DB credentials',
          ]),
          vault_srv: d(-11, -4, { s: 3.8, h: 50, color: 'cyan', glyph: 'storage', label: ['HashiCorp Vault / K8s'], sub: 'Encrypted Secrets Store' }),
          bootstrap_env: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['VaultPropertySource'], sub: 'Decrypts during boot' }),
          live_bean: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['SecureDataSource'], sub: 'Credentials Injected' }),
        },
        links: {
          vb: h('vault_srv', 'bootstrap_env', ['vault_srv', 'bootstrap_env'], { heads: 'end', label: 'fetches secret' }),
          bl: h('bootstrap_env', 'live_bean', ['bootstrap_env', 'live_bean'], { heads: 'end', label: 'populates password' }),
        },
        flows: [
          { route: ['vb', 'bl'], bounce: true, rate: 1.8 },
        ],
      },
    },
  ],
};
