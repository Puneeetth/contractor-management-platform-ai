Production deployment baseline for Ubuntu

Backend
- Build: `./mvnw clean package -DskipTests`
- Run with profile: `SPRING_PROFILES_ACTIVE=prod`
- Required env vars are listed in [backend/.env.example](../backend/.env.example)
- Recommended app location: `/opt/cmp-ai/backend`
- Recommended upload path: `/opt/cmp-ai/uploads`

Frontend
- Build: `npm ci && npm run build`
- Deploy static files from `frontend/dist` to `/var/www/cmp-ai`
- Frontend should call backend through `/api`

Nginx
- Use the sample file in [nginx/cmp-ai.conf](./nginx/cmp-ai.conf)
- Configure your real domain before enabling

Systemd
- Use the sample service file in [systemd/cmp-ai.service](./systemd/cmp-ai.service)
- Update paths, user, and environment file path

Recommended production notes
- Use a dedicated Linux user such as `cmp-ai`
- Do not store real secrets in git-tracked files
- Use HTTPS and keep only ports 80/443 exposed
- Run database backups and rotate application logs
