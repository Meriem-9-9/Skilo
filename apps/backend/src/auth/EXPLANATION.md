# Authentification et Securite

C'est ici qu'on gere les connexions et la protection des donnees.

### Comment ca marche ?
On utilise des **JWT (JSON Web Tokens)**. 
- Quand tu te connectes, on te donne un badge (le token).
- A chaque fois que tu demandes quelque chose au serveur, tu montres ton badge.
- Si le badge est valide, le serveur te laisse passer.

### Les fichiers importants

#### 1. auth.service.ts
C'est ici qu'on verifie les mots de passe avec **bcrypt** (pour ne pas stocker les mots de passe en clair) et qu'on genere les tokens.

#### 2. auth.controller.ts
C'est la porte d'entree. Il contient les routes pour s'inscrire, se connecter ou se deconnecter.

#### 3. jwt.guard.ts
C'est le "videur" de la boite de nuit. Il verifie si ton badge (token) est bon avant de te laisser acceder aux routes protegees.

#### 4. roles.guard.ts
Lui, il verifie si tu as le bon grade (User ou Admin). Par exemple, seul un Admin peut acceder a certaines pages.

---

### Securite supplementaire
- **Hachage** : On utilise `bcrypt` avec un cout de 12 pour que ce soit tres difficile a pirater.
- **Refresh Token** : On utilise un deuxieme token pour te garder connecte plus longtemps sans avoir a retaper ton mot de passe.
- **Referral Bonus** : Quand tu t'inscris via un parrain, on utilise `creditsService` pour donner 5 credits a ton parrain.

---

### Pourquoi `JwtModule.registerAsync` ?

Dans `auth.module.ts`, on utilise `registerAsync` au lieu de `register`.

#### Le probleme de `register`
Si on utilisait `register()`, on devrait donner le secret JWT en dur (ex: `secret: 'mon-secret'`). Mais c'est une mauvaise pratique : le secret doit etre dans le fichier `.env` pour etre en securite.

#### La solution `registerAsync`
Avec `registerAsync`, on dit a NestJS : "Attends que le module de configuration (`ConfigModule`) soit pret, puis va chercher le secret dans les variables d'environnement".
- `imports: [ConfigModule]` : On importe les outils pour lire le `.env`.
- `inject: [ConfigService]` : On demande a utiliser le service qui lit les variables.
- `useFactory` : C'est la fonction qui recupere la valeur `JWT_SECRET` et configure le module JWT proprement.

C'est beaucoup plus pro et securise !
