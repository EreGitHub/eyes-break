<div align="center">

<div align="center" style="padding: 2rem 0;">
  <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1rem;">
    <img 
      src="./public/icon.png" 
      alt="EyesBreak Logo" 
      width="120" 
      style="border-radius: 20%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.3s ease;"
      onmouseover="this.style.transform='scale(1.05)'"
      onmouseout="this.style.transform='scale(1)'"
    />
    <div style="text-align: left;">
      <h1 style="margin: 0; font-size: 2.8em; color: #2c3e50; letter-spacing: -0.5px;">EyesBreak</h1>
      <p style="margin: 0.5rem 0 0; font-size: 1.2em; color: #7f8c8d; font-weight: 500;">
        Tu compañero para el cuidado visual
      </p>
    </div>
  </div>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Angular](https://img.shields.io/badge/Angular-19.0.1-DD0031?logo=angular)](https://angular.io/)
  [![Tauri](https://img.shields.io/badge/Tauri-2.0.0-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
  [![Bun](https://img.shields.io/badge/Bun-1.2.0-FFC131?logo=bun&logoColor=white)](https://bun.sh/)
  [![Rust](https://img.shields.io/badge/Rust-1.87.0-FFC131?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![Cargo](https://img.shields.io/badge/Cargo-1.87.0-FFC131?logo=cargo&logoColor=white)](https://www.rust-lang.org/)

  <p align="center">
    <img src="./screenshot.png" alt="Menubar app with Tauri" width="500" />
  </p>
</div>

---

EyesBreak es una aplicación de escritorio diseñada para ayudar a los usuarios a mantener una rutina saludable de descanso visual. La aplicación te recuerda periódicamente que es hora de hacer una pausa para descansar la vista, ofreciendo ejercicios y recomendaciones para reducir la fatiga visual.

## 🚀 Características

- Recordatorios programados para pausas visuales
- Ejercicios guiados para descansar la vista
- Personalización de intervalos de trabajo y descanso
- Interfaz intuitiva y fácil de usar
- Disponible para Windows, macOS y Linux

## 📦 Requisitos del Sistema

- Node.js 19.0.1 o superior
- Angular CLI 19.0.1
- Rust 1.87.0 o superior
- Cargo 1.87.0
- Tauri (se instalará automáticamente)

## 🛠️ Instalación para Desarrolladores

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/eyes-break.git
cd eyes-break
```

### 2. Instalar dependencias

```bash
# Instalar dependencias de Node.js
bun install

# Instalar dependencias de Rust (si no las tienes)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Instalar dependencias del sistema para Tauri
# Para macOS:
brew install create-dmg
# Para Ubuntu/Debian:
# sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

## 🚀 Iniciar la aplicación en modo desarrollo

```bash
# Ejecutar el servidor de desarrollo de Angular
bun tauri dev
```

## 🏗️ Construir para producción

```bash
# Construir el ejecutable con Tauri
bun tauri build
```

## 📚 Documentación para Desarrolladores

### Estructura del Proyecto

```
src/
├── app/               # Módulos y componentes de Angular
├── public/            # Recursos estáticos
├── styles/            # Estilos globales
└── tauri/             # Configuración de Tauri
```

### Convenciones de Código

- Usar TypeScript con tipado estricto
- Seguir la guía de estilo de Angular

### Uso Básico

1. Al iniciar, la aplicación se minimizará en la bandeja del sistema (barra de tareas)
2. La aplicación te notificará cuando sea hora de tomar un descanso
3. Sigue los ejercicios en pantalla durante el tiempo de descanso
4. La aplicación se reanudará automáticamente después del descanso

### Personalización

Puedes personalizar la aplicación desde el menú de configuración:

- Intervalo de trabajo (por defecto: 20 minutos)
- Duración del descanso (por defecto: 20 segundos)
- Activar/desactivar notificaciones
- Iniciar con el sistema

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Si encuentras algún problema o tienes alguna pregunta, por favor [abre un issue](https://github.com/tuusuario/eyes-break/issues).

## 🌐 Enlaces Útiles

- [Documentación de Angular](https://angular.io/docs)
- [Documentación de Tauri](https://tauri.app/)
- [Guía de estilo de Angular](https://angular.io/guide/styleguide)
