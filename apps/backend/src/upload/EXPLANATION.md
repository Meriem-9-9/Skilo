# Gestion des Uploads

Ce module s'occupe d'envoyer les images (avatars, photos dans le chat) sur un serveur externe.

### Pourquoi Cloudinary ?
On utilise **Cloudinary** pour stocker les images. 
- Ca evite de charger le serveur local avec des fichiers lourds.
- Cloudinary redimensionne et optimise les images automatiquement pour qu'elles chargent plus vite.

### Comment ca marche ?
1. Le frontend envoie un fichier via un formulaire.
2. Le backend recoit le fichier en memoire (via `Multer`).
3. Le service `UploadService` envoie ce fichier vers Cloudinary en utilisant un "stream" (un flux de donnees).
4. Cloudinary repond avec une URL (ex: `https://res.cloudinary.com/.../image.jpg`).
5. On renvoie cette URL au frontend pour l'enregistrer dans le profil de l'utilisateur.
