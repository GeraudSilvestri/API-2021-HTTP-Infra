## Etape 1 : Mise en place du docker
Image utilisée : php:8.1.0-apache afin d'utiliser la dernière version disponible

Bootstrap utilisé pour le site static : [https://startbootstrap.com/previews/stylish-portfolio](source)


### Construire une image docker

Création d'un fichier dockerfile : Utilisation de l'image php-apache de DockerHub et copie de notre dossier src (fichiers nécessaire pour notre site static) dans apache.

Création de l'image avec la command : docker build -t apache-php/static .

Grâce au paramètre -t, il est possible de spécifier un tag pour une image afin d'éviter d'utiliser son id et le . indique que le répertoire courant contien le dockerfile correspondant.

Démarrage du container utilisant l'image : docker run -d -p 7070:80 apache-php/static

Remappant le port 7070 de la machine physique sur le port 80 de notre conteneur docker.

Pour accéder au site, il suffit de chercher "localhost:7070" sur le navigateur internet.

## Etape 2 : Mise en place de Node.js
Image utilisée : node:16.13.1

### Création d'une application web dynamique
Pour cette partie, il est nécessaire d'installer des modules pour node.js. Cela est effectué automatiquement dans le dockerfile.

Le module express va permettre de récupérer des requêtes HTTP de client sur un port fournit et d'en construire dynamiquement depuis un script. 
Chance va uniquement nous fournir des entrées aléatoires.

Les opérations indiquées ci-dessus ont été implémentées dans le fichier index.js. Ce script ainsi que toutes ses dépendances sont ensuite copiés dans le dossier /opt/app du container express.

Après l'installation des modules et la copie du script, il faut indiquer au container que le script doit être executé.

Pour tester le fonctionnement, il suffit de se connecter via un navigateur à localhost:<port fournit au container>. Certaines installations de Docker utilise une adresse ip au lieu de localhost.

### Lancer le container
docker run --name <nom container> -p <port extern>:3000 <nom image>

Nous allons ainsi mapper le port voulu au port 3000 utilisé par notre application.

## Etape 3 : Mise en place du reverse proxy



## Etape 4 : Ajout d'un script effectuant des requêtes ajax

Les images des différents containers docker ont été mises à jour pour y installer vim afin de modifier facilement différents fichiers js et html.

Un script js a ensuite été créé sur le container gérant le contenu statique afin de récupérer les informations dynamiquement crées par le container express. Cette opération fonctionne grâce au reverse proxy car ...

Pour pouvoir utiliser ce script, nous récupérons la bibliothèque JQuery depuis un CDN (le template bootstrap choisi ne l'implémente pas directement).

Finalement, un système de requêtes ajax s'effectuant périodiquement a été mis en place pour rafraichir les informations chaque x secondes.

Les modifications citées ci-dessus en d'abord été effectuées en live sur le container, puis ont été automatisées en modifiant la configuration du container static.

## Etape 5 : Reverse proxy dynamique

### Utilisation de Docker Compose
Sur windows, Docker Compose est insallé en même temps que Docker.

Le système de reverse proxy avec compose est très facile à implémenter. Il a juste été nécessaire de créer un ficher docker-compose.yml contenant sa version ainsi que ses différents "services". Chaque service représente un container docker, ainsi il est possible de fournir ces noms de services au lieu d'adresses ip statiques dans le virtual host 001-reverse-proxy.conf

L'ensemble des containers peuvent être build et run tous ensemble via la commande docker-compose up. Il est maintenant possible d'executer notre application en négligeant l'adresse ip local fournie aux containers.