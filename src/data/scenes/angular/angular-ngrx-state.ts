import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const angularNgrxStateLesson = {
  id: 'angular-ngrx-state',
  title: 'NgRx Store vs SignalStore',
  summary: 'Master enterprise Angular state management with NgRx: unidirectional Redux data flow (Action -> Reducer -> Store -> Memoized Selector), RxJS Effects for async side-effects, and modern @ngrx/signals SignalStore with rxMethod.',
  minutes: 30,
  level: 'advanced',
  metrics: ['ngrxModel', 'stateMutation', 'asyncSideEffect', 'boilerplate'],
  legend: ['flow', ['redux', 'action / reducer flow'], ['effect', 'async effect / API'], ['signal', 'SignalStore reactive']],
  goals: [
    { text: 'Unidirectional Data Flow: Action dispatch -> Pure Reducer -> Immutable Store', step: 1 },
    { text: 'Memoized Selectors (createSelector) for derived state caching', step: 2 },
    { text: 'NgRx Effects (createEffect) isolating HTTP calls with switchMap/exhaustMap', step: 3 },
    { text: 'Classic Store boilerplate vs @ngrx/signals SignalStore', step: 4 },
    { text: 'SignalStore composition: withState, withComputed, withMethods & patchState()', step: 5 },
    { text: 'rxMethod() Hybrid Bridge & Redux DevTools time-travel debugging', step: 6 },
  ],
  steps: [
    {
      short: 'Redux Loop',
      chapter: 'concept',
      title: 'Unidirectional Data Flow: Action -> Reducer -> Store',
      body: [
        'Classic <b>NgRx Store</b> enforces strict unidirectional data flow: Components never mutate state directly—they <code>dispatch(Action)</code>.',
        'A pure <b>Reducer</b> (<code>on(action, (state, payload) =&gt; ({ ...state, ... }))</code>) computes a brand-new immutable state object and saves it into the single source of truth <b>Store</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pure reducers + immutable state make every state transition deterministic, traceable, and time-travel debuggable.',
      },
      metrics: { ngrxModel: 'Classic Store', stateMutation: 'Immutable Reducer', asyncSideEffect: 'Pending', boilerplate: 'High (4 files)' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'dispatch()', tone: 'blue', icon: 'zap' }] }),
          actionBus: makeBlock(-4, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Action'], sub: 'dispatch()' }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Reducer + Store'], sub: 'pure reducer' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Action & Pure Reducer', [
            `export const loadOrders = createAction('[Orders] Load');`,
            `export const ordersReducer = createReducer(initialState,`,
            `  on(loadOrders, state => ({ ...state, loading: true }))`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          ca: makeLink('componentUi', 'actionBus', ['componentUi', 'actionBus'], { label: 'dispatch(action)' }),
          ar: makeLink('actionBus', 'reducerStore', ['actionBus', 'reducerStore'], { label: 'pure transition' }),
        },
        flows: [{ route: ['ca', 'ar'], kind: 'redux', rate: 1.5 }],
      },
    },
    {
      short: 'Selectors',
      chapter: 'concept',
      title: 'Memoized Selectors (createSelector)',
      body: [
        'Components read state via <code>store.select(selectActiveOrders)</code> (or <code>selectSignal()</code>).',
        '<code>createSelector</code> memoizes inputs: if the <code>orders</code> slice didn’t change reference (<code>===</code>), the expensive filter/reduce logic is skipped and the cached result is returned in <code>O(1)</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Compose small feature selectors into derived selectors so components never compute raw filtering in templates.',
      },
      changes: ['+ Memoized createSelector caches derived slices', '+ Unidirectional Store -> Selector -> Component loop closed'],
      metrics: { ngrxModel: 'Classic Store', stateMutation: 'Memoized ===', asyncSideEffect: 'None', boilerplate: 'High' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'selectSignal()', tone: 'green', icon: 'zap' }] }),
          actionBus: makeBlock(-4, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Action'], sub: 'dispatch()' }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Reducer + Store'], sub: 'pure reducer' }),
          selectorOut: makeBlock(-4, 10, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['createSelector'], sub: 'createSelector' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Memoized Selector', [
            `export const selectActiveOrders = createSelector(`,
            `  selectAllOrders,`,
            `  (orders) => orders.filter(o => o.status === 'active')`,
            `); // Cached until selectAllOrders reference changes!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ca: makeLink('componentUi', 'actionBus', ['componentUi', 'actionBus'], { label: 'dispatch(action)' }),
          ar: makeLink('actionBus', 'reducerStore', ['actionBus', 'reducerStore'], { label: 'new state' }),
          rs: makeLink('reducerStore', 'selectorOut', ['reducerStore', 'selectorOut'], { label: 'memoize ===' }),
          sc: makeLink('selectorOut', 'componentUi', ['selectorOut', 'componentUi'], { label: 'emit slice' }),
        },
        flows: [{ route: ['ca', 'ar', 'rs', 'sc'], kind: 'redux', rate: 1.5 }],
      },
    },
    {
      short: 'NgRx Effects',
      chapter: 'execution',
      title: 'NgRx Effects: Isolating Async HTTP & RxJS',
      body: [
        'Reducers must stay 100% pure—no HTTP calls allowed. <b>NgRx Effects</b> listen to <code>actions$</code> via <code>ofType(loadOrders)</code>, run RxJS flattening (<code>switchMap</code> / <code>exhaustMap</code> + <code>catchError</code>), and dispatch <code>loadOrdersSuccess</code> or <code>loadOrdersFailure</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Effects completely decouple Components from HTTP/API orchestration, keeping UI components thin and testable.',
      },
      changes: ['+ createEffect intercepts actions$ and calls Backend API', '+ Success/Failure actions fed back into Store loop'],
      metrics: { ngrxModel: 'Store + Effects', stateMutation: 'Pure + Async', asyncSideEffect: 'createEffect()', boilerplate: 'High' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'selectSignal()', tone: 'green', icon: 'zap' }] }),
          actionBus: makeBlock(-4, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Actions$'], sub: 'ofType()' }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Reducer + Store'], sub: 'pure reducer' }),
          effectsApi: makeBlock(10, 10, { s: 4.8, h: 52, color: 'amber', glyph: 'server', label: ['Effects + API'], sub: 'createEffect' }),
          selectorOut: makeBlock(-4, 10, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['createSelector'], sub: 'createSelector' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'NgRx Effect with switchMap', [
            `loadOrders$ = createEffect(() => this.actions$.pipe(`,
            `  ofType(loadOrders),`,
            `  switchMap(() => this.api.getOrders().pipe(`,
            `    map(orders => loadOrdersSuccess({ orders })),`,
            `    catchError(err => of(loadOrdersFailure({ err })))`,
            `  ))`,
            `));`,
          ], { icon: 'terminal' }),
        },
        links: {
          ca: makeLink('componentUi', 'actionBus', ['componentUi', 'actionBus'], { label: 'dispatch(load)' }),
          ar: makeLink('actionBus', 'reducerStore', ['actionBus', 'reducerStore'], { label: 'loading: true' }),
          re: makeLink('reducerStore', 'effectsApi', ['reducerStore', 'effectsApi'], { label: 'switchMap API' }),
          es: makeLink('effectsApi', 'selectorOut', ['effectsApi', 'selectorOut'], { label: 'success -> store' }),
          sc: makeLink('selectorOut', 'componentUi', ['selectorOut', 'componentUi'], { label: 'update UI' }),
        },
        flows: [
          { route: ['ca', 'ar'], kind: 'redux', rate: 1.4 },
          { route: ['re', 'es', 'sc'], kind: 'effect', rate: 1.5 },
        ],
      },
    },
    {
      short: 'SignalStore Shift',
      chapter: 'technique',
      title: 'Classic Store Boilerplate vs @ngrx/signals SignalStore',
      body: [
        'Classic NgRx requires 4 separate files per feature (<code>actions</code>, <code>reducer</code>, <code>selectors</code>, <code>effects</code>).',
        'Modern <b>NgRx SignalStore</b> (<code>@ngrx/signals</code>) replaces that ceremony with a single composable <code>signalStore(...)</code> function built natively on Angular Signals and tree-shakable functional features!',
      ],
      callout: {
        kind: 'tip',
        text: 'SignalStore cuts Redux boilerplate by ~75% while preserving strict immutability and reactive derivations.',
      },
      changes: ['+ 4 Redux files replaced by 1 composable signalStore()', '+ Native Signal properties exposed directly to templates'],
      metrics: { ngrxModel: 'SignalStore', stateMutation: 'patchState()', asyncSideEffect: 'withMethods', boilerplate: 'Minimal (-75%)' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'inject(Store)', tone: 'green', icon: 'zap' }] }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['SignalStore'], sub: 'signalStore' }),
          selectorOut: makeBlock(-4, 10, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['withComputed'], sub: 'withComputed' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'NgRx SignalStore Definition', [
            `export const OrdersStore = signalStore(`,
            `  { providedIn: 'root' },`,
            `  withState({ orders: [] as Order[], loading: false }),`,
            `  withComputed(({ orders }) => ({`,
            `    count: computed(() => orders().length)`,
            `  }))`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          rs: makeLink('reducerStore', 'selectorOut', ['reducerStore', 'selectorOut'], { label: 'signal DAG' }),
          sc: makeLink('selectorOut', 'componentUi', ['selectorOut', 'componentUi'], { label: 'read store.count()' }),
        },
        flows: [{ route: ['rs', 'sc'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'withMethods & patch',
      chapter: 'execution',
      title: 'withState, withComputed, withMethods & patchState()',
      body: [
        '<code>withState</code> turns every state property into a fine-grained <code>DeepSignal</code>. <code>withComputed</code> derives glitch-free <code>computed()</code> values.',
        '<code>withMethods</code> defines actions that update state cleanly via immutable <code>patchState(store, { loading: true })</code>—zero action-type strings or switch-case reducers.',
      ],
      callout: {
        kind: 'insight',
        text: 'DeepSignal tracks nested properties independently so updating store.loading() never triggers views only reading store.orders().',
      },
      changes: ['+ withMethods + patchState() update DeepSignals cleanly', '+ Zero Action strings or Reducer switch boilerplate'],
      metrics: { ngrxModel: 'SignalStore', stateMutation: 'patchState()', asyncSideEffect: 'withMethods', boilerplate: '1 File' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'store.add()', tone: 'blue', icon: 'zap' }] }),
          actionBus: makeBlock(-4, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['withMethods'], sub: 'patchState()' }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['SignalStore'], sub: 'signalStore' }),
          selectorOut: makeBlock(-4, 10, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['withComputed'], sub: 'withComputed' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'withMethods & patchState', [
            `withMethods((store, api = inject(OrdersApi)) => ({`,
            `  async loadAll() {`,
            `    patchState(store, { loading: true });`,
            `    const orders = await firstValueFrom(api.fetch());`,
            `    patchState(store, { orders, loading: false });`,
            `  }`,
            `}))`,
          ], { icon: 'terminal' }),
        },
        links: {
          ca: makeLink('componentUi', 'actionBus', ['componentUi', 'actionBus'], { label: 'call method' }),
          ar: makeLink('actionBus', 'reducerStore', ['actionBus', 'reducerStore'], { label: 'patchState()' }),
          rs: makeLink('reducerStore', 'selectorOut', ['reducerStore', 'selectorOut'], { label: 'notify computed' }),
          sc: makeLink('selectorOut', 'componentUi', ['selectorOut', 'componentUi'], { label: 'Zoneless DOM' }),
        },
        flows: [{ route: ['ca', 'ar', 'rs', 'sc'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'rxMethod & DevTools',
      chapter: 'scaling',
      title: 'rxMethod() Hybrid Bridge & DevTools Time-Travel',
      body: [
        'Need RxJS <code>debounceTime</code> + <code>switchMap</code> inside SignalStore? Use <code>rxMethod&lt;string&gt;(pipe(debounceTime(300), switchMap(...), tapResponse(...)))</code>—auto-cleaned on store destroy!',
        '<b>Rule of thumb:</b> Use <b>SignalStore</b> for modern feature/app state; use <b>Classic Store + Effects</b> when global Redux DevTools time-travel & cross-team event sourcing are mandatory.',
      ],
      callout: {
        kind: 'insight',
        text: 'rxMethod() gives you the best of both worlds: RxJS async cancellation + SignalStore simplicity!',
      },
      changes: ['+ rxMethod connects RxJS switchMap directly to SignalStore', '+ Enterprise State Architecture complete'],
      metrics: { ngrxModel: 'Hybrid NgRx', stateMutation: 'patchState()', asyncSideEffect: 'rxMethod()', boilerplate: 'Optimal' },
      scene: {
        entities: {
          componentUi: makeDevice(-18, 0, { label: 'Component', tags: [{ text: 'search(query)', tone: 'purple', icon: 'zap' }] }),
          actionBus: makeBlock(-4, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['rxMethod()'], sub: 'rxMethod()' }),
          reducerStore: makeDb(10, -10, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['SignalStore'], sub: 'signalStore' }),
          effectsApi: makeBlock(10, 10, { s: 4.8, h: 52, color: 'amber', glyph: 'server', label: ['RxJS + API'], sub: 'withMethods' }),
          selectorOut: makeBlock(-4, 10, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['withComputed'], sub: 'withComputed' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'rxMethod() in SignalStore', [
            `search: rxMethod<string>(pipe(`,
            `  debounceTime(300), distinctUntilChanged(),`,
            `  switchMap(q => api.search(q).pipe(`,
            `    tapResponse({ next: orders => patchState(store, { orders }), error: ... })`,
            `  ))`,
            `))`,
          ], { icon: 'terminal' }),
        },
        links: {
          ca: makeLink('componentUi', 'actionBus', ['componentUi', 'actionBus'], { label: 'pass signal/val' }),
          ar: makeLink('actionBus', 'reducerStore', ['actionBus', 'reducerStore'], { label: 'loading: true' }),
          re: makeLink('reducerStore', 'effectsApi', ['reducerStore', 'effectsApi'], { label: 'switchMap API' }),
          es: makeLink('effectsApi', 'selectorOut', ['effectsApi', 'selectorOut'], { label: 'patchState()' }),
          sc: makeLink('selectorOut', 'componentUi', ['selectorOut', 'componentUi'], { label: '60fps Signal' }),
        },
        flows: [
          { route: ['ca', 'ar'], kind: 'signal', rate: 1.5 },
          { route: ['re', 'es', 'sc'], kind: 'effect', rate: 1.5 },
        ],
      },
    },
  ],
};
