// ====================================================================================
// PARTE 1: CONFIGURACIÓN INICIAL (CONSTANTES, ESCENA, CÁMARA, LUZ)
// ====================================================================================

// --- DIMENSIONES DEL PLANO ---
const TAMAÑO_MUNDO = 40; 
const ALTURA_BASE_TERRENO = 2; 
const ALTURA_MURO = 8;
const ALTURA_TORRE = 15;
const ALTURA_TORRE_CENTRAL = 25;
const LONGITUD_PUENTE = 12; // Longitud del puente de acceso
const planoFortaleza = [];

// --- MAPA DE MATERIALES (Código: Color) ---
const materiales = {
    1: { color: 0x1A1A1A, name: 'Muro_Negro' }, // Muros (Negro)
    2: { color: 0x1A1A1A, name: 'Torre_Negra' }, // Torres de esquina (Negro)
    3: { color: 0x333333, name: 'Terreno_Rocoso' }, // Base del suelo y Puente (Gris Oscuro)
    4: { color: 0x0D0D0D, name: 'Torre_Central' }, // Torre Principal (Negro Intenso)
    5: { color: 0xFFFFFF, name: 'Dientes_Ojo' } // Dientes/Ojo (Blanco)
};

// Crear la Escena (el mundo) y el Ambiente Oscuro
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 1, 100);

// Crear la Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Posicionar la cámara para ver la fortaleza desde arriba/lejos
camera.position.set(TAMAÑO_MUNDO * 1.5, ALTURA_TORRE_CENTRAL * 0.7, TAMAÑO_MUNDO * 1.5); 

// Crear el Renderer (dibuja el 3D en la pantalla)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffccaa, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);


// ====================================================================================
// PARTE 2: CONSTRUCCIÓN DE LA MATRIZ (EL PLANO DE BLOQUES)
// ====================================================================================

