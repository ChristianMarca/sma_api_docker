# Back-End plataforma SMA

### Api para SMA manejo de interrupciones

### __Para funcionar el modo local__
#### Require
*_Node Js_
*_Redis_
*_PostgreSQL_
*_PostGIS_ 

#### Para Iniciar
```npm
npm install
```

## Para funcionar de manera encapsulada (Docker)
## Requiere
*_Docker_
*_Docker Compose_
**_Docker-CE_*

### Para Iniciar
```
docker-compose up --build 
docker exec -it postgres bash 
sh dbInit.sh
```
##### Para el caso de OS LINUX
##### Se debe anteponer 
```
sudo 
#example sudo docker-compose up --build
```

#### Dependecias de Desarrollo 
```npm
npm install --save-dev nodemon
```

## Configuraciones Requeridas
### Crear un archivo __.env__ con estructura
```env
POSTGRES_URI= postgres://usuario:contrasena@localhost:5432/sma_api #Requerido unicamente para modo local

REDIS_URI=  redis://localhost:6379

EMAIL_GMAIL= mail_server@email.com

PASSWORD_GMAIL= password_mail
```

> A tomar en cuenta
> Para cambiar configuraciones de pre-cargado de base de datos modificar /postgres/dbInit.sh
> El archivo extraCommands.txt corresponde a una configuracion manual de pre-cargado de la base de datos 

License
----

GLP