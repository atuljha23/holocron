---
name: security-checklist
description: OWASP-style quick reference — authn/authz, injection, secrets, sessions, crypto, dependencies. Use during code review and before committing security-sensitive changes.
---

# Security checklist

## Authn / authz
- [ ] Authentication check happens on a path the caller can't influence (verified JWT, session cookie with `HttpOnly`/`Secure`/`SameSite`).
- [ ] Authorization is explicit in the handler, not implied by routing.
- [ ] Role/permission decisions use the server's identity model, never a client-supplied header.
- [ ] Multi-tenant check: the resource belongs to the caller's tenant (not just the caller's user).
- [ ] No IDOR: object IDs in URLs are checked against ownership, not just existence.

## Input validation
- [ ] Validated at the edge (handler/controller), not deep in services.
- [ ] Schema-based where possible (zod/pydantic/struct tags).
- [ ] Every sink is aware of the shape feeding it (SQL parameters, shell args, template context, file paths, HTTP URLs, deserializers).

## Injection surfaces
- [ ] SQL: parameters only. Never string-concat into a query.
- [ ] Shell: use argv arrays, never `exec(string)` with user input. Use a safe runner (`execFile`, `subprocess.run([...])`).
- [ ] Path: reject `..`, absolute paths, and symlinks that escape the allowed root.
- [ ] Template: auto-escape on; avoid `raw`/`|safe`; parameterize over string assembly.
- [ ] Deserializers: never `pickle`/`yaml.load`/`eval` on untrusted input.
- [ ] HTML rendering: sanitize + use a framework that auto-escapes; beware `dangerouslySetInnerHTML`.

## Secrets
- [ ] Not in source.
- [ ] Not logged. Scrub before logging (redact keys like `password`, `token`, `secret`, `auth`).
- [ ] Read from env or a secrets manager.
- [ ] Rotated when in doubt.

## Sessions / cookies
- [ ] `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` when tighter is fine).
- [ ] Session rotates on privilege change (login, logout, role change).
- [ ] Logout invalidates server-side, not just client-side.

## Crypto
- [ ] Use the platform library. Never roll your own.
- [ ] MD5 / SHA-1 are NOT for security. Use SHA-256+, bcrypt/argon2 for passwords.
- [ ] Encryption in authenticated mode (AES-GCM), never ECB.
- [ ] RNG: cryptographic (`crypto.randomBytes` / `secrets.token_*`), never `Math.random`.
- [ ] Secrets compared in constant time where applicable.

## Transport
- [ ] TLS everywhere. Redirect HTTP → HTTPS.
- [ ] HSTS set for production domains.
- [ ] No secrets in query strings (URLs end up in logs).
- [ ] CSRF: token on state-changing endpoints (unless using strict CORS + SameSite cookies and you can prove it).

## CORS
- [ ] Allow-list, not wildcard, for credentialed requests.
- [ ] `Access-Control-Allow-Origin: *` never with `Access-Control-Allow-Credentials: true`.

## Output / response
- [ ] Return only fields the caller is entitled to — no "send the whole ORM object" leaks.
- [ ] Error messages don't expose internals (stack traces, SQL, file paths) to clients.

## Dependencies
- [ ] `npm audit` / `pip-audit` / `bundler-audit` / `cargo audit` / `govulncheck` clean (or triaged).
- [ ] New dep has a real reason. Not "saw it on a blog post."

## Rate limiting / abuse
- [ ] Expensive endpoints throttled per user/IP/tenant.
- [ ] Login is bruteforce-protected (rate limit + lockout threshold).
- [ ] Enumeration-resistant responses on auth endpoints.

## File uploads
- [ ] Type detected from content, not extension.
- [ ] Size limits enforced before reading into memory.
- [ ] Served from a domain without session cookies (or via signed URL).

## Logging
- [ ] No PII / secrets in logs.
- [ ] Log authn events (success, failure, logout).
- [ ] Include requestId for correlation.
