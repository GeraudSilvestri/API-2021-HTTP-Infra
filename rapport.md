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
Sur windows, Docker Compose est installé directement avec Docker. Docker compose s'occupe de gérer nos différents containers à notre place. Pour le mettre en place dans notre infrastructure, il a juste été nécessaire de créer un ficher docker-compose.yml contenant sa version ainsi qu'une liste des différents "services" disponibles dans notre environnement. On fournit, pour chaque service, le Dockerfile correspondant au container souhaité. En sachant que chaque service représente un certain type de container docker, les différents services implémentés dans notre fichier de configuration docker compose sont un serveur web static, un serveur web dynamique et un reverse-proxy Apache. 

Ainsi, il est possible de récupérer dynamiquement certaines informations des containers via leur service correspondant comme par exemple l'adresse ip locale du container.  Ainsi, il nous a été possible de fournir les noms des services web_static et web_dynamique au lieu de leur adresse ip statique dans le virtual host 001-reverse-proxy.conf du reverse proxy.

L'ensemble des containers peuvent être build et run via la commande docker-compose up/build.

Il est maintenant possible d'executer notre application sans avoir à se soucier des adresses ip utilisées.

## Etape 6 : Load balancing
Pour mettre en place un système de load balancing, nous avons utilisé l'outil Traefik disponible avec docker compose.

L'image maison reverse proxy est retirée au profit de l'image officielle Traefik ce qui signifit que désormais nous laissons à Traefik la gestion du routage des requêtes au sein de notre infrastructure.

Il faut lui indiquer le provider utilisé (docker dans notre cas). Nous avons aussi mis à disposition un dashBoard permettant de monitorer nos containers sur le port 8282. 
On indique également le port mapping pour le container Traefik étant donné que désormais c'est lui qui sert de goulet d'étranglement entre nos serveurs et l'extérieur.

Pour le container web_static et web_dynamic, il est indiqué qu'ils sont éligibles pour Traefik et nous appliquons au container Traefik une règle de routage permettant de transmettre les requêtes accédant à l'host test-reverse-proxy:8080 sur web_static et test-reverse-proxy:8080/animals sur web_dynamic.

Pour le routage de web_dynamic cependant, il y a une spécificité. Nous avons indiqué à express d'accepter les requêtes get sans prefixe de page. Hors par défaut, Traefik redirige les requêtes sans retoucher leur contenu et dans notre cas le '/animals' pose problème. Grâce à des options (notamment les middlewares) nous avons pu retirer ce /animals de la requête lorsque Traefik la redirige vers web_dynamic.

Le load balancing est maintenant fonctionnel, Traefik l'implémente par défaut.

Pour tester cette fonctionnalité, il faut lancer plusieurs containers de web_static afin que ceux-ci se partagent la charge. Cette maneuvre est effectuée via la commande : docker-compose up -d --scale web_static=<nombre de container souhaité>

## Etape 7 : Sticky session
Pour ajouter cette fonctionnalité, il faut juste indiquer des options à Traefik.

tester docker-compose scale web=2 worker=3