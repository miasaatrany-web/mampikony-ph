# Guide d'Installation de l'Application Pharmacie (Mode Hors-Ligne)

Ce guide vous explique comment faire fonctionner votre application sur votre propre ordinateur sans avoir besoin d'internet.

## 1. Prérequis
Avant de commencer, vous devez installer **Node.js** sur votre ordinateur serveur (l'ordinateur principal de la pharmacie).
- Allez sur [https://nodejs.org/](https://nodejs.org/)
- Téléchargez et installez la version **LTS** (recommandée pour la plupart des utilisateurs).

## 2. Préparation des fichiers
1. Téléchargez votre projet depuis Google AI Studio (Export to ZIP).
2. Décompressez le fichier ZIP dans un dossier sur votre bureau (par exemple : `C:\Pharmacie`).

## 3. Premier Lancement (Installation)
1. Ouvrez le dossier de l'application.
2. Dans la barre d'adresse de l'explorateur de fichiers, tapez `cmd` et appuyez sur **Entrée** (ou faites un clic droit dans le dossier et choisissez "Ouvrir dans le terminal").
3. Tapez la commande suivante pour installer les composants nécessaires :
   ```bash
   npm install
   ```
   *Attendez la fin de l'installation (cela peut prendre 1 à 2 minutes).*

## 4. Lancer l'Application
Chaque matin, pour ouvrir la pharmacie, faites ceci :
1. Ouvrez le dossier de l'application.
2. Ouvrez un terminal (cmd).
3. Tapez la commande :
   ```bash
   npm run dev
   ```
4. L'application est maintenant active !
   - Sur l'ordinateur serveur : Ouvrez votre navigateur et allez à `http://localhost:3000`
   - Sur les téléphones des employés : Connectez-les au Wi-Fi et allez à `http://[VOTRE_ADRESSE_IP]:3000`

## 5. Trouver votre adresse IP (pour vos employés)
1. Sur l'ordinateur serveur, ouvrez un terminal (cmd).
2. Tapez `ipconfig` et appuyez sur **Entrée**.
3. Cherchez **Adresse IPv4**. Elle ressemble à `192.168.1.XX`. C'est cette adresse que vos employés doivent utiliser.

## 6. Utilisation sans Internet
Pour que cela fonctionne sans internet :
1. Branchez un routeur Wi-Fi (même sans abonnement internet).
2. Connectez l'ordinateur serveur et les téléphones au Wi-Fi de ce routeur.
3. Lancez l'application avec `npm run dev`.
4. Tout le monde peut travailler ensemble !

---
*Note : Votre compte administrateur est `miasaatrany@gmail.com`.*
