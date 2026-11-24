// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularReactiveFormsLesson = {
  id: 'angular-reactive-forms',
  title: 'Typed Reactive Forms, Validators & ControlValueAccessor',
  summary: 'Master enterprise Angular forms: strictly Typed Reactive Forms (NonNullableFormBuilder, FormGroup, FormArray), Sync & Async Validators with RxJS debouncing, valueChanges/statusChanges streams, and ControlValueAccessor (CVA) for reusable custom form controls.',
  minutes: 30,
  level: 'intermediate',
  metrics: ['formValidity', 'typeSafety', 'asyncValidation', 'cvaBinding'],
  legend: ['flow', ['input', 'UI -> FormControl'], ['validate', 'sync/async validation'], ['cva', 'ControlValueAccessor bridge']],
  goals: [
    { text: 'Typed Reactive Forms: FormControl, FormGroup & NonNullableFormBuilder', step: 1 },
    { text: 'Dynamic FormArray: adding, removing & validating list controls', step: 2 },
    { text: 'Sync & Async Validators: cross-field & RxJS API validation', step: 3 },
    { text: 'Reactive valueChanges & statusChanges streams with debounceTime', step: 4 },
    { text: 'ControlValueAccessor (NG_VALUE_ACCESSOR): custom reusable UI controls', step: 5 },
    { text: 'Forms + Signals Interop: toSignal(form.valueChanges) & Zoneless', step: 6 },
  ],
  steps: [
    {
      short: 'Typed FormGroup',
      chapter: 'concept',
      title: '1. Strictly Typed FormControl & NonNullableFormBuilder',
      body: [
        'Unlike template-driven forms, Angular <b>Reactive Forms</b> keep the form model explicit, immutable, and synchronous in TypeScript.',
        'With <code>NonNullableFormBuilder</code> (<code>inject(NonNullableFormBuilder)</code>), <code>form.getRawValue()</code> is 100% strictly typed and <code>form.reset()</code> restores initial values instead of resetting to <code>null</code>!',
      ],
      callout: {
        kind: 'insight',
        text: 'Typed Reactive Forms catch mismatched field names and wrong types at compile time instead of runtime.',
      },
      metrics: { formValidity: 'INVALID (Init)', typeSafety: '100% Strict', asyncValidation: 'Idle', cvaBinding: 'Native' },
      scene: {
        entities: {
          uiInput: y(-16, -6, { label: 'Form UI', tags: [{ text: 'formGroup', tone: 'blue', icon: 'zap' }] }),
          formGroup: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['FormGroup'], sub: 'typed tree' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'NonNullableFormBuilder', [
            `private fb = inject(NonNullableFormBuilder);`,
            `form = this.fb.group({`,
            `  email: ['', [Validators.required, Validators.email]],`,
            `  age: [18, [Validators.min(18)]]`,
            `});`,
            `// form.getRawValue() -> { email: string; age: number }`,
          ], { icon: 'terminal' }),
        },
        links: {
          uf: h('uiInput', 'formGroup', ['uiInput', 'formGroup'], { label: 'bind [formGroup]' }),
        },
        flows: [{ route: ['uf'], kind: 'input', rate: 1.5 }],
      },
    },
    {
      short: 'FormArray',
      chapter: 'setup',
      title: '2. Dynamic FormArray: Variable-Length Lists',
      body: [
        'Need dynamic invoice rows, phone numbers, or survey questions? Use <code>FormArray&lt;FormGroup&lt;...&gt;&gt;</code>.',
        'Calling <code>items.push(createRow())</code> or <code>items.removeAt(i)</code> updates the parent <code>FormGroup</code> validity automatically—combined with <code>@for (ctrl of items.controls; track ctrl)</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Track @for loops over FormArray by the FormGroup instance itself (track ctrl) so input focus is never lost!',
      },
      changes: ['+ FormArray dynamically manages nested FormGroup rows', '+ Parent validity aggregates all child row states'],
      metrics: { formValidity: 'Aggregated', typeSafety: 'Typed Array', asyncValidation: 'Idle', cvaBinding: 'Native' },
      scene: {
        entities: {
          uiInput: y(-16, -6, { label: 'Form UI', tags: [{ text: 'Add / Remove', tone: 'blue', icon: 'zap' }] }),
          formGroup: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['FormGroup'], sub: 'typed tree' }),
          formArray: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['FormArray'], sub: 'dynamic rows' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Dynamic FormArray', [
            `items = this.fb.array([this.createItem()]);`,
            `addItem() { this.items.push(this.createItem()); }`,
            `removeItem(i: number) { this.items.removeAt(i); }`,
          ], { icon: 'terminal' }),
        },
        links: {
          uf: h('uiInput', 'formGroup', ['uiInput', 'formGroup'], { label: 'bind [formGroup]' }),
          fa: h('formGroup', 'formArray', ['formGroup', 'formArray'], { label: 'manage rows' }),
        },
        flows: [{ route: ['uf', 'fa'], kind: 'input', rate: 1.5 }],
      },
    },
    {
      short: 'Sync & Async Valid',
      chapter: 'execution',
      title: '3. Sync Cross-Field & Async RxJS Validators',
      body: [
        'Angular runs <b>Sync Validators</b> first (e.g. cross-field <code>password === confirmPassword</code> at the <code>FormGroup</code> level).',
        'Only when all sync validators pass does Angular run <b>Async Validators</b> (<code>AsyncValidatorFn</code>)—setting status to <code>PENDING</code> while querying the Backend API via RxJS <code>timer(300) + switchMap</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Sync validators run before Async validators so invalid emails never waste a Backend API check!',
      },
      changes: ['+ Sync validators pass -> AsyncValidatorFn runs', '+ Form status transitions PENDING -> VALID / INVALID'],
      metrics: { formValidity: 'PENDING -> VALID', typeSafety: 'Strict', asyncValidation: 'Active (API)', cvaBinding: 'Native' },
      scene: {
        entities: {
          formGroup: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Sync Valid'], sub: 'runs 1st' }),
          asyncValid: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['AsyncValidator'], sub: 'switchMap API' }),
          apiServer: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Check Email API'], sub: '200 OK unique' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'AsyncValidatorFn with RxJS', [
            `uniqueEmail(api: UserApi): AsyncValidatorFn {`,
            `  return (ctrl) => timer(300).pipe(`,
            `    switchMap(() => api.checkEmail(ctrl.value)),`,
            `    map(taken => (taken ? { emailTaken: true } : null))`,
            `  );`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          fv: h('formGroup', 'asyncValid', ['formGroup', 'asyncValid'], { label: 'sync passed' }),
          va: h('asyncValid', 'apiServer', ['asyncValid', 'apiServer'], { label: 'verify unique' }),
        },
        flows: [{ route: ['fv', 'va'], kind: 'validate', rate: 1.5 }],
      },
    },
    {
      short: 'valueChanges$',
      chapter: 'execution',
      title: '4. valueChanges & statusChanges Reactive Streams',
      body: [
        'Every <code>FormControl</code> and <code>FormGroup</code> exposes <code>valueChanges</code>, <code>statusChanges</code>, and unified <code>events</code> Observables.',
        'Pipe them directly through RxJS (<code>debounceTime(300)</code>, <code>distinctUntilChanged()</code>, <code>switchMap()</code>) for auto-save drafts or live search filters.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use { emitEvent: false } in patchValue(val, { emitEvent: false }) when syncing programmatically to avoid infinite valueChanges loops!',
      },
      changes: ['+ valueChanges stream piped through RxJS debounceTime', '+ Auto-save triggered cleanly without loops'],
      metrics: { formValidity: 'VALID', typeSafety: 'Strict', asyncValidation: 'Debounced', cvaBinding: 'Streamed' },
      scene: {
        entities: {
          uiInput: y(-16, -6, { label: 'User Input', tags: [{ text: 'valueChanges$', tone: 'cyan', icon: 'zap' }] }),
          valStream: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['RxJS .pipe()'], sub: 'valueChanges' }),
          apiServer: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Auto-Save API'], sub: 'debounced' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Reactive valueChanges Stream', [
            `this.form.valueChanges.pipe(`,
            `  debounceTime(400),`,
            `  distinctUntilChanged(),`,
            `  switchMap(val => this.api.saveDraft(val)),`,
            `  takeUntilDestroyed()`,
            `).subscribe();`,
          ], { icon: 'terminal' }),
        },
        links: {
          uv: h('uiInput', 'valStream', ['uiInput', 'valStream'], { label: 'emit changes' }),
          sa: h('valStream', 'apiServer', ['valStream', 'apiServer'], { label: 'auto-save' }),
        },
        flows: [{ route: ['uv', 'sa'], kind: 'validate', rate: 1.5 }],
      },
    },
    {
      short: 'ControlValueAccessor',
      chapter: 'technique',
      title: '5. ControlValueAccessor (CVA): Custom Reusable Controls',
      body: [
        'How do custom components (StarRating, DatePicker, TagInput) plug seamlessly into <code>formControlName</code>? Implement <b><code>ControlValueAccessor</code></b> and provide <code>NG_VALUE_ACCESSOR</code>!',
        '• <b><code>writeValue(v)</code></b>: Form model writes to your UI.<br>' +
        '• <b><code>registerOnChange(fn)</code> / <code>registerOnTouched(fn)</code></b>: Your UI notifies Angular Forms.<br>' +
        '• <b><code>setDisabledState(isDisabled)</code></b>: Syncs disabled state.',
      ],
      callout: {
        kind: 'insight',
        text: 'ControlValueAccessor decouples custom UI widgets from Angular Forms—making them work with both Reactive and Template forms!',
      },
      changes: ['+ NG_VALUE_ACCESSOR registered via forwardRef', '+ Two-way model <-> custom UI bridge established'],
      metrics: { formValidity: 'VALID', typeSafety: 'Strict', asyncValidation: 'Clean', cvaBinding: 'NG_VALUE_ACCESSOR' },
      scene: {
        entities: {
          uiInput: y(-16, -6, { label: 'Custom Rating', tags: [{ text: 'formControlName', tone: 'purple', icon: 'zap' }] }),
          cvaBridge: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['CVA Bridge'], sub: 'NG_VALUE_ACC' }),
          formGroup: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['FormControl'], sub: 'synced state' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ControlValueAccessor Interface', [
            `providers: [{`,
            `  provide: NG_VALUE_ACCESSOR,`,
            `  useExisting: forwardRef(() => RatingComponent),`,
            `  multi: true`,
            `}]`,
            `// writeValue(v), registerOnChange(fn), registerOnTouched(fn)`,
          ], { icon: 'terminal' }),
        },
        links: {
          uc: h('uiInput', 'cvaBridge', ['uiInput', 'cvaBridge'], { label: 'onChange(val)' }),
          cf: h('cvaBridge', 'formGroup', ['cvaBridge', 'formGroup'], { label: 'writeValue()' }),
        },
        flows: [{ route: ['uc', 'cf'], kind: 'cva', rate: 1.5 }],
      },
    },
    {
      short: 'Forms + Signals',
      chapter: 'scaling',
      title: '6. Reactive Forms + Signals & Zoneless Interop',
      body: [
        'Bridge any Reactive Form into Angular’s Signals DAG and Zoneless rendering via <code>toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() })</code>.',
        'Now derived totals, summaries, and submit-button disabled states update via <code>computed()</code> with zero manual subscriptions and O(1) Zoneless efficiency!',
      ],
      callout: {
        kind: 'tip',
        text: 'Always pass { initialValue: form.getRawValue() } to toSignal() so the signal is never undefined on first render.',
      },
      changes: ['+ Form valueChanges bridged into Signals DAG via toSignal()', '+ Zoneless UI derives totals via computed()'],
      metrics: { formValidity: 'VALID', typeSafety: 'Strict', asyncValidation: 'Clean', cvaBinding: 'Signals + CVA' },
      scene: {
        entities: {
          cvaBridge: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['FormGroup'], sub: 'valueChanges' }),
          formSignal: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['toSignal()'], sub: 'toSignal()' }),
          domView: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['computed() UI'], sub: '60fps Zoneless' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Forms + Signals Bridge', [
            `formValue = toSignal(this.form.valueChanges, {`,
            `  initialValue: this.form.getRawValue()`,
            `});`,
            `totalPrice = computed(() =>`,
            `  this.formValue().items.reduce((s, i) => s + i.price, 0)`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          cs: h('cvaBridge', 'formSignal', ['cvaBridge', 'formSignal'], { label: 'bridge stream' }),
          sd: h('formSignal', 'domView', ['formSignal', 'domView'], { label: 'computed() DOM' }),
        },
        flows: [{ route: ['cs', 'sd'], kind: 'cva', rate: 1.6 }],
      },
    },
  ],
};
