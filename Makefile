.PHONY: help up down restart logs clean build test

# Variables
DOCKER_COMPOSE := docker-compose
APP_NAME := Hisham Traders ERP

help: ## Show this help message
	@echo "$(APP_NAME) - Docker Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (MySQL, API, Web)
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Services starting..."
	@echo "📍 API:  http://localhost:3001"
	@echo "📍 Web:  http://localhost:5173"
	@echo "📍 DB:   localhost:3306"

down: ## Stop all services
	$(DOCKER_COMPOSE) down

restart: down up ## Restart all services

logs: ## View logs from all services
	$(DOCKER_COMPOSE) logs -f

logs-api: ## View API logs only
	$(DOCKER_COMPOSE) logs -f api

logs-web: ## View Web logs only
	$(DOCKER_COMPOSE) logs -f web

logs-mysql: ## View MySQL logs only
	$(DOCKER_COMPOSE) logs -f mysql

build: ## Build Docker images
	$(DOCKER_COMPOSE) build

clean: ## Remove all containers and volumes
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Containers and volumes removed"

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

shell-api: ## Open shell in API container
	$(DOCKER_COMPOSE) exec api sh

shell-web: ## Open shell in Web container
	$(DOCKER_COMPOSE) exec web sh

shell-mysql: ## Open MySQL shell
	$(DOCKER_COMPOSE) exec mysql mysql -u root -p

# Development commands
dev: up logs ## Start services and view logs

test: ## Run tests in containers
	$(DOCKER_COMPOSE) exec api pnpm run test
	$(DOCKER_COMPOSE) exec web pnpm run test

lint: ## Run linters in containers
	$(DOCKER_COMPOSE) exec api pnpm run lint
	$(DOCKER_COMPOSE) exec web pnpm run lint

db-migrate: ## Run database migrations
	$(DOCKER_COMPOSE) exec api pnpm run prisma:migrate

db-seed: ## Seed database
	$(DOCKER_COMPOSE) exec api pnpm run prisma:seed

db-reset: ## Reset database (delete all data and seed)
	$(DOCKER_COMPOSE) exec api pnpm run prisma:reset

# Useful shortcuts
install: ## Install dependencies in all services
	$(DOCKER_COMPOSE) exec api pnpm install
	$(DOCKER_COMPOSE) exec web pnpm install

status: ## Show status of all services
	@echo "$(APP_NAME) Services Status:"
	@$(DOCKER_COMPOSE) ps --services

version: ## Show Docker and Docker Compose versions
	@echo "Docker version:"
	@docker --version
	@echo "Docker Compose version:"
	@docker-compose --version
