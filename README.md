
# Umuhora Wallet

Bienvenue sur **Umuhora Wallet**, un portefeuille Bitcoin open-source et non-custodial. Ce projet a été conçu pour offrir un moyen simple et sécurisé de gérer vos Bitcoins, où l'utilisateur a le contrôle total de ses clés.

## Fonctionnalités

*   **Portefeuille non-custodial**: Vous seul contrôlez vos fonds.
*   **Création et Restauration**: Créez un nouveau portefeuille avec une phrase de récupération de 12 mots, ou restaurez un portefeuille existant.
*   **Envoyer et Recevoir**: Envoyez et recevez facilement des Bitcoins via une adresse ou un QR code.
*   **Acheter et Vendre**: Achetez ou vendez des Bitcoins en utilisant des fournisseurs de services intégrés.
*   **Historique des transactions**: Consultez toutes les transactions de votre portefeuille avec leurs détails.
*   **Sécurité**: Sauvegardez votre clé privée (WIF) ou restaurez votre portefeuille à partir d'une sauvegarde.
*   **Paramètres personnalisés**: Changez la devise d'affichage (USD, BIF, etc.) et l'unité monétaire (BTC, sats).

## Technologies utilisées

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Langage**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Composants UI**: [ShadCN UI](https://ui.shadcn.com/)
*   **Gestion de formulaires**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **API Backend**: Le portefeuille utilise un serveur backend pour gérer les informations des utilisateurs, les portefeuilles et les transactions.

## Pour commencer

Pour lancer ce projet sur votre machine, suivez ces étapes :

1.  **Clonez le projet**:
    ```bash
    git clone https://github.com/your-repo-url.git
    cd umuhora-wallet
    ```

2.  **Installez les dépendances**:
    L'application utilise `npm` pour la gestion des dépendances.
    ```bash
    npm install
    ```

3.  **Lancez le serveur de développement**:
    ```bash
    npm run dev
    ```
    Vous pouvez maintenant accéder à l'application sur `http://localhost:9002`.

4.  **Build pour la production**:
    Lorsque vous êtes prêt à déployer, utilisez :
    ```bash
    npm run build
    ```

## Sécurité

> **IMPORTANT**: Ceci est un projet de portefeuille non-custodial. Cela signifie que vous seul détenez vos clés et êtes responsable de la sécurité de vos fonds. Ne partagez jamais votre phrase de récupération (mnemonic phrase) ou votre clé privée (WIF) avec qui que ce soit.

## Contribuer

Ce projet est open-source. Vous souhaitez contribuer ? Vous êtes le bienvenu ! Vous pouvez aider en corrigeant des bugs, en ajoutant de nouvelles fonctionnalités ou en améliorant la documentation.
