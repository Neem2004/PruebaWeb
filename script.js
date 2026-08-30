/* =========================
   GSAP SETUP
   Si algún CDN falla (sin red, bloqueador, etc.) evitamos que un error
   de "gsap is not defined" rompa el resto de la página, y forzamos
   visible cualquier elemento que dependa de JS para mostrarse.
========================= */

if (typeof gsap === "undefined") {

    console.warn("GSAP no se cargó: se omiten las animaciones y se muestra el contenido sin animar.");

    document
        .querySelectorAll(".reveal, .statement-title, .contact-title")
        .forEach((element) => {

            element.style.opacity = 1;
            element.style.transform = "none";

        });

} else {


    gsap.registerPlugin(ScrollTrigger, SplitText);


    const cursor = document.querySelector(".cursor");

    const circleLink = document.querySelector(".circle-link");

    const projectPreview = document.querySelector(".project-preview");

    const projectPreviewImg = projectPreview ? projectPreview.querySelector("img") : null;

    const projects = gsap.utils.toArray(".project");



    /* =========================
       MATCHMEDIA
       Un solo lugar para las dos condiciones que gobiernan casi todo
       el archivo. Si el usuario cambia de preferencia de movimiento
       (o conecta/desconecta un mouse) en caliente, GSAP vuelve a
       ejecutar este callback y revierte automáticamente los tweens y
       ScrollTriggers de la ejecución anterior; la función que
       retornamos al final limpia lo que GSAP no sabe revertir solo
       (listeners de DOM y los splits de texto).
    ========================= */

    const mm = gsap.matchMedia();


    mm.add(

        {
            isFinePointer: "(hover: hover) and (pointer: fine)",
            isReducedMotion: "(prefers-reduced-motion: reduce)"
        },

        (context) => {

            const { isFinePointer, isReducedMotion } = context.conditions;

            const cleanupFns = [];


            /* =========================
               CURSOR
            ========================= */

            if (cursor) {

                if (isFinePointer && !isReducedMotion) {

                    const xTo = gsap.quickTo(cursor, "left", { duration: .15, ease: "power3" });
                    const yTo = gsap.quickTo(cursor, "top", { duration: .15, ease: "power3" });


                    const onMouseMove = (event) => {

                        xTo(event.clientX);

                        yTo(event.clientY);

                    };


                    window.addEventListener("mousemove", onMouseMove);


                    const interactiveElements =
                        document.querySelectorAll("a, .project");


                    const onEnterInteractive = () => gsap.to(cursor, { width: 42, height: 42, duration: .2 });
                    const onLeaveInteractive = () => gsap.to(cursor, { width: 18, height: 18, duration: .2 });


                    interactiveElements.forEach((element) => {

                        element.addEventListener("mouseenter", onEnterInteractive);
                        element.addEventListener("mouseleave", onLeaveInteractive);

                    });


                    cleanupFns.push(() => {

                        window.removeEventListener("mousemove", onMouseMove);

                        interactiveElements.forEach((element) => {

                            element.removeEventListener("mouseenter", onEnterInteractive);
                            element.removeEventListener("mouseleave", onLeaveInteractive);

                        });

                    });

                } else {

                    cursor.style.display = "none";

                }

            }

           /* =========================
                LOGO — volteo letra por letra, ida y vuelta
                Cada letra rota 180° y regresa; la ola va de izquierda a
                derecha y luego de derecha a izquierda, suave.
             ========================= */

            const logo = document.querySelector(".logo");

            if (logo && !isReducedMotion) {

                /* Separa el logo en letras (ignorando los espacios) para
                   poder voltear cada una por separado. */
                const chars = [...logo.textContent].filter((c) => c.trim() !== "");

                logo.textContent = "";

                chars.forEach((char) => {

                    const span = document.createElement("span");

                    span.textContent = char;

                    span.style.display = "inline-block";

                    span.style.transformStyle = "preserve-3d";

                    span.style.willChange = "transform";

                    logo.appendChild(span);

                });

                /* Timeline que se repite: primero la ola va de izquierda a
                   derecha rota a 180°, y la pasada de regreso la deshace
                   de derecha a izquierda, con un ease suave. */
                const spans = logo.querySelectorAll("span");

                const leftToRight = [...spans];

                const rightToLeft = [...spans].reverse();

                const tl = gsap.timeline({ repeat: -1, repeatDelay: .55 });

                tl.to(leftToRight, {

                    rotateY: 180,
                    duration: .7,
                    ease: "sine.inOut",
                    stagger: .12,
                    transformPerspective: 400,

                }).to(rightToLeft, {

                    rotateY: 0,
                    duration: .7,
                    ease: "sine.inOut",
                    stagger: .12,

                });

            }

/* =========================
               TÍTULOS GRANDES — visibilidad base
               El "statement-title" se escribe con tipeo (bloque ABOUT) y
               el "contact-title" se construye (bloque CONTACT); acá solo
               garantizamos que sean visibles con movimiento reducido.
            ========================= */

            const aboutSplits = [];

            const eduSplits = [];

            const contactSplits = [];


            if (isReducedMotion) {

                gsap.set(".statement-title, .contact-title", { opacity: 1 });

            }



            /* =========================
               HERO — construcción caótica de "NEIYAN EUSSE."
               Las letras llegan una a una desde lugares al azar pero
               aterrizan en casillas intercambiadas (queda el texto mal
               escrito), luego se desarma por completo y finalmente se
               reconstruye letra por letra en su sitio correcto.
            ========================= */

            const heroTargets = gsap.utils.toArray(".split-hero");

            const dot = document.querySelector(".dot");

            const heroBg = document.querySelector(".hero-bg");

            let heroSplit = null;


            if (heroTargets.length) {

                if (isReducedMotion) {

                    gsap.set(heroTargets, { opacity: 1 });

                    if (dot) gsap.set(dot, { opacity: 1 });

                } else {

                    heroSplit = SplitText.create(heroTargets, {
                        type: "chars",
                        charsClass: "hero-char"
                    });

                    const chars = heroSplit.chars;

                    /* Medir el layout ANTES de transformar nada: cada rect
                       es la "casilla" donde esa letra debe quedar. */
                    const homeRects = chars.map((char) => char.getBoundingClientRect());

                    const landAt = (fromIndex, toIndex) => ({
                        x: homeRects[toIndex].left - homeRects[fromIndex].left,
                        y: homeRects[toIndex].top - homeRects[fromIndex].top
                    });

                    /* Baraja los destinos: es lo que produce el texto mal
                       escrito en el primer intento de construcción. */
                    const slotOrder = chars.map((_, index) => index);

                    for (let i = slotOrder.length - 1; i > 0; i--) {

                        const j = Math.floor(Math.random() * (i + 1));

                        [slotOrder[i], slotOrder[j]] = [slotOrder[j], slotOrder[i]];

                    }

                    // Estado inicial: invisible, cada letra en un punto al azar.
                    gsap.set(chars, {

                        opacity: 0,

                        x: () => gsap.utils.random(-520, 520),
                        y: () => gsap.utils.random(-360, 360),

                        rotate: () => gsap.utils.random(-180, 180),

                        scale: () => gsap.utils.random(.4, 1.7)

                    });

                    const buildTimeline = gsap.timeline({ delay: .2 });

                    // 1) Intento fallido: aterrizan en casillas ajenas.
                    buildTimeline.to(chars, {

                        opacity: 1,
                        scale: 1,
                        duration: .8,
                        ease: "power3.out",
                        stagger: { each: .055, from: "random" },

                        x: (index) => landAt(index, slotOrder[index]).x,
                        y: (index) => landAt(index, slotOrder[index]).y,

                        rotate: () => gsap.utils.random(-16, 16)

                    });

                    // GLITCH del fondo: sincronizado con el timeline. Se activa
                    // en cuanto el título queda mal armado y permanece durante
                    // toda la estancia en desorden y el desarme, hasta el
                    // instante exacto en que empieza a reconstruirse.
                    buildTimeline.call(() => heroBg && heroBg.classList.add("glitching"));

                    // Pausa para leer el desorden.
                    buildTimeline.to({}, { duration: .7 });

                    // 2) Desarme total: salen volando y se pierden en el aire.
                    buildTimeline.to(chars, {

                        opacity: 0,
                        scale: .6,
                        duration: .5,
                        ease: "power2.in",
                        stagger: { each: .03, from: "random" },

                        x: () => gsap.utils.random(-520, 520),
                        y: () => gsap.utils.random(-360, 360),

                        rotate: () => gsap.utils.random(-220, 220)

                    });

                    // Se quita el glitch en el mismo sitio del timeline (justo
                    // antes de la reconstrucción); la opacidad de las capas
                    // RGB cae suave por la transición CSS, sin corte seco.
                    buildTimeline.call(() => heroBg && heroBg.classList.remove("glitching"));

                    // 3) Reconstrucción correcta: vuelven a su sitio.
                    buildTimeline.to(chars, {

                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        duration: 1,
                        ease: "elastic.out(1, .5)",

                        stagger: .07

                    });

                }

            }



            /* =========================
               SCROLL REVEAL (resto de elementos con clase "reveal")
               Los subtítulos "01 — ABOUT"… se excluyen de aquí: tienen su
               propio bloque que entra justo antes que el contenido.
            ========================= */

            const revealElements = gsap.utils
                .toArray(".reveal")
                .filter((element) => !element.classList.contains("eyebrow"))
                .filter((element) => !element.matches(".statement-title, .about-copy"));


            if (isReducedMotion) {

                gsap.set(revealElements, { opacity: 1, y: 0 });

                gsap.set(".eyebrow", { autoAlpha: 1, y: 0 });

                /* Título y párrafo del About: dejan el reveal genérico y
                   viven solo del timeline de palabras; sin mover, siempre
                   visibles. */
                gsap.set(".statement-title, .about-copy", { opacity: 1, y: 0 });

            } else {

                /* Subtítulos de sección: aparecen primero, apenas la
                   sección se asoma en el scroll. El trigger va atado a
                   la sección (el padding superior los descuelga). */
                gsap.utils.toArray(".eyebrow").forEach((eyebrow) => {

                    const section = eyebrow.parentElement;

                    gsap.fromTo(eyebrow, { autoAlpha: 0, y: 10 }, {

                        autoAlpha: 1,
                        y: 0,
                        duration: .45,
                        ease: "power2.out",

                        scrollTrigger: {
                            trigger: section,
                            start: "top 96%",
                            once: true
                        }

                    });

                });

                revealElements.forEach((element, index) => {

                    gsap.to(element, {

                        opacity: 1,
                        y: 0,
                        duration: .9,
                        ease: "power2.out",
                        delay: (index % 5) * .07,

                        scrollTrigger: {
                            trigger: element,
                            start: "top 88%",
                            once: true
                        }

                    });

                });

/* Marquesina de skills: arranca desplazada a la derecha
                   (nada visible) y, cuando la sección entra en pantalla,
                   entra en barrido con el mismo movimiento de marquesina:
                   se desliza de derecha a izquierda sin entrada especial
                   por items, y al terminar su primera pasada se hace cargo
                   el loop CSS de siempre. */
                const skillsTrack = document.querySelector(".skills .marquee-track");

                const skillsMarquee = document.querySelector(".skills .marquee");

                if (skillsTrack && skillsMarquee) {

                    const distance = skillsMarquee.offsetWidth;

                    /* Quita el loop CSS mientras hace la pasada de entrada:
                       los transforms la manejamos a mano esos segundos. */
                    skillsTrack.style.animation = "none";

                    gsap.set(skillsTrack, { x: distance });

                    ScrollTrigger.create({

                        trigger: ".skills",
                        start: "top 75%",
                        once: true,

                        onEnter: () => {

                            /* Velocidad real del loop de la marquesina:
                               recorre medio de la pista (un juego completo
                               de 12 items) en 26 segundos. Se mide aquí,
                               con las fuentes ya cargadas, para que la
                               entrada barra a ese mismo ritmo exacto. */
                            const loopSpeed = (skillsTrack.offsetWidth / 2) / 26;

                            gsap.to(skillsTrack, {

                                x: 0,
                                duration: distance / loopSpeed,
                                ease: "none",

                                onComplete: () => {

                                    /* Traspaso al loop de marquesina normal,
                                       ya en la posición de arranque (x:0). */
                                    skillsTrack.style.animation = "marquee 26s linear infinite";

                                    skillsTrack.style.animationPlayState = "running";

                                }

                            });

                        }

                    });

                }

            }



            /* =========================
               ABOUT — entrada en orden, palabra por palabra
               Se revela en secuencia estricta: el título palabra por
               palabra, luego los párrafos palabra por palabra y al final
               la línea de frases — los tres con la misma animación:
               desvanecido + subida + desenfoque suave al entrar la
               sección en el scroll (sin efecto de tipeo).
            ========================= */

            const aboutHeading = document.querySelector(".statement-title");

            const aboutCopies = gsap.utils.toArray(".about-copy");

            const aboutPhrases = document.querySelector(".about-phrases");


            if (!isReducedMotion && (aboutHeading || aboutCopies.length || aboutPhrases)) {

                const entranceTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".statement",
                        start: "top 78%",
                        once: true
                    }
                });

                /* Animación que comparten los tres grupos: misma suavidad,
                   mismos tiempos, mismo efecto de desenfoque. */
                const entranceConfig = {

                    autoAlpha: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: .55,
                    ease: "power2.out",
                    stagger: .12

                };

                const entranceFrom = { autoAlpha: 0, y: 14, filter: "blur(4px)" };

                /* El título y los párrafos llevan la clase .reveal (opacity 0
                   y translateY iniciales). Como ya no los toca el reveal
                   genérico — para evitar que dos animaciones chocaron —, y
                   aquí solo se animan las PALABRAS, el contenedor queda
                   quieto y plenamente visible. */
                if (aboutHeading) gsap.set(aboutHeading, { opacity: 1, y: 0 });

                aboutCopies.forEach((copy) => gsap.set(copy, { opacity: 1, y: 0 }));

                /* 1) Título — palabra por palabra. */
                if (aboutHeading) {

                    const split = SplitText.create(aboutHeading, {
                        type: "words",
                        wordsClass: "about-word"
                    });

                    aboutSplits.push(split);

                    gsap.set(split.words, entranceFrom);

                    entranceTimeline.to(split.words, entranceConfig);

                }

                /* 2) Párrafos — palabra por palabra, después del título. El texto
                   es más largo, así que cada palabra avanza más rápido
                   para terminar al mismo tiempo que el título. */
                aboutCopies.forEach((copy) => {

                    const split = SplitText.create(copy, {
                        type: "words",
                        wordsClass: "about-word"
                    });

                    aboutSplits.push(split);

                    gsap.set(split.words, entranceFrom);

                    entranceTimeline.to(split.words, {

                        ...entranceConfig,
                        stagger: .022

                    });

                });

                /* 3) Línea de frases — al final, después de las dos
                   anteriores, con la misma animación. */
                if (aboutPhrases) {

                    const split = SplitText.create(aboutPhrases, {
                        type: "words",
                        wordsClass: "about-word"
                    });

                    aboutSplits.push(split);

                    gsap.set(split.words, entranceFrom);

                    entranceTimeline.to(split.words, entranceConfig);

                }

            }



            /* =========================
               PROYECTOS — entrada alternada
               Proyecto 1 entra por la izquierda, 2 por la derecha,
               3 por la izquierda... y así sucesivamente.
            ========================= */

            const projectItems = gsap.utils.toArray(".project");


            if (projectItems.length && !isReducedMotion) {

                projectItems.forEach((project, index) => {

                    const fromLeft = index % 2 === 0;

                    gsap.fromTo(project, {

                        x: fromLeft ? -90 : 90,
                        opacity: 0

                    }, {

                        x: 0,
                        opacity: 1,
                        duration: 1.1,
                        ease: "power3.out",

                        scrollTrigger: {
                            trigger: project,
                            start: "top 92%",
                            once: true
                        }

                    });

                });

            }



            /* =========================
               CONTACT — entrada única y armoniosa
               Título, correo/teléfono, iconos de redes y la araña entran
               con el MISMO lenguaje visual (desvanecido suave, onda letra
               a letra) a medida que la sección aparece en el scroll.
            ========================= */

            const contactHeading = document.querySelector(".contact-title");

            const contactLinks = gsap.utils.toArray(".contact-info a");

            const socialIcons = gsap.utils.toArray(".socials a");

            const spiderContact = document.querySelector(".spider-photo");


            if (contactHeading || contactLinks.length || socialIcons.length || spiderContact) {

                if (isReducedMotion) {

                    gsap.set([contactHeading, contactLinks, socialIcons], { opacity: 1 });

                    if (spiderContact) gsap.set(spiderContact, { opacity: .7, y: 0 });

                } else {

                    const contactTimeline = gsap.timeline({
                        scrollTrigger: {
                            trigger: ".contact",
                            start: "top 78%",
                            once: true
                        }
                    });

                    /* Araña: aparece desde arriba deslizándose hacia su sitio, junto con
                       la llegada de la sección. Arranca bien por encima
                       para que el descenso se note de arriba hacia abajo. */
                    if (spiderContact) {

                        gsap.set(spiderContact, { opacity: 0, y: -80 });

                        contactTimeline.to(spiderContact, {

                            opacity: .7,
                            y: 0,
                            duration: 1.1,
                            ease: "power2.out"

                        });

                    }

                    /* Título: misma onda suave letra por letra del About. */
                    if (contactHeading) {

                        gsap.set(contactHeading, { opacity: 1 });

                        const split = SplitText.create(contactHeading, {
                            type: "chars",
                            charsClass: "contact-char"
                        });

                        contactSplits.push(split);

                        gsap.set(split.chars, { autoAlpha: 0, filter: "blur(3px)" });

                        contactTimeline.to(split.chars, {

                            autoAlpha: 1,
                            filter: "blur(0px)",
                            duration: .7,
                            ease: "power2.out",
                            stagger: .03

                        }, spiderContact ? "-=0.5" : 0);

                    }

                    /* Correo y teléfono: se revelan letra a letra (sin
                       efecto de tipeo), igual que el párrafo del About. */
                    contactLinks.forEach((link, index) => {

                        const split = SplitText.create(link, {
                            type: "chars",
                            charsClass: "contact-char"
                        });

                        contactSplits.push(split);

                        gsap.set(split.chars, { autoAlpha: 0 });

                        contactTimeline.to(split.chars, {

                            autoAlpha: 1,
                            duration: .45,
                            ease: "power2.out",
                            stagger: .008

                        }, index === 0 ? "-=0.7" : "-=0.5");

                    });

                    /* Iconos de redes: entran de uno en uno con el mismo
                       fade suave (cada uno es "una letra" del conjunto). */
                    if (socialIcons.length) {

                        gsap.set(socialIcons, { autoAlpha: 0, y: 14 });

                        contactTimeline.to(socialIcons, {

                            autoAlpha: 1,
                            y: 0,
                            duration: .6,
                            ease: "power2.out",
                            stagger: .12

                        }, "-=0.6");

                    }

                }

            }



            /* =========================
               BOTÓN MAGNÉTICO — la flecha circular del hero se estira
               hacia el cursor mientras lo tiene cerca y vuelve a su
               sitio con un rebote elástico al soltar. El giro de 45°
               que antes hacía el CSS ahora vive aquí, en el mismo
               tween que el desplazamiento (ver nota en style.css).
            ========================= */

            if (circleLink && isFinePointer && !isReducedMotion) {

                const strength = .4;


                const onMove = (event) => {

                    const rect = circleLink.getBoundingClientRect();

                    const relX = event.clientX - (rect.left + rect.width / 2);
                    const relY = event.clientY - (rect.top + rect.height / 2);


                    gsap.to(circleLink, {
                        x: relX * strength,
                        y: relY * strength,
                        rotate: 45,
                        duration: .4,
                        ease: "power3.out"
                    });

                };


                const onLeave = () => {

                    gsap.to(circleLink, {
                        x: 0,
                        y: 0,
                        rotate: 0,
                        duration: .6,
                        ease: "elastic.out(1, .4)"
                    });

                };


                circleLink.addEventListener("mousemove", onMove);
                circleLink.addEventListener("mouseleave", onLeave);


                cleanupFns.push(() => {

                    circleLink.removeEventListener("mousemove", onMove);
                    circleLink.removeEventListener("mouseleave", onLeave);

                });

            }



            /* =========================
               PREVIEW DE PROYECTOS
               Un solo elemento sigue al cursor con quickTo y cambia de
               imagen según el "data-preview" del artículo en hover.
               Si la imagen todavía no existe en /assets/img/, el
               <img> se oculta con "error" y queda solo el swatch de
               color de style.css (nada de ícono roto).
            ========================= */

            if (projectPreview && projects.length && isFinePointer && !isReducedMotion) {

                gsap.set(projectPreview, { xPercent: -50, yPercent: -50, scale: .85, autoAlpha: 0 });


                const xTo = gsap.quickTo(projectPreview, "x", { duration: .5, ease: "power3" });
                const yTo = gsap.quickTo(projectPreview, "y", { duration: .5, ease: "power3" });


                const onMove = (event) => {

                    xTo(event.clientX);

                    yTo(event.clientY);

                };


                window.addEventListener("mousemove", onMove);


                if (projectPreviewImg) {

                    projectPreviewImg.addEventListener("error", () => {

                        projectPreviewImg.style.opacity = 0;

                    });

                }


                const projectHandlers = [];


                projects.forEach((project) => {

                    const src = project.dataset.preview;


                    const onEnter = () => {

                        if (projectPreviewImg && src) {

                            projectPreviewImg.style.opacity = 1;
                            projectPreviewImg.src = src;

                        }


                        gsap.to(projectPreview, { autoAlpha: 1, scale: 1, duration: .4, ease: "power3.out" });

                    };


                    const onLeave = () => {

                        gsap.to(projectPreview, { autoAlpha: 0, scale: .85, duration: .3, ease: "power3.in" });

                    };


                    project.addEventListener("mouseenter", onEnter);
                    project.addEventListener("mouseleave", onLeave);


                    projectHandlers.push({ project, onEnter, onLeave });

                });


                cleanupFns.push(() => {

                    window.removeEventListener("mousemove", onMove);

                    projectHandlers.forEach(({ project, onEnter, onLeave }) => {

                        project.removeEventListener("mouseenter", onEnter);
                        project.removeEventListener("mouseleave", onLeave);

                    });

                });

            }



            /* =========================
               CLEANUP
               Se ejecuta si gsap.matchMedia() revierte este contexto
               (cambio de preferencia de movimiento o de tipo de
               puntero en caliente). GSAP ya revierte tweens y
               ScrollTriggers por su cuenta; acá solo quitamos los
               listeners de DOM y deshacemos los splits de texto.
            ========================= */

            return () => {

                cleanupFns.forEach((fn) => fn());

                if (heroSplit) heroSplit.revert();

                aboutSplits.forEach((split) => split.revert());

                eduSplits.forEach((split) => split.revert());

                contactSplits.forEach((split) => split.revert());

            };

        }

    );

}