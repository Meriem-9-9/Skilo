# 🚀 Quick Start - Refresh Token & Logout

## ⚡ Configuration Rapide (2 minutes)

### 1. Vérifier les variables d'environnement

Ouvrir `.env` et vérifier que ces variables existent :

```env
JWT_SECRET="ton_secret_access_token"
JWT_REFRESH_SECRET="ton_secret_refresh_token_DIFFERENT"
```

**⚠️ Important:** `JWT_REFRESH_SECRET` doit être **différent** de `JWT_SECRET`

**Générer des secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Installer les dépendances (si pas déjà fait)

```bash
pnpm install
```

### 3. Démarrer le serveur

```bash
pnpm run dev
```

✅ Le serveur devrait démarrer sur `http://localhost:2006`

---

## 🧪 Test Rapide (5 minutes)

### Option A: Avec VS Code REST Client

1. Ouvrir `src/auth/auth.http`
2. Cliquer sur "Send Request" pour chaque endpoint

### Option B: Avec cURL

#### 1. Register
```bash
curl -X POST http://localhost:2006/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }' \
  -c cookies.txt
```

**Vérifier:** Fichier `cookies.txt` contient `refresh_token`

#### 2. Refresh
```bash
curl -X POST http://localhost:2006/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Vérifier:** Nouveau `access_token` dans la réponse

#### 3. Logout
```bash
curl -X POST http://localhost:2006/auth/logout \
  -b cookies.txt
```

**Vérifier:** `{ "message": "Déconnecté avec succès" }`

#### 4. Tester refresh après logout (doit échouer)
```bash
curl -X POST http://localhost:2006/auth/refresh \
  -b cookies.txt
```

**Vérifier:** Status 401, `"Token has been revoked"`

---

## 🎯 Flux Complet Recommandé

```
Register → Get Profile → Wait 16 min → Refresh → Logout
```

### Scénario détaillé:

1. **Register** - Créer un compte
   - Reçoit: `access_token` (15min) + `refresh_token` cookie (7j)

2. **Get Profile** - Utiliser access token
   ```bash
   curl http://localhost:2006/auth/me \
     -H "Authorization: Bearer <access_token>"
   ```

3. **Attendre 16+ minutes** (ou modifier expiration pour tests)

4. **Get Profile Again** - Access token expiré
   - Reçoit: 401 Unauthorized

5. **Refresh** - Obtenir nouveau access token
   - Ancien refresh token blacklisté
   - Nouveau refresh token en cookie

6. **Get Profile** - Avec nouveau token
   - Fonctionne ✅

7. **Logout** - Révoquer refresh token

8. **Refresh Again** - Doit échouer
   - 401 "Token has been revoked"

---

## 🔍 Vérification Base de Données

### Voir les tokens blacklistés

```bash
# Se connecter à PostgreSQL
psql -U votre_user -d votre_db

# Voir les tokens blacklistés
SELECT 
  id, 
  LEFT(token_hash, 16) as hash_preview,
  blacklisted_at,
  expires_at
FROM token_blacklist
ORDER BY blacklisted_at DESC
LIMIT 10;
```

**Après logout, vous devriez voir :** 1 entrée dans `token_blacklist`

---

## ⏰ Tester le CRON Job (Cleanup)

### Option 1: Attendre jusqu'à 3 AM
La tâche s'exécute automatiquement à 3h du matin.

### Option 2: Déclencher manuellement
Modifier `src/auth/tasks/blacklist-cleanup.task.ts` temporairement :

```typescript
// Changer de:
@Cron(CronExpression.EVERY_DAY_AT_3AM)

// À:
@Cron(CronExpression.EVERY_MINUTE) // Test seulement !
```

**Vérifier les logs:**
```
[BlacklistCleanupTask] Cleaned X expired tokens from blacklist
```

**⚠️ Ne pas oublier de remettre `EVERY_DAY_AT_3AM` après le test !**

---

## 🐛 Debugging

### Problème: "JWT_REFRESH_SECRET is not defined"

**Solution:**
```env
# Ajouter dans .env
JWT_REFRESH_SECRET="votre_secret_ici"
```

### Problème: Cookies non envoyés

**Solution:**
- Vérifier CORS: `credentials: true`
- Vérifier frontend envoie: `withCredentials: true`
- Vérifier cookie path: `/auth`

### Problème: Token rotation ne fonctionne pas

**Vérifier:**
1. Table `token_blacklist` existe en DB
2. `ScheduleModule.forRoot()` dans `app.module.ts`
3. Logs console pour erreurs

### Problème: Build échoue

**Erreurs connues (non liées à auth):**
- `onboardingStep` commenté dans schema
- `emailLower` non existant

**Pour tester auth seulement:**
- Démarrer avec `pnpm run dev` (hot reload)
- Ignorer erreurs de build pour l'instant

---

## 📊 Checklist Finale

Avant de considérer l'implémentation complète :

- [ ] JWT_SECRET configuré
- [ ] JWT_REFRESH_SECRET configuré (différent de JWT_SECRET)
- [ ] Serveur démarre sans erreur
- [ ] Register fonctionne
- [ ] Login fonctionne
- [ ] Refresh fonctionne
- [ ] Logout fonctionne
- [ ] Refresh après logout échoue (401)
- [ ] Cookie `refresh_token` est httpOnly
- [ ] Token blacklist stocké en DB
- [ ] CRON task configuré

---

## 🎉 Succès !

Si tous les tests passent, l'implémentation est **complète et fonctionnelle** !

**Prochaines étapes:** Voir `IMPLEMENTATION-SUMMARY.md` Phase 2 & 3

---

## 📞 Support

**Documentation complète:**
- `auth-completeness-analysis.md` - Analyse système
- `REFRESH-LOGOUT-IMPLEMENTATION.md` - Guide technique
- `IMPLEMENTATION-SUMMARY.md` - Résumé implémentation

**Fichiers de test:**
- `src/auth/auth.http` - Requêtes REST Client
