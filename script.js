/* =========================================================
   Portafolio Catalina Figueroa — animaciones
   ---------------------------------------------------------
   1. Aparición de elementos al hacer scroll
   2. Nombre tipo máquina de escribir
   3. Texto que se "revuelve" al pasar el mouse por botones
   4. Ornamentos que se forman punto por punto
   5. Parallax suave en los ornamentos (solo desktop)
   6. Ver imágenes en grande (páginas de proyecto)

   Ojo: el punto 4 necesita abrir la página con un servidor
   (Live Server en VS Code). Con doble clic (file://) el
   navegador no deja leer la imagen y el ornamento se
   muestra completo, sin animación.

   Si la persona tiene activado "reducir movimiento" en su
   sistema, solo se activa la vista de imágenes en grande.
   ========================================================= */

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esMobile = () => window.matchMedia("(max-width: 700px)").matches;


/* ---------- 1. Aparición al hacer scroll ---------- */

function iniciarAparicion() {
  // Todo lo que está posicionado en el lienzo, menos los contenedores,
  // los ornamentos de fondo y el botón fijo de volver
  const elementos = document.querySelectorAll(
    ".lienzo .pos:not(header):not(section):not(footer):not(.ornamento):not(.volver)"
  );

  const observador = new IntersectionObserver((entradas) => {
    // los que entran juntos aparecen uno detrás de otro
    let orden = 0;
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      el.style.animationDelay = `${orden * 90}ms`;
      el.classList.add("visible");
      orden++;
      observador.unobserve(el); // aparece una sola vez
    });
  }, { threshold: 0.15 });

  elementos.forEach((el) => {
    el.classList.add("revelar");
    observador.observe(el);
  });
}


/* ---------- 2. Nombre tipo máquina de escribir ---------- */

function escribirNombre() {
  const partes = document.querySelectorAll(".home .t-nombre");
  if (!partes.length) return;

  // el h1 conserva el texto completo para lectores de pantalla
  const h1 = partes[0].closest("h1");
  h1.setAttribute("aria-label", "Portafolio Catalina Figueroa");
  h1.querySelectorAll("span").forEach((s) => s.setAttribute("aria-hidden", "true"));

  const textos = [...partes].map((p) => p.textContent);
  partes.forEach((p) => (p.textContent = ""));

  let parte = 0;
  let letra = 0;
  const cursor = document.createElement("span");
  cursor.className = "cursor-escritura";

  function siguiente() {
    const el = partes[parte];
    letra++;
    el.textContent = textos[parte].slice(0, letra);
    el.appendChild(cursor);

    if (letra < textos[parte].length) {
      setTimeout(siguiente, 90);
    } else if (parte < partes.length - 1) {
      parte++;
      letra = 0;
      setTimeout(siguiente, 250);
    } else {
      // al terminar, el cursor parpadea un rato y desaparece
      setTimeout(() => cursor.remove(), 2400);
    }
  }

  setTimeout(siguiente, 400);
}


/* ---------- 3. Texto que se revuelve en botones y tarjetas ---------- */

const SIMBOLOS = "!<>-_/[]{}=+*^?#01";

function revolver(el) {
  if (el.dataset.revolviendo) return;
  const original = el.dataset.texto || el.textContent;
  el.dataset.texto = original;
  el.dataset.revolviendo = "1";

  const duracion = 450; // milisegundos
  const inicio = performance.now();

  function cuadro(ahora) {
    const avance = Math.min((ahora - inicio) / duracion, 1);
    // las letras se van "fijando" de izquierda a derecha
    const fijas = Math.floor(avance * original.length);
    el.textContent = [...original]
      .map((c, i) => (i < fijas || c === " " ? c : SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)]))
      .join("");

    if (avance < 1) {
      requestAnimationFrame(cuadro);
    } else {
      el.textContent = original;
      delete el.dataset.revolviendo;
    }
  }

  requestAnimationFrame(cuadro);
}

function iniciarRevolver() {
  // en las tarjetas se revuelve solo el nombre (no la categoría de mobile)
  const objetivos = document.querySelectorAll(".boton, .tarjeta");
  objetivos.forEach((boton) => {
    const texto = boton.querySelector(".tarjeta__nombre") || boton;
    boton.addEventListener("mouseenter", () => revolver(texto));
    boton.addEventListener("focus", () => revolver(texto));
  });
}


/* ---------- 4. Ornamentos que se forman punto por punto ---------- */

// Busca los puntos de una imagen: cada grupo de píxeles pintados que
// se tocan entre sí es un punto. Devuelve el rectángulo de cada uno.
function buscarPuntos(img) {
  const ancho = img.naturalWidth;
  const alto = img.naturalHeight;
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  ctx.drawImage(img, 0, 0);
  // si la página se abre sin servidor (file://) esta línea falla
  const alfa = ctx.getImageData(0, 0, ancho, alto).data;

  const visto = new Uint8Array(ancho * alto);
  const puntos = [];
  const pila = [];

  for (let i = 0; i < ancho * alto; i++) {
    if (visto[i] || alfa[i * 4 + 3] < 40) continue;
    // recorre todos los píxeles conectados a este (un punto)
    let x0 = ancho, y0 = alto, x1 = 0, y1 = 0;
    pila.push(i);
    visto[i] = 1;
    while (pila.length) {
      const p = pila.pop();
      const x = p % ancho;
      const y = (p - x) / ancho;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const v of [p - 1, p + 1, p - ancho, p + ancho]) {
        if (v < 0 || v >= ancho * alto || visto[v]) continue;
        if (Math.abs((v % ancho) - x) > 1) continue; // no saltar de borde a borde
        if (alfa[v * 4 + 3] < 40) continue;
        visto[v] = 1;
        pila.push(v);
      }
    }
    puntos.push({ x: x0 - 1, y: y0 - 1, w: x1 - x0 + 3, h: y1 - y0 + 3 });
  }
  return puntos;
}

