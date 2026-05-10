# System d'Avis et Reputation

C'est ici qu'on gere la confiance entre les utilisateurs. Apres chaque session, on peut se laisser une note et un commentaire.

### Les Regles du jeu

#### 1. La fenetre de 7 jours
On n'a que **7 jours** apres la fin d'une session pour laisser un avis. Apres, c'est trop tard, la fenetre se ferme.

#### 2. Double-aveugle (Blind Review)
C'est la partie la plus importante : ton avis est **cache** (`isVisible: false`) tant que l'autre personne n'a pas aussi laisse son avis. 
- Ca evite que quelqu'un mette une mauvaise note juste parce qu'il en a recu une.
- Si apres 7 jours une seule personne a vote, l'avis devient public automatiquement.

#### 3. Calcul de la moyenne
A chaque nouvel avis publie, on recalcule la moyenne (`avgRating`) et le nombre de sessions terminees de l'utilisateur.

#### 4. Les Badges
Si un utilisateur a :
- Plus de **5 sessions** terminees.
- Une moyenne de **4.0** ou plus.
On lui donne un badge "Top Prof" ou "Top Eleve" (en fonction de ce qu'il fait le plus).

---

### Pourquoi c'est complexe ?
Le calcul des badges et des moyennes demande de regarder beaucoup de donnees. On utilise des fonctions comme `updateUserStats` pour s'assurer que le profil de l'utilisateur est toujours a jour avec ses dernieres performances.
