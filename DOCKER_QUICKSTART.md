# 🚀 Docker Setup для Kasbnoma

## Что было создано?

✅ **Dockerfile.backend** - Образ для FastAPI бэкенда (Python)
✅ **Dockerfile.frontend** - Образ для React фронтенда (Node.js)  
✅ **docker-compose.yml** - Орхестрация всех сервисов
✅ **.dockerignore** - Оптимизация сборки образов

## Архитектура

```
┌─────────────────────────────────────┐
│     Frontend Container (3000)        │
│  React + Express + Node.js           │
│  node:20-alpine (200-250MB)          │
└────────────┬────────────────────────┘
             │ HTTP запросы
             ▼
┌─────────────────────────────────────┐
│     Backend Container (8000)         │
│  FastAPI + Uvicorn + Python          │
│  python:3.12-slim (300-400MB)        │
└────────────┬────────────────────────┘
             │ SQL запросы
             ▼
┌─────────────────────────────────────┐
│     Database Container (5432)        │
│  PostgreSQL 16 Alpine                │
│  postgres:16-alpine (100-150MB)      │
└─────────────────────────────────────┘
```

## ⚡ Быстрый старт

### На локальной машине:

```bash
# Перейти в папку проекта
cd /Users/shuhrat/KN\ NEW

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

### Доступ к приложению:
- 🌐 Frontend: **http://localhost:3000**
- 🔌 Backend API: **http://localhost:8000**
- 📚 API Documentation: **http://localhost:8000/docs**
- 🗄️ Database: **localhost:5432**

## 🖥️ Развертывание на сервере

### Шаг 1: Подготовка сервера

```bash
# SSH на сервер
ssh user@your-server.com

# Установить Docker и Docker Compose (если не установлены)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Шаг 2: Клонирование проекта

```bash
# Клонировать репозиторий
git clone <your-repo-url> kasbnoma
cd kasbnoma

# Или скопировать файлы через SCP
scp -r /Users/shuhrat/KN\ NEW user@your-server.com:~/kasbnoma
```

### Шаг 3: Конфигурация для production

Создать `.env` файл с production параметрами:

```env
DATABASE_URL=postgresql://kasbnoma:secure_password@db:5432/kasbnoma
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com
APP_NAME=Kasbnoma API
VITE_API_URL=https://api.yourdomain.com
PYTHONUNBUFFERED=1
```

### Шаг 4: Запуск на сервере

```bash
# Собрать образы и запустить
docker-compose up -d

# Проверить, что все запустилось
docker-compose ps

# Проверить логи
docker-compose logs -f backend
```

## 🔐 Production конфигурация

### Поменять пароли БД:

```yaml
# docker-compose.yml - измените значения:
environment:
  POSTGRES_USER: kasbnoma
  POSTGRES_PASSWORD: your-secure-password-here
  POSTGRES_DB: kasbnoma

# А также DATABASE_URL в .env:
DATABASE_URL=postgresql://kasbnoma:your-secure-password-here@db:5432/kasbnoma
```

### Настроить CORS для вашего домена:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Добавить HTTPS через Nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📋 Полезные команды

```bash
# Остановить все сервисы
docker-compose down

# Перестроить образы
docker-compose up -d --build

# Просмотреть логи конкретного сервиса
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db

# Выполнить команду в контейнере
docker exec kasbnoma_backend bash

# Backup БД
docker exec kasbnoma_db pg_dump -U kasbnoma kasbnoma > backup-$(date +%Y%m%d).sql

# Restore БД из backup'а
docker exec -i kasbnoma_db psql -U kasbnoma kasbnoma < backup.sql

# Удалить всё включая данные БД (ОСТОРОЖНО!)
docker-compose down -v

# Очистить место от неиспользуемых образов
docker image prune -a
docker volume prune
```

## 🐛 Решение проблем

### Ошибка: "Connection refused"
```bash
# Проверить, запущены ли контейнеры
docker-compose ps

# Если нет - перезапустить
docker-compose up -d
```

### Ошибка: "Port already in use"
```bash
# Изменить порты в docker-compose.yml, например:
ports:
  - "3001:3000"  # Frontend на 3001
  - "8001:8000"  # Backend на 8001
```

### Frontend не видит Backend
```bash
# Убедиться, что CORS правильно настроен
# Проверить VITE_API_URL в docker-compose.yml
# На локальной машине должно быть: http://localhost:8000
# На сервере должно быть: https://api.yourdomain.com
```

### База данных не инициализируется
```bash
# Посмотреть логи БД
docker-compose logs db

# Перезапустить БД
docker-compose restart db
```

## 📊 Мониторинг

Посмотреть использование ресурсов:
```bash
docker stats
```

## 🔄 Обновление приложения

```bash
# Вытянуть последние изменения
git pull origin main

# Перестроить образы с новым кодом
docker-compose up -d --build

# Проверить логи
docker-compose logs -f
```

## 📝 Notes

- Docker Compose автоматически создает сеть `kasbnoma_network` для общения контейнеров
- PostgreSQL volume `kasbnoma_pg` сохраняет данные между перезапусками
- Development режим имеет `--reload` флаг для автоматической перезагрузки при изменениях кода
- Production режим удалит volume данные при `docker-compose down -v`

## ✅ Чеклист для production

- [ ] Изменить пароль PostgreSQL на надежный
- [ ] Обновить CORS_ORIGINS для вашего домена
- [ ] Установить HTTPS сертификаты
- [ ] Настроить Nginx/другой reverse proxy
- [ ] Настроить логирование (ELK, CloudWatch и т.д.)
- [ ] Настроить backup БД
- [ ] Настроить мониторинг (Prometheus, DataDog и т.д.)
- [ ] Настроить CI/CD для автоматического обновления

---

**Готово к развертыванию!** 🎉

Если у вас возникнут вопросы, проверьте логи контейнеров или обратитесь в техподдержку.
