# C'est quoi forwardRef ?

En gros, NestJS est un peu perdu quand deux modules ont besoin l'un de l'autre en meme temps. C'est ce qu'on appelle une **dependance circulaire**.

### Le probleme
Imagine :
- **Module A** importe **Module B**
- **Module B** importe **Module A**

NestJS ne sait pas lequel charger en premier. Il tourne en boucle et finit par planter ou donner une erreur "undefined".

### La solution : forwardRef
`forwardRef()` dit a NestJS : "T'inquiete, ne charge pas tout de suite, attends que les deux modules soient prets avant de faire le lien."

C'est comme si tu disais : "Je te preterai mon velo quand tu me donneras ton casque", et l'autre dit pareil. Sans `forwardRef`, vous restez bloques. Avec `forwardRef`, vous vous mettez d'accord pour faire l'echange au dernier moment.

### C'est quoi le Logger ?
Le `Logger` c'est comme un journal de bord pour ton serveur.
- Au lieu de faire un simple `console.log`, on utilise `this.logger.log()`.
- Ca permet de voir ce qui se passe en temps reel dans la console avec une etiquette (le nom du service) et l'heure precise.
- C'est super utile pour debugger sans arreter le serveur.

---

### Comment fonctionne le matching ?

Voici comment marchent les fonctions un peu compliquees dans `matching.service.ts` :

#### 1. recalculateForUser
C'est le cerveau. Quand tu changes ton profil, cette fonction :
- Recupere tes competences.
- Trouve tous les autres utilisateurs qui pourraient matcher.
- Boucle sur chaque personne pour voir s'il y a un "Match Parfait" ou "Partiel".
- Met a jour la base de donnees.

#### 2. findPerfectMatches
C'est la fonction la plus complexe car elle a des boucles imbriquees.
- Elle cherche si **User A** propose ce que **User B** veut...
- **ET** si **User B** propose ce que **User A** veut.
- Si les deux conditions sont remplies, c'est un **Match Parfait** (un echange direct).

#### 3. findPartialMatches
Elle est plus simple : elle cherche juste si **User B** a quelque chose que **User A** veut, mais sans que **User A** n'ait forcement quelque chose pour **User B** en retour. Dans ce cas, **User A** devra payer en credits.

#### 4. upsertMatch
"Upsert" c'est un melange de "Update" et "Insert".
- Si un match existe deja entre deux personnes, on le met a jour (Update).
- S'il n'existe pas, on le cree (Insert).
- C'est ici qu'on envoie aussi les notifications quand un nouveau match est trouve.

---

### C'est quoi un Job et le Cron ?

Dans `matching.job.ts`, on utilise un **Job** avec une expression **Cron**.

#### Pourquoi un Job ?
Parfois, on veut faire des taches automatiquement sans qu'un utilisateur n'ait besoin de cliquer sur un bouton. Ici, le job recalcule tous les matches de la plateforme.

#### Pourquoi en avons-nous besoin ?
Meme si on recalcule le matching quand un utilisateur change son profil, il peut y avoir des petits bugs ou des changements en base de donnees qui ne declenchent pas de recalcul. Le job est la comme "filet de securite" pour s'assurer que tout est a jour au moins une fois par heure.

#### C'est quoi le Cron ?
Le `Cron` c'est un standard pour dire au serveur : "Fais cette tache a tel moment".
- `@Cron(CronExpression.EVERY_HOUR)` veut dire : "Execute cette fonction toutes les heures pile".
- C'est comme programmer un reveil sur ton telephone pour qu'il sonne tous les matins a la meme heure.

