# FlowSync: tareas de desarrollo.
# Requiere GNU Make 3.81+ y un shell POSIX: macOS, Linux y Windows vía WSL.
#
#   make setup   instala dependencias, prepara backend/.env, genera la APP_KEY y migra
#   make start   levanta backend (http://localhost:3333) y frontend (http://localhost:5173)

SHELL := /bin/sh
NODE_MIN_MAJOR := 24

.DEFAULT_GOAL := help
.PHONY: help setup start check-node dev-backend dev-frontend

help:
	@echo "Uso:"
	@echo "  make setup   Instala dependencias, prepara backend/.env, genera la APP_KEY y corre las migraciones"
	@echo "  make start   Levanta backend y frontend a la vez (Ctrl+C para parar ambos)"

# generate:key siempre reescribe APP_KEY: setup solo la genera si está vacía, para no invalidar la actual.
setup: check-node
	cd backend && npm install
	cd frontend && npm install
	@if [ -f backend/.env ]; then \
	  echo "backend/.env ya existe; no se sobrescribe."; \
	else \
	  cp backend/.env.example backend/.env && echo "backend/.env creado desde .env.example."; \
	fi
	@if grep -Eq '^APP_KEY=.+' backend/.env; then \
	  echo "APP_KEY ya definida; no se regenera."; \
	else \
	  cd backend && node ace generate:key; \
	fi
	cd backend && node ace migration:run

start: check-node
	@[ -f backend/.env ] && [ -d backend/node_modules ] && [ -d frontend/node_modules ] || \
	  { echo "Falta la instalación: ejecuta 'make setup' primero."; exit 1; }
	@echo "Backend:  http://localhost:3333"
	@echo "Frontend: http://localhost:5173"
	@echo "Ctrl+C para parar ambos."
	@$(MAKE) --no-print-directory -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

check-node:
	@command -v node >/dev/null 2>&1 || \
	  { echo "Node.js no está instalado: se necesita la versión $(NODE_MIN_MAJOR) o superior."; exit 1; }
	@node -e 'var v = process.versions.node.split(".")[0]; if (+v < $(NODE_MIN_MAJOR)) { console.error("Se necesita Node.js $(NODE_MIN_MAJOR)+ y tienes " + process.version + "."); process.exit(1); }'
