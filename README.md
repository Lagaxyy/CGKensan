# CGKensan

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

## Description

Plateforme visant à aider l'apprentissage via des quiz avec QCM et questions ouvertes (corrigées par IA selon critères) et des flashcards recto-verso, orientée vers la progression sur le long terme.

## Liens

Site en ligne: [https://cgkensan.dbwe.tech](https://cgkensan.dbwe.tech)

Source des quiz: [https://dbwe.tech](https://dbwe.tech)

## Stack technique

| Couche | Technologie |
|-------|------------|
| Langage | TypeScript |
| Framework | Next.js 16 (App Router) |
| UI | CSS Modules + Tailwind CSS |
| Base de données | PostgreSQL + Prisma ORM |
| Temps réel / Communication | Socket.IO + Redis |
| Déploiement | Docker Compose + Caddy |
| Monitoring d'erreurs | Sentry |
| Auth | NextAuth v5 (credentials) |


## Structure du projet

```
cgkensan/
├── docs/
│   ├── quizzes/
│   │   ├── public/        # Fichiers quiz exemples
│   │   └── private/       # Fichiers quiz privés
│   └── flashcards/
│       ├── public/        # Decks de flashcards exemples
│       └── private/       # Decks de flashcards privés
├── prisma/
│   └── schema.prisma      # Schéma de la base de données
├── scripts/               # Scripts de test
├── src/
│   ├── app/               # Pages Next.js & routes API
│   ├── components/        # Composants React
│   └── lib/               # Business logic, auth, scoring
├── .env.example           # Template des variables d'environnement
└── docker-compose.yml     # Déploiement en production
```

## Quick Start (développement local)

### Pré-requis

- **Node.js** 20.9+
- **PostgreSQL** en local
- **Redis** (facultatif) pour les notifications en temps réel

### Setup

```bash
# 1. Cloner le repo
git clone https://github.com/Lagaxyy/cgkensan.git
cd cgkensan

# 2. Installer les dépendances
npm install

# 3. Créer votre .env
cp .env.example .env
```

### Configuration des variables d'environnement

Modifier `.env` avec vos propres valeurs:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Clé JWT (à générer) | `openssl rand -base64 32` |
| `DATABASE_URL` | Connexion PostgreSQL ("user" et "pass" à remplacer avec vos identifiants) | `postgresql://user:pass@localhost:5432/cgkensan?schema=public` |

### Préparer la base de données

```bash
# Appliquer les migrations
npx prisma migrate dev

# (Facultatif) Ajouter un compte admin: pseudo "devadmin", password "admin"
npx prisma db seed
```

### Lancer le serveur dev

```bash
npm run socket:dev
npm run dev
```

Aller sur **[http://localhost:3000](http://localhost:3000)** et se connecter avec le compte admin créé avec la seed.

Les notifications en temps réel ont besoin d'une instance Redis et du serveur Socket.IO (`npm run socket:dev`). L'application peut marcher sans grâce à un polling.

## Contenu pédagogique

Les quiz sont lus depuis `docs/quizzes/**/*.quiz.md` et les flashcards depuis `docs/flashcards/**/*.flashcard.md`. Les deux dossiers sont montés automatiquement par le catalogue.

Exemple de deck de flashcards:

```md
---
title: Bases du Web
wiki_ref: web/bases
tags: [web, http, dns]
difficulty: easy
created: 2026-10-20
---

# Cartes

## Que signifie HTTP ?
> HyperText Transfer Protocol.

## À quoi sert le DNS ?
### Verso
> Il traduit un nom de domaine en adresse IP.
```

Le recto correspond au titre `##`. Le verso peut être introduit par `>`, par un titre `### Verso`, ou simplement suivre le recto.

A brancher par la suite sur la base de données interne/externe

## Contribution

L'application est ouverte aux contributions! Voici comment aider:

1. Fork le repo
2. Créer une nouvelle branche (`git checkout -b feature/my-feature`)
3. Commit vos changements et push sur votre branche
4. Ouvrir une PR

## License

Distributed under the **GNU Affero General Public License v3.0**.
See [`LICENSE`](LICENSE) for more information.

This means you are free to fork, modify, and host the project, but **any modified version you run as a web service must also distribute its source code under AGPL-3.0**.
