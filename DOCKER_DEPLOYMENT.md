# Docker Deployment Guide - Kasbnoma

## Краткое описание

Приложение состоит из трех контейнеров:
- **Frontend** (React + Express на порту 3000)
- **Backend** (FastAPI на порту 8000)
- **Database** (PostgreSQL на порту 5432)

## Системные требования

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM минимум
- 10GB свободного места на диске

## Быстрый старт

### 1. Клонирование и подготовка

```bash
# Перейти в директорию проекта
cd /path/to/kasbnoma

# Создать .env файл из примера (опционально)
cp .env.example .env
```

### 2. Сборка и запуск всех сервисов

```bash
# Собрать образы и запустить контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 3. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## Команды управления

```bash
# Просмотр логов
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db

# Остановка
docker-compose down

# Перестроение образов
docker-compose up -d --build

# Удаление всего включая объемы (внимание: удалит БД!)
docker-compose down -v
```

## Структура образов

### Dockerfile.backend
- Base: `python:3.12-slim`
- Размер: ~300-400MB
- Порт: 8000

### Dockerfile.frontend
- Build stage: `node:20-alpine`
- Production stage: `node:20-alpine`
- Размер: ~200-250MB
- Порт: 3000

## Развертывание на сервере

### Вариант 1: Docker Compose (Рекомендуется)

```bash
# На сервере
ssh user@server

# Клонировать репозиторий
git clone <repo-url> kasbnoma
cd kasbnoma

# Запустить
docker-compose up -d

# Проверить
docker-compose ps
```

### Вариант 2: Docker Swarm

```bash
# Инициализировать Swarm
docker swarm init

# Развернуть stack
docker stack deploy -c docker-compose.yml kasbnoma

# Проверить сервисы
docker service ls
```

### Вариант 3: Kubernetes

```bash
# Создать deployment из docker-compose.yml
kompose convert -f docker-compose.yml

# Или использовать helm chart
helm install kasbnoma ./helm-chart
```

## Переменные окружения для production

Создать файл `.env` для production сервера:

```env
# Database
DATABASE_URL=postgresql://user:password@db-host:5432/kasbnoma

# Backend
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_NAME=Kasbnoma

# Frontend
VITE_API_URL=https://api.yourdomain.com
PORT=3000

# Security
PYTHONUNBUFFERED=1
```

## Проблемы и решения

### Ошибка подключения к БД
```bash
# Проверить статус БД
docker-compose logs db

# Перезапустить БД
docker-compose restart db
```

### Frontend не может подключиться к Backend
- Проверить `VITE_API_URL` и `CORS_ORIGINS`
- Убедиться, что Backend запущен: `docker-compose ps backend`

### Очистка docker сиcтемы
```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые объемы
docker volume prune
```

## Масштабирование

Для production с высокой нагрузкой:

```yaml
# Добавить в docker-compose.yml
  backend:
    deploy:
      replicas: 3
      
  frontend:
    deploy:
      replicas: 2
```

## Backup и восстановление

### Backup БД
```bash
docker exec kasbnoma_db pg_dump -U kasbnoma kasbnoma > backup.sql
```

### Restore БД
```bash
docker exec -i kasbnoma_db psql -U kasbnoma kasbnoma < backup.sql
```

## Поддержка и вопросы

Для вопросов обращайтесь в техническую поддержку или создавайте issues на GitHub.