const puntosPorImagen = {}; // la voluta se repite: se analiza una sola vez

function formarOrnamento(img) {
  let puntos;
  try {
    puntos = puntosPorImagen[img.src] || (puntosPorImagen[img.src] = buscarPuntos(img));
  } catch (error) {
    // sin servidor no se puede leer la imagen: se muestra normal
    img.classList.remove("ornamento--pendiente");
    return;
  }

  // el canvas toma el lugar de la imagen, con la misma posición y tamaño
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.className = img.className.replace("ornamento--pendiente", "");
  canvas.style.cssText = img.style.cssText;
  canvas.setAttribute("aria-hidden", "true");
  img.replaceWith(canvas);
  const ctx = canvas.getContext("2d");

  // orden: de arriba hacia abajo, con algo de azar para que se vea orgánico
  const orden = puntos
    .map((p) => ({ ...p, clave: p.y + Math.random() * 120 }))
    .sort((a, b) => a.clave - b.clave);

  const duracion = 1800; // milisegundos para formar todo el ornamento
  const inicio = performance.now();
  let dibujados = 0;

  function cuadro(ahora) {
    const avance = Math.min((ahora - inicio) / duracion, 1);
    const meta = Math.floor(avance * orden.length);
    for (; dibujados < meta; dibujados++) {
      const p = orden[dibujados];
      // copia exactamente ese punto desde la imagen original
      ctx.drawImage(img, p.x, p.y, p.w, p.h, p.x, p.y, p.w, p.h);
    }
    if (avance < 1) requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
}

function iniciarOrnamentos() {
  const ornamentos = document.querySelectorAll("img.ornamento");
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      observador.unobserve(entrada.target);
      const img = entrada.target;
      if (img.complete) formarOrnamento(img);
      else img.addEventListener("load", () => formarOrnamento(img), { once: true });
    });
  }, { threshold: 0.1 });

  ornamentos.forEach((img) => {
    img.classList.add("ornamento--pendiente"); // oculto hasta que se forme
    observador.observe(img);
  });
}


/* ---------- 5. Parallax en los ornamentos ---------- */

function iniciarParallax() {
  if (!document.querySelector(".ornamento")) return;

  // velocidad de cada ornamento, en el orden del HTML:
  // flor, marco, guarda, voluta, voluta, voluta.
  // El marco va en 0 para que siga enmarcando el texto de "Sobre mí".
  const velocidades = [0.08, 0, 0.1, -0.08, 0.1, -0.06];
  let pendiente = false;

  function mover() {
    const centroPantalla = window.scrollY + window.innerHeight / 2;
    // se buscan cada vez porque las imágenes se cambian por canvas
    document.querySelectorAll(".ornamento").forEach((orn, i) => {
      if (esMobile()) {
        orn.style.translate = "";
        return;
      }
      // cuando el ornamento está al centro de la pantalla queda en su
      // posición exacta del diseño; arriba o abajo se desplaza un poco
      const centroOrnamento = orn.offsetTop + orn.offsetHeight / 2;
      const bruto = (centroPantalla - centroOrnamento) * (velocidades[i] || 0);
      const desplazamiento = Math.max(-120, Math.min(120, bruto)); // tope de 120 px
      orn.style.translate = `0 ${desplazamiento.toFixed(1)}px`;
    });
    pendiente = false;
  }

  window.addEventListener("scroll", () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(mover);
    }
  }, { passive: true });
  window.addEventListener("resize", mover);
  mover();
}


/* ---------- 6. Ver imágenes en grande ---------- */

function iniciarVisor() {
  const fotos = document.querySelectorAll(".proyecto .foto");
  if (!fotos.length) return;

  // se arma una sola vez y se reutiliza
  const visor = document.createElement("div");
  visor.className = "visor";
  visor.setAttribute("role", "dialog");
  visor.setAttribute("aria-modal", "true");
  visor.setAttribute("aria-label", "Imagen ampliada");
  visor.innerHTML = `
    <button class="visor__cerrar boton" type="button" aria-label="Cerrar">✕</button>
    <img class="visor__imagen" alt="">
  `;
  document.body.appendChild(visor);

  const imagenGrande = visor.querySelector(".visor__imagen");
  const botonCerrar = visor.querySelector(".visor__cerrar");
  let ultimaFoto = null;

  function abrir(foto) {
    ultimaFoto = foto;
    imagenGrande.src = foto.src;
    imagenGrande.alt = foto.alt;
    visor.classList.add("abierto");
    document.body.style.overflow = "hidden"; // evita que se mueva la página de fondo
    botonCerrar.focus();
  }

  function cerrar() {
    visor.classList.remove("abierto");
    document.body.style.overflow = "";
    if (ultimaFoto) ultimaFoto.focus();
  }

  fotos.forEach((foto) => {
    // también se puede abrir con el teclado (Tab + Enter)
    foto.tabIndex = 0;
    foto.setAttribute("role", "button");
    foto.addEventListener("click", () => abrir(foto));
    foto.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrir(foto);
      }
    });
  });

  visor.addEventListener("click", (e) => {
    if (e.target !== imagenGrande) cerrar(); // clic fuera de la imagen o en la ✕
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && visor.classList.contains("abierto")) cerrar();
  });
}


/* ---------- Arranque ---------- */

iniciarVisor();

if (!reducirMovimiento) {
  iniciarAparicion();
  escribirNombre();
  iniciarRevolver();
  iniciarOrnamentos();
  iniciarParallax();
}