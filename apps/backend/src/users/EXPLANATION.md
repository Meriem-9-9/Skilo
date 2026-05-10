# Gestion des Profils Utilisateurs

C'est ici qu'on gere tout ce qui touche aux utilisateurs de Skilo.

### Profil et Onboarding
Un utilisateur doit completer son profil pour apparaitre dans les recherches. 
- **Force du profil** : On calcule un score sur 100. 
  - Photo = 20 pts
  - Bio = 20 pts
  - 3 competences offertes = 30 pts
  - 3 competences recherchees = 30 pts
- **Bonus** : Si tu atteins 100%, on t'offre **1 credit bonus** !

### Les Competences de l'utilisateur
Chaque utilisateur peut avoir jusqu'a 5 competences offertes et 5 competences recherchees.
- Quand tu ajoutes une competence, on recalcule tes **Matchs** automatiquement.
- On ne peut pas supprimer une competence si elle a deja ete utilisee dans une session (pour garder l'historique propre).

### Visibilite et Securite
- **Soft Delete** : Supprimer ton compte ne l'efface pas de la base, il le desactive juste (`isActive: false`).
- **Vie privee** : Ton email n'est visible que par les personnes avec qui tu as une session **confirmee**.
- **Action Dynamique** : Sur le profil de quelqu'un, le bouton change selon ta relation avec lui (Proposer une session, Voir la session en cours, ou Envoyer un message).
