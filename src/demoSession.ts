export type DemoRole = 'admin' | 'dispatcher';

export interface DemoUser {
  id: string;
  name: string;
  role: DemoRole;
}

const ROLE_STORAGE_KEY = 'text2business-demo-role';

export const DEMO_USERS: Record<DemoRole, DemoUser> = {
  admin: { id: 'demo-admin', name: 'Администратор', role: 'admin' },
  dispatcher: { id: 'demo-dispatcher', name: 'Диспетчер', role: 'dispatcher' },
};

export function readDemoUser(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const role = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return role === 'admin' || role === 'dispatcher' ? DEMO_USERS[role] : null;
  } catch {
    return null;
  }
}

export function saveDemoRole(role: DemoRole): DemoUser {
  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  return DEMO_USERS[role];
}

export function clearDemoRole() {
  window.localStorage.removeItem(ROLE_STORAGE_KEY);
}
