# PharmaWorkspace — État du projet

## Vue d'ensemble

PharmaWorkspace est une application SaaS B2B pour officines pharmaceutiques françaises. Elle centralise la gestion quotidienne de l'équipe officine : tâches, ordonnances, commandes, locations de matériel et ruptures de stock.

**Stack** : Next.js 16 App Router · Supabase (PostgreSQL + Auth OTP) · Tailwind CSS · shadcn/ui · Vercel  
**Projet Supabase** : eddwztmplkgwdijvhfjy.supabase.co (région Paris)  
**Statut** : MVP fonctionnel — en phase de finalisation avant pilote terrain

---

## Ce qui est terminé

### Infrastructure & Auth
- Authentification OTP email complète (login → vérification → dashboard)
- Onboarding titulaire (création officine → profil)
- Flux d'invitation E2E (génération lien → OTP → assignation pharmacy_id + role → marquage accepted_at)
- Middleware de protection des routes (proxy.ts)
- ProfileContext partagé (performance optimisée, zéro doublon de requêtes)
- RLS activé sur toutes les tables
- Build propre — 0 erreur lint, 0 warning

### Modules métier
- **Dashboard** : KPIs temps réel (tâches, ordonnances, ruptures, locations), notes de transmission, session de travail, alertes ruptures nationales ANSM
- **Tâches** : vue liste + kanban, création, assignation, priorités, statuts, filtres, recherche
- **Ordonnances** : liste, création avec OCR automatique (GPT-4o-mini), prescription_items par médicament, commentaires, filtres, export CSV
- **Commandes** : liste, création avec lignes produits, gestion fournisseurs, statuts, recherche, export CSV
- **Locations** : liste, création, suivi retour, alertes overdue, daily_rate
- **Ruptures** : liste, création avec scan CIP13 + résolution BDPM, croisement ruptures ANSM, badge et alerte officielle, export
- **Admin** : gestion équipe, invitations, désactivation membres, paramètres officine

### OCR & Intelligence
- Route `/api/ocr` abstraite avec dispatch par provider (`OCR_PROVIDER`)
- Provider OpenAI GPT-4o-mini opérationnel — extrait nom patient + médicaments + dosages en un appel
- Provider Ollama/LLaVA implémenté (fallback local, qualité limitée)
- Stubs Claude et Mistral prêts pour activation future
- Extraction : nom patient, médicaments, dosages, quantités

### Base médicaments BDPM
- Table `medications` — 20 744 médicaments actifs importés (source ANSM officielle)
- Résolution CIP13 → nom médicament dans le formulaire ruptures
- Autocomplétion sur le nom du médicament
- Scanner code-barres EAN-13 caméra (mobile + desktop fallback)

### Ruptures ANSM
- Table `drug_shortages` — 1 031 ruptures officielles ANSM importées
- Croisement automatique ruptures officine ↔ ruptures nationales
- Badge ANSM dans la liste des ruptures
- Bannière d'alerte dans le drawer de détail
- Page `/ansm` dédiée avec toutes les ruptures actives
- Mise à jour manuelle mensuelle (fichier BDPM)

### Qualité & Conformité code
- 0 erreur lint, 0 warning
- Build production propre
- Contrat DataTable aligné (`header`, `render(value, row)`)
- `created_by` / `reported_by` uniformes via `auth.getUser()`
- `useProfile` depuis `ProfileContext` uniquement
- Types TypeScript alignés sur le schéma réel
- Schéma IaC `0001_init.sql` aligné sur la base

---

## Ce qui reste à faire

### Priorité haute — Avant déploiement

**Refonte UI/UX**
L'interface actuelle est fonctionnelle mais pas assez soignée pour un pilote terrain. Il faut retravailler :
- Typographie (hiérarchie, tailles, poids)
- Système de boutons (styles, états, cohérence)
- Espacements et densité d'information
- Cartes et surfaces
- Version mobile (le personnel de comptoir utilise des téléphones)
- Pages prioritaires : Dashboard, Tâches, Ordonnances

**Déploiement Vercel**
- Configuration des variables d'environnement production
- `OPENAI_API_KEY`, `OCR_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- HTTPS obligatoire pour le scanner caméra sur mobile
- Domaine personnalisé

**Tests E2E en conditions réelles**
- Flux invitation complet avec un vrai second utilisateur
- Désactivation d'un membre
- OCR sur vraies ordonnances (différents médecins, différentes polices)
- Scanner CIP13 sur mobile avec HTTPS

### Priorité moyenne — V1.1 post-pilote

- Mise à jour automatique mensuelle de la base BDPM et des ruptures ANSM
- Notifications push (tâches en retard, locations overdue)
- Pagination serveur (les listes sont chargées entièrement en mémoire)
- Recherche full-text avancée
- Mode hors-ligne partiel

### Priorité basse — V2

- PILL Chat (RAG sur les données de l'officine)
- Intégration LGO (logiciel de gestion officine)
- Résolution automatique CIP13 → médicament via API Vidal
- OCR amélioré avec Claude Vision ou Mistral
- Tableaux de bord analytiques (tendances, performance équipe)
- Application mobile native (React Native)

---

## Architecture technique

```
src/
├── app/
│   ├── (auth)/          login, verify, invite/[token]
│   ├── (onboarding)/    onboarding, create, profile
│   ├── (app)/           dashboard, tasks, prescriptions, orders, rentals, shortages, ansm
│   ├── (admin)/         admin, admin/settings
│   └── api/             auth/callback, invite, ocr
├── contexts/
│   └── profile-context.tsx     source unique de useProfile
├── components/
│   ├── shared/          DataTable, DetailDrawer, StatusBadge, PriorityBadge, BarcodeScanner
│   ├── layout/          Header, Sidebar, SessionGuard
│   └── [module]/        table, drawer, form par module
├── hooks/               use-tasks, use-prescriptions, use-orders, use-rentals, use-shortages, use-session
├── lib/
│   ├── queries/         sessions, tasks, prescriptions, orders, rentals, shortages, admin, medications, drug-shortages, prescription-items
│   └── supabase/        client, server, middleware
└── types/               index.ts, database.types.ts
```

## Base de données — Tables

| Table | Description |
|---|---|
| `pharmacies` | Officines |
| `profiles` | Utilisateurs (étend auth.users) |
| `invitations` | Invitations équipe |
| `work_sessions` | Sessions de travail |
| `tasks` | Tâches |
| `prescriptions` | Ordonnances |
| `prescription_items` | Médicaments par ordonnance |
| `prescription_comments` | Commentaires ordonnances |
| `suppliers` | Fournisseurs |
| `orders` | Commandes |
| `order_items` | Lignes de commande |
| `rentals` | Locations matériel |
| `shortages` | Ruptures officine |
| `medications` | Base BDPM (20 744 médicaments) |
| `drug_shortages` | Ruptures officielles ANSM (1 031) |

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
OPENAI_API_KEY
OCR_PROVIDER=openai
OLLAMA_URL=http://localhost:11434      (dev local uniquement)
OLLAMA_MODEL=llava-llama3              (dev local uniquement)
```

---

## Décisions produit actées

- Auth OTP uniquement — pas de mot de passe
- Rôles : titulaire / adjoint / préparateur
- Ordonnances anonymisées (`patient_ref` texte libre, pas de données personnelles structurées)
- Pas de CIP13 sur les ordonnances (présent sur la boîte, pas sur le papier)
- OCR = aide à la saisie, le pharmacien valide toujours
- Base BDPM mise à jour manuellement chaque mois
- PILL Chat / RAG en V2

---

*Document généré le 31 mars 2026*
