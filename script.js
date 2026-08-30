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
               PÉTALOS FLOTANTES — sobre la imagen de fondo del hero
               Pequeños pétalos en tonos florales caen y se mecen sobre
               la imagen. Se omiten con "reduce motion" y se limpian al
               revertir este contexto.
            ========================= */

            const petalLayer = document.getElementById("hero-petals");

            if (petalLayer && !isReducedMotion) {

                const petalPalette = ["#f4a0b8", "#f7c8da", "#c8a8e9", "#bfe3c0", "#ffe9b8", "#fdf0f5"];

                const petalCount = window.innerWidth < 700 ? 12 : 26;

                for (let index = 0; index < petalCount; index++) {

                    const petal = document.createElement("span");

                    petal.className = "petal";

                    const size = gsap.utils.random(6, 16);

                    petal.style.width = size + "px";

                    petal.style.height = (size * gsap.utils.random(1.15, 1.5)).toFixed(1) + "px";

                    petal.style.left = gsap.utils.random(0, 100) + "%";

                    petal.style.background = gsap.utils.random(petalPalette);

                    petalLayer.appendChild(petal);

                    const fallDistance = petalLayer.clientHeight * gsap.utils.random(.9, 1.2);

                    gsap.to(petal, {

                        keyframes: {

                            y: [-60, fallDistance],

                            x: [0, gsap.utils.random(-140, 140)],

                            rotation: [0, gsap.utils.random(-260, 260)],

                            opacity: [0, gsap.utils.random(.35, .8), gsap.utils.random(.35, .8), 0]

                        },

                        ease: "none",

                        duration: gsap.utils.random(11, 22),

                        delay: gsap.utils.random(0, 12),

                        repeat: -1

                    });

                }

            }


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
                        document.querySelectorAll("a, .project, .skill");


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
               SCROLL REVEAL (resto de elementos con clase "reveal")
               Sin cambios de fondo respecto a la versión anterior.
            ========================= */

            const revealElements = gsap.utils.toArray(".reveal");


            if (isReducedMotion) {

                gsap.set(revealElements, { opacity: 1, y: 0 });

            } else {

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

            }



            /* =========================
               ABOUT — TIPEO letra a letra
               El título y los dos párrafos de "about" se escriben de
               forma secuencial cuando la sección entra en pantalla.
            ========================= */

            const aboutHeading = document.querySelector(".statement-title");

            const aboutCopies = gsap.utils.toArray(".about-copy");


            if (!isReducedMotion && (aboutHeading || aboutCopies.length)) {

                const aboutTargets = [aboutHeading, ...aboutCopies].filter(Boolean);

                const typingTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".statement",
                        start: "top 78%",
                        once: true
                    }
                });

                aboutTargets.forEach((target, index) => {

                    const split = SplitText.create(target, {
                        type: index === 0 ? "lines, chars" : "chars",
                        charsClass: "typing-char"
                    });

                    aboutSplits.push(split);

                    gsap.set(split.chars, { opacity: 0 });

                    typingTimeline.to(split.chars, {
                        opacity: 1,
                        duration: .01,
                        ease: "none",
                        stagger: index === 0 ? .045 : .022
                    });

                });

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
               EDUCACIÓN — letras dispersas que se ordenan
               Los títulos muestran sus caracteres desordenados y
               esparcidos; al entrar en pantalla cada letra vuelve a
               su sitio con un rebote elástico.
            ========================= */

            const eduTitles = gsap.utils.toArray(".edu-row h3");


            if (eduTitles.length && !isReducedMotion) {

                eduTitles.forEach((title) => {

                    const split = SplitText.create(title, {
                        type: "chars",
                        charsClass: "edu-char"
                    });

                    eduSplits.push(split);

                    gsap.set(split.chars, {

                        opacity: 0,

                        x: () => gsap.utils.random(-70, 70),
                        y: () => gsap.utils.random(-25, 25),

                        rotate: () => gsap.utils.random(-130, 130),

                        scale: () => gsap.utils.random(.5, 1.7),

                        filter: "blur(3px)"

                    });

                    gsap.to(split.chars, {

                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        filter: "blur(0px)",

                        duration: 1.2,
                        ease: "elastic.out(1, .45)",

                        stagger: {
                            each: .035,
                            from: "random"
                        },

                        scrollTrigger: {
                            trigger: title,
                            start: "top 88%",
                            once: true
                        }

                    });

                });

            }



            /* =========================
               CONTACT — caos que se ordena, con personalidad por letra
               (la animación que antes era el intro del hero): cada
               carácter arranca disperso en el aire y converge a su sitio
               con estilos distintos (rebote elástico, frenazo seco,
               overshoot, caída pesada) al entrar en pantalla.
            ========================= */

            const contactHeading = document.querySelector(".contact-title");


            if (contactHeading) {

                if (isReducedMotion) {

                    gsap.set(contactHeading, { opacity: 1 });

                } else {

                    const split = SplitText.create(contactHeading, {
                        type: "lines, chars",
                        charsClass: "contact-char"
                    });

                    contactSplits.push(split);

                    gsap.set(contactHeading, { opacity: 1 });

                    const chars = split.chars;

                    // Estado inicial: dispersión aleatoria compartida por
                    // todas las letras (esto define el "caos" del que parten).
                    gsap.set(chars, {

                        opacity: 0,

                        x: () => gsap.utils.random(-260, 260),
                        y: () => gsap.utils.random(-180, 180),

                        rotate: () => gsap.utils.random(-140, 140),
                        rotateX: () => gsap.utils.random(-90, 90),
                        rotateY: () => gsap.utils.random(-90, 90),

                        scale: () => gsap.utils.random(0.25, 2.1),

                        filter: "blur(5px)"

                    });

                    // Cuatro "personalidades" de llegada.
                    const variants = [

                        { ease: "elastic.out(1, .55)", duration: 1.5 },   // rebote
                        { ease: "expo.out",            duration: 1  },   // frenazo seco
                        { ease: "back.out(2.4)",       duration: 1.25 },   // overshoot
                        { ease: "power4.out",          duration: 1.45 }    // caída pesada

                    ];

                    // Baraja los chars (Fisher-Yates) antes de repartirlos
                    // entre variantes.
                    const shuffled = [...chars];

                    for (let i = shuffled.length - 1; i > 0; i--) {

                        const j = Math.floor(Math.random() * (i + 1));

                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];

                    }

                    const groups = variants.map(() => []);

                    shuffled.forEach((char, index) => {

                        groups[index % variants.length].push(char);

                    });

                    groups.forEach((group, index) => {

                        if (!group.length) return;

                        const { ease, duration } = variants[index];

                        gsap.to(group, {

                            opacity: 1,
                            x: 0,
                            y: 0,
                            rotate: 0,
                            rotateX: 0,
                            rotateY: 0,
                            scale: 1,
                            filter: "blur(0px)",

                            duration,
                            ease,

                            stagger: {
                                each: .04,
                                from: "random"
                            },

                            // Pequeño desfase aleatorio por grupo para que
                            // los cuatro estilos no arranquen a la vez.
                            delay: .15 + gsap.utils.random(0, .12),

                            scrollTrigger: {
                                trigger: contactHeading,
                                start: "top 80%",
                                once: true
                            }

                        });

                    });

                }

            }



            /* =========================
               CONTACT INFO — email y teléfono dinámicos
               Se escriben letra a letra al llegar a la sección, y los
               iconos de redes entran con un rebote elástico.
            ========================= */

            const contactLinks = gsap.utils.toArray(".contact-info a");


            if (contactLinks.length) {

                if (isReducedMotion) {

                    gsap.set(contactLinks, { autoAlpha: 1 });

                } else {

                    const typingTimeline = gsap.timeline({
                        delay: .3,
                        scrollTrigger: {
                            trigger: ".contact-bottom",
                            start: "top 94%",
                            once: true
                        }
                    });

                    contactLinks.forEach((link) => {

                        const split = SplitText.create(link, {
                            type: "chars",
                            charsClass: "contact-char"
                        });

                        contactSplits.push(split);

                        gsap.set(split.chars, { autoAlpha: 0 });

                        typingTimeline.to(split.chars, {
                            autoAlpha: 1,
                            duration: .01,
                            ease: "none",
                            stagger: .04
                        });

                    });

                }

            }


            const socialIcons = gsap.utils.toArray(".socials a");


            if (socialIcons.length) {

                if (isReducedMotion) {

                    gsap.set(socialIcons, { autoAlpha: 1 });

                } else {

                    gsap.from(socialIcons, {

                        autoAlpha: 0,
                        scale: .4,
                        rotate: -25,
                        duration: .6,
                        ease: "elastic.out(1, .5)",
                        stagger: .12,
                        delay: .2,

                        scrollTrigger: {
                            trigger: ".contact-bottom",
                            start: "top 92%",
                            once: true
                        }

                    });

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

                if (petalLayer) petalLayer.innerHTML = "";

                aboutSplits.forEach((split) => split.revert());

                eduSplits.forEach((split) => split.revert());

                contactSplits.forEach((split) => split.revert());

            };

        }

    );

}