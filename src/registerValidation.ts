export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
};

export type RegisterFieldName = keyof RegisterFormValues;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}][\p{L}\s\-']{0,48}$/u;

export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('9')) return `7${digits}`;
  return digits;
}

export function isValidRuPhone(raw: string): boolean {
  const digits = normalizePhoneDigits(raw);
  return digits.length === 11 && digits.startsWith('7');
}

function required(value: string): string | null {
  if (!value.trim()) return 'Это поле обязательно для заполнения';
  return null;
}

export function validateRegisterField(
  name: RegisterFieldName,
  values: RegisterFormValues
): string | null {
  const value = values[name] ?? '';
  if (name === 'firstName' || name === 'lastName') {
    const empty = required(value);
    if (empty) return empty;
    if (!NAME_RE.test(value.trim())) {
      return name === 'firstName'
        ? 'Введите имя буквами, без цифр и спецсимволов'
        : 'Введите фамилию буквами, без цифр и спецсимволов';
    }
    return null;
  }
  if (name === 'email') {
    const empty = required(value);
    if (empty) return empty;
    if (!EMAIL_RE.test(value.trim())) return 'Введите корректный email';
    return null;
  }
  if (name === 'phone') {
    const empty = required(value);
    if (empty) return empty;
    if (!isValidRuPhone(value)) return 'Номер телефона введён в неправильном формате';
    return null;
  }
  if (name === 'password') {
    const empty = required(value);
    if (empty) return empty;
    if (value.length < 8) return 'Пароль должен содержать минимум 8 символов';
    if (!/[A-Za-zА-Яа-яЁё]/.test(value) || !/\d/.test(value)) {
      return 'Пароль должен содержать буквы и цифры';
    }
    return null;
  }
  if (name === 'passwordConfirm') {
    const empty = required(value);
    if (empty) return empty;
    if (value !== values.password) return 'Пароли не совпадают';
    return null;
  }
  return null;
}

export function validateRegisterForm(values: RegisterFormValues): Partial<Record<RegisterFieldName, string>> {
  const errors: Partial<Record<RegisterFieldName, string>> = {};
  (Object.keys(values) as RegisterFieldName[]).forEach((name) => {
    const err = validateRegisterField(name, values);
    if (err) errors[name] = err;
  });
  return errors;
}

export function firstRegisterError(values: RegisterFormValues): string | null {
  const errors = validateRegisterForm(values);
  return (
    errors.firstName ||
    errors.lastName ||
    errors.email ||
    errors.phone ||
    errors.password ||
    errors.passwordConfirm ||
    null
  );
}

export const REGISTER_FIELD_META: Record<
  RegisterFieldName,
  { label: string; hint: string; placeholder: string; autoComplete: string; type: string }
> = {
  firstName: {
    label: 'Имя',
    hint: 'Например: Иван',
    placeholder: 'Иван',
    autoComplete: 'given-name',
    type: 'text',
  },
  lastName: {
    label: 'Фамилия',
    hint: 'Например: Иванов',
    placeholder: 'Иванов',
    autoComplete: 'family-name',
    type: 'text',
  },
  email: {
    label: 'Email',
    hint: 'Например: dispatcher@example.com',
    placeholder: 'dispatcher@example.com',
    autoComplete: 'email',
    type: 'email',
  },
  phone: {
    label: 'Телефон',
    hint: 'Например: +7 999 123-45-67',
    placeholder: '+7 999 123-45-67',
    autoComplete: 'tel',
    type: 'tel',
  },
  password: {
    label: 'Пароль',
    hint: 'Минимум 8 символов, включая цифры и буквы',
    placeholder: 'Не менее 8 символов',
    autoComplete: 'new-password',
    type: 'password',
  },
  passwordConfirm: {
    label: 'Подтверждение пароля',
    hint: 'Введите пароль ещё раз',
    placeholder: 'Повторите пароль',
    autoComplete: 'new-password',
    type: 'password',
  },
};
