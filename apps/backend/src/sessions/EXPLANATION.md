# Gestion des Sessions

C'est ici que se passe le coeur de Skilo : l'organisation des cours entre utilisateurs.

### Le cycle de vie d'une session

#### 1. Propose (Proposition)
Un utilisateur propose une session a un autre. 
- Si c'est un **Match Partiel**, on reserve les credits de l'eleve tout de suite.
- On verifie que la date est dans le futur et qu'il n'y a pas deja trop de sessions en cours (max 3).

#### 2. Confirm / Decline (Acceptation ou Refus)
- **Acceptation** : La session passe en statut `confirmed`. Si c'est payant, les credits sont definitivement debites.
- **Refus** : La session passe en `declined`. On rend les credits a l'eleve s'ils etaient bloques.

#### 3. Complete (Termine)
Une fois le cours fini, le prof marque la session comme terminee. C'est la qu'il recoit ses credits (sauf si c'etait un Match Parfait gratuit).

#### 4. Cancel (Annulation)
N'importe qui peut annuler avant le debut. On rend les credits si besoin.

---

### Le Chat
Chaque session a son propre chat. Contrairement au reste de l'app, ici on utilise les **WebSockets** (`sessions.gateway.ts`) pour que les messages arrivent en temps reel sans avoir a rafraichir la page.
- `joinSession` : pour ecouter les messages d'une session.
- `sendMessage` : pour envoyer un message en direct.

#### Pourquoi Socket.io et pas "WebSocket" pur ?
Socket.io est une librairie qui simplifie l'utilisation des WebSockets. 
1. **Auto-reconnexion** : Si ta connexion internet coupe une seconde, Socket.io reconnecte tout seul. En WebSocket pur, tu dois coder ca toi-meme.
2. **Fallback** : Si le navigateur est vieux et ne supporte pas le WebSocket, Socket.io passe en "HTTP Long Polling" automatiquement.
3. **Rooms** : Socket.io a deja le concept de "salles" (ex: `client.join('session_123')`). En WebSocket pur, tu dois gérer toi-meme quel client est dans quelle salle et faire le tri des messages.

#### Si on voulait faire du WebSocket "From Scratch" ?
Il faudrait implémenter :
1. **Le "Handshake"** : Gérer la requete HTTP initiale qui demande de passer en WebSocket.
2. **Le Formatage** : Encoder/Décoder les données en "frames" binaires (le WebSocket ne comprend pas directement le JSON).
3. **Le Heartbeat** : Envoyer des petits messages ("ping/pong") toutes les quelques secondes pour verifier que la connexion est toujours vivante.
4. **Le Routage** : Créer un systeme pour savoir quel message doit déclencher quelle fonction (ce que fait `@SubscribeMessage` tout seul).

### Les Notifications
A chaque changement d'etape (nouvelle proposition, acceptation, etc.), on envoie une notification pour prevenir l'autre utilisateur.
