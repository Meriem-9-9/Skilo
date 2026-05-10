# Onboarding (Bienvenue !)

C'est la premiere etape obligatoire pour tout nouvel utilisateur apres son inscription.

### Le But
On ne peut pas utiliser Skilo sans dire ce qu'on sait faire et ce qu'on veut apprendre. L'onboarding force l'utilisateur a :
1. Choisir au moins une competence a **offrir**.
2. Choisir au moins une competence a **rechercher**.
3. Renseigner sa **ville** et sa **bio**.
4. Ajouter un **avatar** (optionnel mais recommande).

### La Transaction
Quand tu valides l'onboarding, on fait tout d'un coup dans la base de donnees (Prisma Transaction) :
- On enregistre tes competences.
- On met a jour ton profil (`isOnboarded: true`).
- On cree une trace de tes **2 credits de bienvenue** dans ton historique.

### Pourquoi c'est important ?
Tant que l'onboarding n'est pas fini, l'utilisateur est redirige vers cette etape. Une fois valide, on lance le premier calcul de **Matching** pour lui proposer immediatement des personnes qui correspondent a ses besoins.
