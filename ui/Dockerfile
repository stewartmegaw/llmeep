# Two stages so the runtime carries no build tooling: node builds the front end,
# python serves it. The back end is standard library only, so the final image has
# no dependency tree of its own — this ships to adopters and runs in their
# cluster, and a supply chain is not a thing to hand someone unasked.

FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM python:3.12-alpine
# git, because writing will mean committing to the mounted repo.
RUN apk add --no-cache git
WORKDIR /app
COPY api/ ./api/
COPY --from=web /web/dist ./web/dist
# The repo is mounted, never baked in. Nothing about a particular install is
# in this image (`DEC-048` — the image is a door, the repo is the centre).
ENV LLMEEP_PORT=8080
EXPOSE 8080
CMD ["python3", "api/server.py"]
