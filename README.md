# 🏋️ MiGym

App web de seguimiento de entrenamiento y progreso personal. 100% en el navegador, sin backend, sin cuentas, sin internet. Los datos se guardan en `localStorage` y se exportan/importan como un único archivo JSON.

---

## ✨ Características

**🏋️ Rutina (usuario)**
- Ejercicios por día con GIF demostrativo, series y peso editable.
- Autocompletado de pesos desde la última sesión del mismo día.
- **Cambiar ejercicio** de la rutina sin tocar la original (solo el día).
- **Agregar extras** después de completar la rutina al 100%.
- Card inline de extras con series editables y autocompletado.
- Temporizador de descanso con vibración.
- Barra de progreso diaria y tarjeta de felicitación al 100%.
- Cardio con tiempo, velocidad e inclinación.
- Botón "Finalizar día" con avance circular de rutinas.

**📊 Progreso**
- Perfil colapsable: nombre, apodo, sexo, altura, año de nacimiento y objetivo.
- Edad calculada automáticamente.
- Registro de peso corporal con fecha, kg y nota.
- Gráfica de evolución de peso en SVG puro.
- **Heatmap tipo calendario** con encabezado de días, cuadrícula completa y celdas de meses adyacentes.
- **Estados visuales**:
  - Verde: rutina completa sin extras.
  - Violeta + ⚡: rutina completa con extras.
  - Amarillo: rutina incompleta.
  - Gris rayado: día de descanso sin sesión.
- Detalle por día con rutina + extras + peso registrado.
- Mensaje contextual según objetivo (bajar / mantener / subir).

**⚙️ Admin**
- Crear, editar y eliminar rutinas.
- Configurar series, reps y peso sugerido.
- **Días de descanso** configurables con histórico.
- Tiempo de descanso global.
- Exportar / importar todo el progreso en JSON.

---

## 🚀 Cómo usarla

No requiere instalación. Abrí `index.html` en el navegador y listo.

**Primeros pasos:**
1. Entrá en **⚙️ Admin** y creá tus rutinas.
2. Configurá los **días de descanso** (por ejemplo, sábado y domingo).
3. Volvé a **🏋️ Rutina** y completá tus series.
4. Cuando termines al 100%, agregá extras si querés.
5. Cuando te pese, andá a **📊 Progreso → ⚖️ Registrar peso**.
6. Para migrar de dispositivo, usá **📥 Respaldo (JSON)**.

**GitHub Pages:** subí el repo → Settings → Pages → rama `main` y carpeta `/root`.
