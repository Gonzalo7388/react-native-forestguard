import os

def extraer_contenido_tsx_filtrado():
    """
    Busca archivos .tsx en la carpeta actual y sus subcarpetas,
    ignorando las carpetas 'node_modules' y 'expo',
    e imprime el contenido de cada archivo.
    """
    carpetas_ignoradas = ["node_modules", "expo"]
    for raiz, directorios, archivos in os.walk("."):
        # Modificamos 'directorios' para evitar entrar en las carpetas ignoradas
        directorios[:] = [d for d in directorios if d not in carpetas_ignoradas]
        for archivo in archivos:
            if archivo.endswith(".tsx"):
                ruta_completa = os.path.join(raiz, archivo)
                print(f"\n--- Contenido de: {ruta_completa} ---\n")
                try:
                    with open(ruta_completa, 'r', encoding='utf-8') as f:
                        contenido = f.read()
                        print(contenido)
                except Exception as e:
                    print(f"Error al leer el archivo {ruta_completa}: {e}")

if __name__ == "__main__":
    extraer_contenido_tsx_filtrado()
    print("\n¡Proceso completado! Se han ignorado 'node_modules' y 'expo'. Copia y pega el contenido mostrado.")