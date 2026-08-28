import { ArrowRight, Headphones, ShieldCheck } from 'lucide-react';
import type { DemoRole } from '../demoSession';

interface SignInViewProps {
  onSelectRole: (role: DemoRole) => void;
}

const roles = [
  {
    role: 'admin' as const,
    title: 'Администратор',
    description: 'Полный доступ к реестру, документации, журналам и настройкам стенда.',
    icon: ShieldCheck,
  },
  {
    role: 'dispatcher' as const,
    title: 'Диспетчер',
    description: 'Рабочее место оператора: разбор, проверка и обработка обращений.',
    icon: Headphones,
  },
];

export function SignInView({ onSelectRole }: SignInViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-5 font-sans text-ink sm:p-8">
      <section className="w-full max-w-4xl overflow-hidden rounded-xl border border-rule bg-panel lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-rule bg-auth-surface p-6 text-auth-foreground lg:border-b-0 lg:border-r lg:p-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-on-accent">T2</span>
          <p className="mt-8 font-mono text-sm uppercase tracking-[0.08em] text-accent">Автономный стенд</p>
          <h1 className="mt-3 text-balance text-2xl font-bold leading-tight">Доступ к диспетчерской</h1>
          <p className="mt-4 text-sm leading-relaxed text-auth-foreground/85">Выберите готовую роль. База данных, регистрация и пароль для запуска не требуются.</p>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-3">Демонстрационный режим</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Кем вы хотите войти?</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">Выбор сохранится в этом браузере. Рабочие данные сбрасываются после перезагрузки.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {roles.map(({ role, title, description, icon: Icon }) => (
              <button key={role} type="button" onClick={() => onSelectRole(role)} className="group flex min-h-52 flex-col items-start justify-between border border-rule bg-panel-2 p-5 text-left transition-colors hover:border-accent hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <span className="flex h-11 w-11 items-center justify-center border border-rule bg-panel text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-8">
                  <strong className="block text-xl text-ink">{title}</strong>
                  <span className="mt-2 block text-sm leading-relaxed text-ink-2">{description}</span>
                </span>
                <span className="mt-5 flex w-full items-center justify-between border-t border-rule pt-4 text-sm font-semibold text-accent">Войти <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
