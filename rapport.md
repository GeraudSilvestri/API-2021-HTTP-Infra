## Etape 1 : Mise en place du docker
Image utilisée : php:8.1.0-apache afin d'utiliser la dernière version disponible

Bootstrap utilisé pour le site static : https://startbootstrap.com/previews/stylish-portfolio

Pour lancer le conteneur, la commande suivante doit être utilisée:
```bash
docker build -t apache-php/static .
```
"apache-php/static" étant le nom du conteneur et le . disant qu'on le build à la racine.

Ensuite pour lancer le docker, il faut utiliser :

```bash
docker run -d -p 7070:80 apache-php/static
```

Remappant le port 7070 de la machine physique sur le port 80 de notre conteneur docker.

Au lancement du conteneur, on copie les fichiers du dossier src dans le dossier /var/www/html. Le dossier src contenant tout les fichiers nécessaires à la mise en place de notre site.

Pour accéder au site, il suffit de chercher "localhost:7070" sur le navigateur internet.