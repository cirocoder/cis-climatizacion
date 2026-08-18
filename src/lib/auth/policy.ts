export type AcademyUser = { id: string; name: string; email: string; emailVerified: boolean; role: "USER" | "ADMIN" };

export class AuthenticationError extends Error {
  constructor() {
    super("Necesitás iniciar sesión.");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("No tenés permisos para realizar esta acción.");
    this.name = "AuthorizationError";
  }
}

export function assertAuthenticated<T extends AcademyUser>(user: T | null | undefined): T {
  if (!user) throw new AuthenticationError();
  return user;
}

export function assertAdmin<T extends AcademyUser>(user: T): T {
  if (user.role !== "ADMIN") throw new AuthorizationError();
  return user;
}
