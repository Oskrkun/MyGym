# 🏋️ MiGym

App web de seguimiento de entrenamiento y progreso personal. 100% en el navegador, sin backend, sin cuentas, sin internet. Los datos se guardan en `localStorage` y se exportan/importan como un único archivo JSON.

---

## ✨ Características

**🏋️ Rutina (usuario)**
- Ejercicios por día con GIF, series y peso editable.
- Autocompletado de pesos desde la última sesión del mismo día (con hint *"Última vez: X kg"*).
- Temporizador de descanso con vibración.
- Barra de progreso diaria y tarjeta de felicitación al 100%.
- Cardio con tiempo, velocidad e inclinación.

**📊 Progreso**
- Perfil colapsable: nombre, apodo, sexo, altura, año de nacimiento y objetivo.
- Edad calculada automáticamente.
- Registro de peso corporal con fecha, kg y nota.
- Gráfica de evolución en SVG puro (sin librerías).
- Heatmap navegable por mes con detalle por día (peso + rutina).
- Mensaje contextual según el objetivo (bajar / mantener / subir).

**⚙️ Admin**
- Crear, editar y eliminar rutinas.
- Configurar series, reps y peso sugerido.
- Tiempo de descanso global.
- Exportar / importar todo el progreso en JSON.
- 
---

## 🚀 Cómo usarla

No requiere instalación. Abrí `index.html` en el navegador y listo.

**Primeros pasos:**
1. Entrá en **⚙️ Admin** y creá tus rutinas.
2. Volvé a **🏋️ Rutina** y completá tus series.
3. Cuando te pese, andá a **📊 Progreso → ⚖️ Registrar peso**.
4. Para migrar de dispositivo, usá **📥 Respaldo (JSON)**.
