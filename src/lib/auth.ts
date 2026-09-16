import { createHash } from 'node:crypto';

// Panel /sysadmin: no hay usuario/contraseña, se entra con un único
// código guardado en la variable de entorno SYSADMIN_CODE. La cookie
// de sesión guarda un hash de ese código (no el código en texto plano),
// así que no hace falta guardar sesiones en ningún lado — cualquier
// request puede validarse comparando el hash contra el que se calcula
// a partir de la variable de entorno en ese momento.

export const SESSION_COOKIE = 'sysadmin_session';

function getAdminCode(): string {
  const code = import.meta.env.SYSADMIN_CODE;
  if (!code) {
    throw new Error(
      'Falta SYSADMIN_CODE en las variables de entorno.'
    );
  }
  return code;
}

function expectedSessionValue(): string {
  return createHash('sha256').update(`${getAdminCode()}::sysadmin-session`).digest('hex');
}

/** true si el código ingresado coincide con SYSADMIN_CODE. */
export function verifyCode(input: string): boolean {
  try {
    return input.trim().length > 0 && input === getAdminCode();
  } catch {
    return false;
  }
}

/** Valor que hay que guardar en la cookie de sesión al loguearse. */
export function makeSessionValue(): string {
  return expectedSessionValue();
}

/** true si el valor de la cookie de sesión es válido. */
export function isValidSession(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false;
  try {
    return cookieValue === expectedSessionValue();
  } catch {
    return false;
  }
}
