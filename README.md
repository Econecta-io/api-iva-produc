# Clasificador de IVA con Deepseek

<div align="center">
  <img src="https://econecta.shop/logo.png" alt="Econecta Logo" width="200">
</div>

Esta API utiliza Deepseek para clasificar productos y determinar su IVA correspondiente basándose en imágenes y descripciones de productos, siguiendo la ley del IVA vigente. API utilizada en https://econecta.shop

<div align="center">
  <img src="https://img.shields.io/badge/version-1.0.1-blue.svg" alt="Versión">
  <img src="https://img.shields.io/badge/author-marioagutierrez-green.svg" alt="Autor">
  <img src="https://img.shields.io/badge/license-ISC-orange.svg" alt="Licencia">
</div>

## Requisitos

- Node.js (v14 o superior)
- npm
- API Key de Deepseek

## Instalación

1. Clona el repositorio
```
https://github.com/Econecta-io/api-iva-produc.git
```

2. Instala las dependencias:
```bash
npm install
```
3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
DEEPSEEK_API_KEY=tu_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

## Uso

Inicia el servidor:
```bash
node index.js
```

### Endpoint

POST `/clasificar-producto`

#### Cuerpo de la solicitud (JSON)
```json
{
    "nombre": "Nombre del producto",
    "descripcion": "Descripción del producto"
}
```

#### Respuesta
```json
{
    "producto": "Nombre del producto",
    "categoria": "Categoría asignada según la ley del IVA",
    "iva": 0.16,
    "porcentajeIVA": "16%"
}
```

## Categorías y IVA

La API clasifica los productos según las siguientes categorías y sus respectivos IVAs:

### 0% IVA
- Medicamentos, vacunas, sueros, plasmas, principios activos
- Productos del reino vegetal en su estado natural
- Alimentos básicos (arroz, harina, pan, pastas, etc.)
- Libros, diarios, periódicos
- Servicios educativos, médicos, hospitalarios
- Servicios básicos residenciales (agua, electricidad, gas)

### 8% IVA
- Animales vivos destinados al matadero
- Carnes en diferentes estados
- Aceites vegetales para consumo humano

### 16% IVA
- Productos de consumo general
- Ropa
- Electrodomésticos
- Tecnología
- Muebles
- Servicios no especificados

### 26% IVA
- Vehículos de lujo
- Motocicletas de más de 500cc
- Joyas con piedras preciosas
- Productos de lujo específicos

---

<div align="center">
  <h3>Información Adicional</h3>
  <p>Esta API es parte del ecosistema de Econecta, diseñada para facilitar la clasificación de productos y el cálculo de IVA.</p>
</div>

---

<div align="center">
  <p>© 2025 Econecta Solutions. Todos los derechos reservados.</p>
  <p>
    <a href="https://econecta.io">Econecta Solutions C,A RIF J-506263360</a> |
    <a href="mailto:mario@econecta.io">Contacto</a>
  </p>
</div> # api-iva-produc
