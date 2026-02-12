# Mockup Studio (Frontend + Backend + Docker)

Plataforma web full-stack para geração de mockups a partir de uma imagem PNG enviada pelo usuário.

## Funcionalidades

- Upload de imagem PNG
- Seleção de categoria (papelaria, fachada, embalagem, camiseta, mobile, desktop, tablet)
- Texto opcional para estilo
- Geração automática de 4 mockups
- Ações por mockup: **Baixar** e **Refazer**
- Interface moderna e responsiva

## Stack

- Frontend: React + Vite
- Backend: Express + Sharp + Multer
- Deploy: Docker / Docker Compose

## Execução local

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Build de produção

```bash
npm run build
npm start
```

## Deploy em VPS Hostinger (Docker)

```bash
docker compose up -d --build
```

Aplicação disponível em `http://SEU_IP:3000`.
