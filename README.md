# Planning Poker – Projet Poker Planning

Ce projet est une application de Planning Poker réalisée par Aamara Aya, Bouaouich Nouhayla et Amirat Meroua dans le cadre d’un projet académique.  
Elle permet d’estimer des tâches d’un backlog en utilisant la méthode Planning Poker, avec plusieurs modes de jeu.

---

## Objectif du projet

L’objectif est de développer une application fonctionnelle permettant :
- l’estimation collaborative de tâches
- la gestion d’un backlog
- la mise en œuvre de différents modes de jeu
- l’utilisation de fichiers JSON
- une exécution simple sur la machine de l’évaluateur

---

## Technologies utilisées

- HTML
- CSS
- JavaScript (vanilla)
- PHP (API côté serveur)
- JSON (backlog et données)
- Node.js (tests et intégration continue)

---

## Prérequis

- PHP version 8 ou plus
- xampp server
- Node.js (pour les tests et la CI)
- Un navigateur web moderne

---

## Installation et exécution

1. Cloner le dépôt :

```bash
git clone https://github.com/aya-spongebob/projet_poker_planning.git
cd projet_poker_planning
```
2. Lancer un serveur local :
 ```bash
  C:\xampp\php\php.exe -S localhost:8000
```
3. Ouvrir le projet dans le navigateur :
 ```bash
   http://localhost:8000
```
---
## Fonctionnalités principales

- Page d’accueil avec présentation du projet
- Choix du mode de jeu (Local ou Remote)
- Gestion d’un backlog de tâches
- Estimation des tâches avec des cartes de Planning Poker
- Révélation des votes
- Progression dans le backlog
- Pause « Café » permettant d’interrompre la partie et de reprendre ensuite

---

## Modes du jeu

Mode Local

Les joueurs votent à tour de rôle sur le même poste
Passage automatique au joueur suivant

Mode Remote

Les joueurs sont sélectionnés via une liste
Les votes sont envoyés au serveur

---

## Gestion des données
Le backlog est chargé depuis un fichier JSON
Les votes et l’état de la partie sont gérés côté serveur
Certaines informations temporaires sont stockées dans le navigateur

---
## Structure du projet
- index.html : page d’accueil
- mode.html : choix du mode de jeu
- menu-router.html : navigation
- poker.html : page principale de jeu
- poker.js : logique du Planning Poker
- api/ : scripts PHP pour la gestion des données
- cafe.html : page de pause

---
## Tests unitaires
Des tests unitaires ont été mis en place afin de vérifier le bon fonctionnement des fonctions de calcul utilisées dans le projet.
Les tests peuvent être exécutés avec la commande suivante :
```bash
  npm test
```

## Intégration continue

Une intégration continue a été mise en place afin d’automatiser la vérification du projet à chaque modification du code.
La CI se déclenche automatiquement à chaque push ou pull request sur le dépôt GitHub.

Le workflow de la CI comprend les étapes suivantes :
- récupération du code source
- configuration de l’environnement Node.js
- installation des dépendances
- exécution des tests unitaires
- génération de la documentation

La commande npm ci est utilisée afin de garantir une installation reproductible des dépendances.
Elle s’appuie sur le fichier package-lock.json, qui fixe précisément les versions utilisées et évite les différences de comportement entre les environnements.

---
## Documentation
La documentation du projet est générée automatiquement à l’aide de JSDoc avec la commande suivante :
```bash
  npm run docs
```
Les fichiers générés sont placés dans le dossier docs.
