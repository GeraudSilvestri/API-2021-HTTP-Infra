## Informations globales
Les étapes décries ci-dessous ont été implémentées simultanément à notre avancement dans le laboratoire. Donc, les informations fournies peuvent être observées avant tout dans la branche correspondante du repo git.

## Etape 1 : Mise en place du docker
Image utilisée : php:8.1.0-apache afin d'utiliser la dernière version disponible

Bootstrap utilisé pour le site statique : [https://startbootstrap.com/previews/stylish-portfolio](source)


### Construire une image docker

- Création d'un fichier dockerfile : Utilisation de l'image php-apache de DockerHub et copie de notre dossier src (fichiers nécessaire pour notre site static) dans apache.

- Création de l'image avec la command : ``` docker build -t apache-php/static .```

- Démarrage du container utilisant l'image : ```docker run -d -p 7070:80 apache-php/static```

Grâce au paramètre -t, il est possible de spécifier un tag pour une image afin d'éviter d'utiliser son id et le ```.``` indique que le répertoire courant contient le dockerfile correspondant.

Nous avons remappé le port 7070 de la machine physique sur le port 80 de notre container docker.

Pour accéder au site, il suffit de chercher ```localhost:7070``` sur le navigateur internet.

## Etape 2 : Mise en place de Node.js
Image utilisée : node:16.13.1

### Création d'une application web dynamique
Pour cette partie, il est nécessaire d'installer des modules pour node.js. Cela est effectué automatiquement dans le dockerfile.

Le module express va permettre de récupérer des requêtes HTTP sur un port fourni et d'en construire dynamiquement depuis un script. 
Chance va uniquement nous fournir des entrées aléatoires que nous afficherons.

Les opérations indiquées ci-dessus ont été développées dans le fichier index.js. Ce script ainsi que toutes ses dépendances sont ensuite copiés dans le dossier /opt/app du container express.

Après l'installation des modules et de la copie du script, il faut indiquer au container que le script doit être exécuté.

Pour tester le fonctionnement, il suffit de se connecter via un navigateur à localhost:```<port fourni au container>```. Certaines installations de Docker utilisent une adresse ip définie au lieu de localhost.

### Lancer le container
```docker run --name <nom container> -p <port extern>:3000 <nom image>```

Nous allons ainsi mapper le port voulu au port 3000 utilisé par notre application.

## Etape 3 : Mise en place du reverse proxy

A partir de cette étape, nous n'utiliserons plus directement localhost sur le navigateur, mais un hostname. Cependant pour que les requêtes soient tout de même envoyées vers le container reverse proxy, il faut indiquer au service DNS local de notre machine que le hostname voulu se traduit par ```127.0.0.1```. Sur windows, il faut modifier le fichier ```C:\WINDOWS\System32\Drivers\Etc\hosts```.

Notre infrastructure accueille un nouveau container apache servant de reverse proxy qui va récupérer toutes les requêtes venant de l'extérieur.

Dans le dockerFile de notre reverse proxy, nous copions certains fichiers vers le répertoire contenant les fichiers de configuration pour apache.

Ces fichiers représentent des ```virtualHosts``` apache qui vont nous permettre de rediriger les requêtes http sur les containers voulus.

Le fichier de configuration de virtualHost vide ```000-default.conf``` est présent uniquement pour filtrer les requêtes ciblant uniquement le port 8080 afin que celles-ci ne passent pas par ```001-reverse-proxy.conf```. ```001-reverse-proxy.conf``` s'occupe de rediriger la requête vers le container souhaité.

Pour l'instant, le seul moyen de rediriger la requête est de fournir l'adresse ip du container. La limite de cette implémentation et que les adresses des containers sont susceptibles de changer entre deux run.

Les adresses ip actuelles des containers peuvent être récupérées via la commande ```docker inspect```.

En plus de copier les virtualhosts, nous indiquons à Apache d'activer les modules proxy et proxy_http ainsi que d'activer les ```sites``` se trouvant dans les fichiers préalablement copiés.

## Etape 4 : Ajout d'un script effectuant des requêtes ajax
Les images des différents containers docker ont été mises à jour pour y installer vim afin de modifier facilement différents fichiers js et html.

Un script js a été ajouté sur le container gérant le contenu statique afin de récupérer les informations dynamiquement crées par le container express. Cette communication entre le serveur web statique et dynamique passe par le reverse proxy, ce qui en plus de rendre les échanges plus sécurisés, permet de facilement agrandir l'infrastructure si nécessaire (les fonctionnalités ajoutées communiqueront elles aussi via le reverse proxy).

Pour pouvoir utiliser ce script, nous récupérons la bibliothèque JQuery depuis un CDN (le template bootstrap choisi ne l'implémente pas directement).
Finalement, un système de requêtes ajax s'effectuant périodiquement a été mis en place pour rafraîchir les informations chaque x secondes. Cette opération a été automatisée en modifiant la configuration du container web_static.

## Etape 5 : Reverse proxy dynamique

### Utilisation de Docker Compose
Sur windows, Docker Compose est installé directement avec Docker. Docker compose s'occupe de gérer nos différents containers à notre place. Pour le mettre en place dans notre infrastructure, il a juste été nécessaire de créer un ficher docker-compose.yml contenant sa version ainsi qu'une liste des différents "services" disponibles dans notre environnement. On fournit, pour chaque service, le Dockerfile correspondant au container souhaité. En sachant que chaque service représente un certain type de container docker, les différents services implémentés dans notre fichier de configuration docker compose sont un serveur web static, un serveur web dynamique et un reverse-proxy Apache. 

Ainsi, il est possible de récupérer dynamiquement certaines informations des containers via leur service correspondant comme par exemple l'adresse ip locale du container.  Ainsi, il nous a été possible de fournir les noms des services web_static et web_dynamique au lieu de leur adresse ip statique dans le virtual host 001-reverse-proxy.conf du reverse proxy.

L'ensemble des containers peuvent être build et run via la commande docker-compose up/build.

Il est maintenant possible d'exécuter notre application sans avoir à se soucier des adresses ip utilisées.

## Etape 6 : Load balancing
Pour mettre en place un système de load balancing, nous avons utilisé l'outil Traefik disponible avec docker compose.

L'image maison reverse proxy est retirée au profit de l'image officielle Traefik ce qui signifie que désormais nous laissons à Traefik la gestion du routage des requêtes au sein de notre infrastructure.

Il faut lui indiquer le provider utilisé (docker dans notre cas). Nous avons aussi mis à disposition un dashBoard permettant de monitorer nos containers sur le port 8282. 
On indique également le port mapping pour le container Traefik étant donné que désormais c'est lui qui sert de goulet d'étranglement entre nos serveurs et l'extérieur.

Pour le container web_static et web_dynamic, il est indiqué qu'ils sont éligibles pour Traefik et nous appliquons au container Traefik une règle de routage permettant de transmettre les requêtes accédant à l'host test-reverse-proxy:8080 sur web_static et test-reverse-proxy:8080/animals sur web_dynamic.

Pour le routage de web_dynamic cependant, il y a une spécificité. Nous avons indiqué à express d'accepter les requêtes get sans préfixe de page. Hors par défaut, Traefik redirige les requêtes sans retoucher leur contenu et dans notre cas le '/animals' pose problème. Grâce à des options (notamment les middlewares) nous avons pu retirer ce /animals de la requête lorsque Traefik la redirige vers web_dynamic.

Le load balancing est maintenant fonctionnel, Traefik l'implémente par défaut.

Pour tester cette fonctionnalité, il faut lancer plusieurs containers de web_static afin que ceux-ci se partagent la charge. Cette maneuvre est effectuée via la commande : docker-compose up -d --scale web_static=<nombre de container souhaité>

### Validation

Affichage du hostame du container web_static utilisé
![](Images/scr1-lb.png)

Après quelques rafraîchissements de pages :
![](Images/scr2-lb.png)

On remarque via le hostname que le host a changé.

## Etape 7 : Sticky session
Pour ajouter cette fonctionnalité, il suffit juste d'indiquer certaines options liées à Traefik à notre service web_static.
Options qui sont :
    - "traefik.http.services.web_static.loadBalancer.sticky.cookie=true"
    - "traefik.http.services.web_static.loadBalancer.sticky.cookie.name=hostName"

Après la mise en place de ces lignes, un cookie hostName sera fourni au client pour que celui-ci l'envoi dans ses futurs requêtes. Traefik va ensuite identifier le container correspondant et lui transmettre la requête.

### Validation
Même après plusieurs rafraîchissements, le hostname reste identique. Le client est maintenant lié à un container web_static en particulier. J'affiche également le contenu du cookie.
![](Images/scr-ss.png)

## Etape 8 : Dynamic cluster management
Grâce à Docker compose et de l'outil Traefik, la gestion dynamique du cluster de container est automatiquement géré. Lorsqu'un serveur apache statique disparait du cluster, les utilisateurs qui étaient liés auparavant par le cookie servant de sticky session au-dit container sont géré par un des autres containers disponibles.

### Validation
Affichage du hostname actuellement utilisé.
![](Images/last-scr1.png)

On remarque via les logs que le container utilisé est web_static_1.
![](Images/last-scr2.png)

Arrêt de web_static_1.
![](Images/last-scr3.png)

Malgrés le sticky session, Traefik remarque que le container n'est plus disponible et en fourni un autre.
![](Images/last-scr4.png)