function inicializarYConstruirPlano() {
    const alto_total = ALTURA_TORRE_CENTRAL + 1;
    const fin = TAMAÑO_MUNDO - 5;
    const inicio = 5; // Coordenada Z del muro frontal
    const centro_x = TAMAÑO_MUNDO / 2;

    // 1. Inicializar matriz (Crear el array 3D)
    for (let x = 0; x < TAMAÑO_MUNDO; x++) {
        planoFortaleza[x] = [];
        for (let y = 0; y < alto_total; y++) {
            planoFortaleza[x][y] = [];
            for (let z = 0; z < TAMAÑO_MUNDO; z++) {
                planoFortaleza[x][y][z] = (y < ALTURA_BASE_TERRENO) ? 3 : 0;
            }
        }
    }

    // 2. MURALLAS EXTERIORES
    for (let x = inicio; x < fin; x++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO; y++) {
            planoFortaleza[x][y][inicio] = 1; // Norte (Muro Frontal)
            planoFortaleza[x][y][fin - 1] = 1; // Sur
        }
    }
    for (let z = inicio; z < fin; z++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO; y++) {
            planoFortaleza[fin - 1][y][z] = 1; // Este
            planoFortaleza[inicio][y][z] = 1; // Oeste
        }
    }

    // 3. TORRES DE ESQUINA (3x3)
    const torre_size = 3;
    const torre_alt = ALTURA_BASE_TERRENO + ALTURA_TORRE;
    
    const buildTower = (x_start, z_start) => {
        for (let x = x_start; x < x_start + torre_size; x++) {
            for (let z = z_start; z < z_start + torre_size; z++) {
                for (let y = ALTURA_BASE_TERRENO; y < torre_alt; y++) {
                    planoFortaleza[x][y][z] = 2; 
                }
            }
        }
    };
    buildTower(inicio - 2, inicio - 2); 
    buildTower(fin - 1, inicio - 2);     
    buildTower(inicio - 2, fin - 1);     
    buildTower(fin - 1, fin - 1);         

    // 4. HUECO DE LA ENTRADA (Muro Frontal)
    for (let x = centro_x - 3; x <= centro_x + 3; x++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO + 2; y++) {
            planoFortaleza[x][y][inicio] = 0; 
        }
    }

    // 5. DIENTES Y MARCO BLANCO (CÓDIGO 5)
    const altura_dientes = ALTURA_BASE_TERRENO + ALTURA_MURO + 2;

    // Marco superior de la boca (horizontal)
    for (let x = centro_x - 4; x <= centro_x + 4; x++) {
        planoFortaleza[x][altura_dientes][inicio] = 5;
    }
    // Dientes inferiores 
    for (let x = centro_x - 3; x <= centro_x + 3; x++) {
        planoFortaleza[x][ALTURA_BASE_TERRENO + 2][inicio] = 5;
    }
    planoFortaleza[centro_x][ALTURA_BASE_TERRENO + 1][inicio] = 5; 


    // 6. TORRE CENTRAL (CÓDIGO 4 - Base y Cono)
    const centro_z = TAMAÑO_MUNDO - 10; 
    const centro_x_torre = TAMAÑO_MUNDO / 2 + 5; 

    // Base de la Torre Central (10x10)
    for (let x = centro_x_torre - 5; x < centro_x_torre + 5; x++) {
        for (let z = centro_z - 5; z < centro_z + 5; z++) {
            for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + 10; y++) {
                planoFortaleza[x][y][z] = 4;
            }
        }
    }

    // Forma cónica/espiralada de la Torre Central
    for (let y = ALTURA_BASE_TERRENO + 10; y < ALTURA_TORRE_CENTRAL; y++) {
        const radio = 5 - Math.floor((y - (ALTURA_BASE_TERRENO + 10)) / 2);
        
        for (let x = centro_x_torre - radio; x < centro_x_torre + radio; x++) {
            for (let z = centro_z - radio; z < centro_z + radio; z++) {
                if (x >= 0 && x < TAMAÑO_MUNDO && z >= 0 && z < TAMAÑO_MUNDO) {
                     planoFortaleza[x][y][z] = 4;
                }
            }
        }
        // Púa de color claro en la cima
        if (y === ALTURA_TORRE_CENTRAL - 1) {
            planoFortaleza[centro_x_torre][y][centro_z] = 5; 
        }
    }

    // 7. 👁️ AÑADIR EL GRAN OJO (CÓDIGO NUEVO - Forma de Diamante/Ovalada en la Torre Central)
    const y_ojo = ALTURA_BASE_TERRENO + 18; // Altura donde irá el centro del ojo
    const radio_ojo_x = 3;
    const radio_ojo_y = 2;

    for (let y = y_ojo - radio_ojo_y; y <= y_ojo + radio_ojo_y; y++) {
        const ancho = radio_ojo_x - Math.abs(y - y_ojo); // Reduce el ancho para forma ovalada
        for (let x = centro_x_torre - ancho; x <= centro_x_torre + ancho; x++) {
            // El ojo se proyecta en el centro de la torre
            planoFortaleza[x][y][centro_z - 5] = 5; // Bloque blanco 5 en la pared frontal de la torre
        }
    }
    
    // 8. 🌉 AÑADIR EL PUENTE DE ACCESO (CÓDIGO NUEVO - Se extiende desde la boca)
    const ancho_puente = 7;
    const altura_puente = ALTURA_BASE_TERRENO; 
    
    for (let z = inicio - LONGITUD_PUENTE; z < inicio; z++) {
        for (let x = centro_x - Math.floor(ancho_puente / 2); x <= centro_x + Math.floor(ancho_puente / 2); x++) {
            planoFortaleza[x][altura_puente][z] = 3; // Bloque 3 (Terreno oscuro)
            planoFortaleza[x][altura_puente - 1][z] = 3; // Refuerzo bajo el puente
        }
    }
    
    // Añadir picos/púas decorativas a los lados del puente (Código 5)
    for (let z = inicio - LONGITUD_PUENTE; z < inicio - 1; z += 2) {
