# Forest Guard

Forest Guard es una aplicación móvil desarrollada para monitorear y gestionar a los trabajadores forestales en tiempo real. La aplicación permite a los administradores visualizar el mapa con la ubicación actual y de referencia, además de gestionar equipos y ver estadísticas sobre el trabajo realizado.

## Funcionalidades

* **Login:** Los administradores pueden acceder mediante un sistema de autenticación con usuario y contraseña.
* **Mapa:** Muestra la ubicación en tiempo real del administrador con actualizaciones cada 10 segundos. Además, se puede visualizar una ubicación estática como referencia y una lista de usuarios conectados.
* **Control de Equipos:** Permite gestionar el estado de los equipos (Activo/Inactivo) y muestra información relevante sobre cada uno, como el nombre y la última actualización.
* **Estadísticas:** Visualiza estadísticas generales como horas trabajadas, incidentes reportados, trabajadores activos, y temperatura promedio. Además, muestra un gráfico de horas trabajadas por mes.

## Requisitos

* Node.js (Recomendado v14 o superior)
* npm o yarn
* Expo (para la ejecución del proyecto en React Native)

## Instalación

Clona este repositorio:

`git clone <url_del_repositorio>`

Instala las dependencias:

`npm install`

Para correr el proyecto, usa el siguiente comando:

`npx expo start --tunnel`

Esto iniciará el servidor y te permitirá visualizar la aplicación en tu dispositivo móvil o en un emulador.

## Dependencias

* `expo-location`: Para obtener la ubicación actual del dispositivo.
* `react-native-maps`: Para mostrar mapas interactivos.
* `react-navigation`: Para la navegación entre pantallas.
* `react-native-chart-kit`: Para los gráficos de estadísticas.

## Estructura del Proyecto

El proyecto está dividido en varias pantallas principales:

* `LoginScreen`: Pantalla de inicio de sesión.
* `MapaScreen`: Pantalla que muestra el mapa con la ubicación actual y la lista de usuarios conectados.
* `ControlEquiposScreen`: Pantalla para el control y gestión de equipos.
* `EstadisticasScreen`: Pantalla para mostrar las estadísticas y el gráfico de horas trabajadas.

## Recomendaciones

* Usar una barra de navegación con Tabs para mejorar la accesibilidad y organización de las pantallas principales como Mapa, Control y Estadísticas.
* Considerar la integración de una base de datos en tiempo real para gestionar las ubicaciones y estados de los usuarios y equipos.