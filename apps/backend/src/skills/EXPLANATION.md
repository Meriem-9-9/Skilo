# Catalogue des Competences

Ce module gere la liste de tout ce qu'on peut apprendre ou enseigner sur Skilo.

### Le Catalogue (SkillCatalog)
Plutot que de laisser les utilisateurs ecrire n'importe quoi, on utilise un catalogue officiel.
- **Approved** : Les competences validees par les admins. Elles apparaissent dans la recherche.
- **Pending Review** : Quand un utilisateur propose une nouvelle competence, elle arrive ici. Un admin doit la valider.
- **Rejected** : Si la competence n'a pas de sens ou est un doublon.

### Recherche et Autocomplete
On utilise un systeme de recherche par **nom** et par **alias**.
- Exemple : Si tu cherches "JS", tu trouveras "JavaScript" car "JS" est un alias.
- Les resultats sont tries par `usageCount` : les competences les plus populaires apparaissent en premier.

### Modération
Seuls les administrateurs peuvent approuver ou rejeter des competences. Une fois approuvee, une competence devient utilisable par tout le monde sur son profil.
