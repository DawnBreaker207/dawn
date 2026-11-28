import { QUIZ_QUESTIONS, type QuizDeck, type QuizQuestion } from '@/data/quiz-questions';

type DeckChoice = QuizDeck | 'mixed';
type Phase = 'menu' | 'playing' | 'answered' | 'done';

interface RoundQuestion {
  question: QuizQuestion;
  choices: string[];
  correct: number;
}

const ROUND_SIZE = 10;
const BEST_KEY = 'dawn_quiz_best_v1';

let controller: AbortController | null = null;

function stopLab(): void {
  controller?.abort();
  controller = null;
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function readBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') return parsed as Record<string, number>; // only this page writes the key
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return {};
}

function writeBest(best: Record<string, number>): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    /* private mode: the best score just is not kept */
  }
}

function gradeFor(score: number, total: number): string {
  const ratio = score / total;
  if (ratio === 1) return 'Flawless';
  if (ratio >= 0.8) return 'Sharp';
  if (ratio >= 0.6) return 'Solid';
  return 'Keep practicing';
}

function initQuizLab(): void {
  stopLab();

  const root = document.getElementById('quiz-root');
  const menu = document.getElementById('quiz-menu');
  const play = document.getElementById('quiz-play');
  const done = document.getElementById('quiz-done');
  const progressEl = document.getElementById('quiz-progress');
  const scoreEl = document.getElementById('quiz-score');
  const streakEl = document.getElementById('quiz-streak');
  const barEl = document.getElementById('quiz-bar');
  const promptEl = document.getElementById('quiz-prompt');
  const choicesEl = document.getElementById('quiz-choices');
  const whyEl = document.getElementById('quiz-why');
  const nextBtn = document.getElementById('quiz-next');
  const gradeEl = document.getElementById('quiz-grade');
  const finalEl = document.getElementById('quiz-final');
  const finalNoteEl = document.getElementById('quiz-final-note');
  if (!root || !menu || !play || !done || !progressEl || !scoreEl || !streakEl || !barEl || !promptEl || !choicesEl || !whyEl || !nextBtn || !gradeEl || !finalEl || !finalNoteEl) {
    return;
  }

  controller = new AbortController();
  const { signal } = controller;

  let phase: Phase = 'menu';
  let deck: DeckChoice = 'http';
  let round: RoundQuestion[] = [];
  let index = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;

  const setPhase = (next: Phase): void => {
    phase = next;
    root.dataset.state = next;
    menu.classList.toggle('hidden', next !== 'menu');
    play.classList.toggle('hidden', next !== 'playing' && next !== 'answered');
    done.classList.toggle('hidden', next !== 'done');
  };

  const renderBest = (): void => {
    const best = readBest();
    root.querySelectorAll<HTMLElement>('[data-quiz-best]').forEach((el) => {
      const value = best[el.dataset.quizBest ?? ''];
      el.textContent = value === undefined ? '-' : `${value} / ${ROUND_SIZE}`;
    });
  };

  const renderQuestion = (): void => {
    const item = round[index];
    progressEl.textContent = `Question ${index + 1} / ${round.length}`;
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    barEl.style.width = `${(index / round.length) * 100}%`;
    promptEl.textContent = item.question.prompt;
    whyEl.classList.add('hidden');
    nextBtn.classList.add('hidden');
    choicesEl.textContent = '';
    item.choices.forEach((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-choice';
      button.dataset.choice = String(i);
      button.dataset.trackEvent = 'quiz-answer';
      const key = document.createElement('kbd');
      key.textContent = String(i + 1);
      const label = document.createElement('span');
      label.textContent = text;
      if (item.question.deck === 'git') label.className = 'font-mono text-sm sm:text-base';
      else label.className = 'text-base';
      button.append(key, label);
      choicesEl.append(button);
    });
    setPhase('playing');
  };

  const startRound = (chosen: DeckChoice): void => {
    deck = chosen;
    const pool = QUIZ_QUESTIONS.filter((q) => chosen === 'mixed' || q.deck === chosen);
    round = shuffle(pool)
      .slice(0, ROUND_SIZE)
      .map((question) => {
        const choices = shuffle(question.choices);
        return { question, choices, correct: choices.indexOf(question.choices[0]) };
      });
    index = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    renderQuestion();
  };

  const answer = (picked: number): void => {
    if (phase !== 'playing') return;
    const item = round[index];
    const right = picked === item.correct;
    if (right) {
      score++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
    choicesEl.querySelectorAll<HTMLButtonElement>('.quiz-choice').forEach((button, i) => {
      button.disabled = true;
      if (i === item.correct) button.classList.add('is-correct');
      else if (i === picked) button.classList.add('is-wrong');
      else button.classList.add('is-dim');
    });
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    whyEl.textContent = `${right ? 'Correct. ' : 'Not quite. '}${item.question.why}`;
    whyEl.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    nextBtn.textContent = index + 1 === round.length ? 'See results ' : 'Next ';
    const hint = document.createElement('span');
    hint.className = 'opacity-80';
    hint.textContent = 'Enter';
    nextBtn.append(hint);
    root.dataset.score = String(score);
    setPhase('answered');
  };

  const finish = (): void => {
    barEl.style.width = '100%';
    const best = readBest();
    const previous = best[deck] ?? -1;
    const record = score > previous;
    if (record) {
      best[deck] = score;
      writeBest(best);
    }
    gradeEl.textContent = gradeFor(score, round.length);
    finalEl.textContent = `${score} / ${round.length}`;
    finalNoteEl.textContent = `Longest streak: ${bestStreak}.${record ? ' New best for this deck!' : previous >= 0 ? ` Your best here is ${Math.max(previous, score)}.` : ''}`;
    root.dataset.score = String(score);
    renderBest();
    setPhase('done');
    window.umami?.track('quiz-finish', { deck, score, total: round.length });
  };

  const next = (): void => {
    if (phase !== 'answered') return;
    if (index + 1 >= round.length) {
      finish();
      return;
    }
    index++;
    renderQuestion();
  };

  menu.querySelectorAll<HTMLButtonElement>('[data-quiz-deck]').forEach((button) =>
    button.addEventListener('click', () => startRound((button.dataset.quizDeck ?? 'http') as DeckChoice), { signal }), // ids come from MENU in quiz.astro
  );

  choicesEl.addEventListener(
    'click',
    (e) => {
      const button = (e.target as Element).closest<HTMLButtonElement>('[data-choice]'); // delegated: only answer buttons carry data-choice
      if (button) answer(Number(button.dataset.choice));
    },
    { signal },
  );

  nextBtn.addEventListener('click', next, { signal });
  document.getElementById('quiz-again')?.addEventListener('click', () => startRound(deck), { signal });
  document.getElementById('quiz-menu-btn')?.addEventListener(
    'click',
    () => {
      renderBest();
      setPhase('menu');
    },
    { signal },
  );

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (phase === 'playing' && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        answer(Number(e.key) - 1);
      } else if (phase === 'answered' && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next();
      }
    },
    { signal },
  );

  renderBest();
  setPhase('menu');
}

initQuizLab();
document.addEventListener('astro:page-load', initQuizLab);
document.addEventListener('astro:before-swap', stopLab);
