import { Headphones, ShieldCheck, Users } from 'lucide-react';

const roles = [
  {
    name: 'Администратор',
    id: 'demo-admin',
    access: 'Полный доступ к реестру, каналам, логам, документации и настройкам.',
    icon: ShieldCheck,
  },
  {
    name: 'Диспетчер',
    id: 'demo-dispatcher',
    access: 'Рабочее место оператора, реестр заявок, демо-стенд и справка.',
    icon: Headphones,
  },
];

export function UserManagementView() {
  return (
    <main className="w-full">
      <header className="border-b border-rule pb-6">
        <p className="section-kicker">Автономный доступ</p>
        <h1 className="mt-2 text-balance font-sans text-3xl font-bold tracking-tight md:text-4xl">Готовые роли стенда</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2">В автономной версии нет аккаунтов, паролей и базы пользователей. Роль выбирается на экране входа и сохраняется только в текущем браузере.</p>
      </header>

      <section className="mt-8 sheet overflow-hidden">
        <div className="flex items-center justify-between border-b border-rule p-5">
          <div className="flex items-center gap-3"><Users className="h-5 w-5 text-accent" aria-hidden="true" /><h2 className="text-2xl font-bold tracking-tight">Доступные профили</h2></div>
          <span className="font-mono text-xs text-ink-3">2 РОЛИ</span>
        </div>
        <div className="grid divide-y divide-rule md:grid-cols-2 md:divide-x md:divide-y-0">
          {roles.map(({ name, id, access, icon: Icon }) => (
            <article key={id} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center border border-rule bg-panel-2 text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-5 text-xl font-bold text-ink">{name}</h3>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-3">{id}</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">{access}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
