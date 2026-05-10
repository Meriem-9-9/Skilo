# Systeme de Credits

C'est ici qu'on gere l'argent virtuel de l'appli.

### Les Regles
- **1 heure = 1 credit**. Si tu fais une session de 1h30, ca coute 2 credits (on arrondit au-dessus).
- **Le Plafond** : On ne peut pas avoir plus de **20 credits**. C'est pour forcer les gens a depenser leurs credits et pas juste les accumuler.

### Les fonctions principales

#### 1. reserve
Quand tu proposes une session, on bloque tes credits tout de suite pour etre sur que tu peux payer. Ils passent en "reserve".

#### 2. debit
Une fois que la session est acceptee, les credits reserves sont definitivement retires de ton compte.

#### 3. credit
C'est quand tu recois tes credits apres avoir donne un cours. Si tu es deja a 20 credits, on te previent que tu vas en perdre car tu as atteint le plafond.

#### 4. refund
Si la session est annulee, on te rend tes credits qui etaient bloques en reserve.

---

### Pourquoi une Transaction Prisma ?
Tu verras souvent `this.prisma.$transaction([...])`.
On l'utilise pour etre sur que si une etape plante, rien n'est enregistre. Par exemple, on ne veut pas enlever de l'argent a quelqu'un si la creation de l'historique plante. Soit tout passe, soit rien ne passe.


### return Math.ceil(durationMinutes / 60);
Ce code calcule le nombre de credits necessaires pour une duree donnee en minutes.
1,6 -> ceil(1,6) = 2
2,3 -> ceil(2,3) = 3

si durationMinutes = 60 => 1 credit
si durationMinutes = 61 => 2 credits
si durationMinutes = 30 => 1 credit