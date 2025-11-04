// ====================================================================================
// PARTE 1: CONFIGURACIÓN INICIAL (CONSTANTES, ESCENA, CÁMARA, LUZ)
// ====================================================================================

// --- DIMENSIONES DEL PLANO ---
const TAMAÑO_MUNDO = 40; 
const ALTURA_BASE_TERRENO = 2; 
const ALTURA_MURO = 8;
const ALTURA_TORRE = 15;
const ALTURA_TORRE_CENTRAL = 25;
const planoFortaleza = [];

// --- MAPA DE MATERIALES (Código: Color) ---
const materiales = {
    1: { color: 0x1A1A1A, name: 'Muro_Negro' }, // Muros (Negro)
    2: { color: 0x1A1A1A, name: 'Torre_Negra' }, // Torres de esquina (Negro)
    3: { color: 0x333333, name: 'Terreno_Rocoso' }, // Base del suelo (Gris Oscuro)
    4: { color: 0x0D0D0D, name: 'Torre_Central' }, // Torre Principal (Negro Intenso)
    5: { color: 0xFFFFFF, name: 'Dientes_Ojo' } // Dientes/Púas (Blanco)
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

    // 1. Inicializar matriz (Crear el array 3D)
    for (let x = 0; x < TAMAÑO_MUNDO; x++) {
        planoFortaleza[x] = [];
        for (let y = 0; y < alto_total; y++) {
            planoFortaleza[x][y] = [];
            for (let z = 0; z < TAMAÑO_MUNDO; z++) {
                planoFortaleza[x][y][z] = (y < ALTURA_BASE_TERRENO) ? 3 : 0; // 3 es Terreno, 0 es Aire
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
    const centro_x = TAMAÑO_MUNDO / 2;
    for (let x = centro_x - 3; x <= centro_x + 3; x++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO + 2; y++) {
            planoFortaleza[x][y][inicio] = 0; // Se vuelve aire para crear el hueco
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
    planoFortaleza[centro_x][ALTURA_BASE_TERRENO + 1][inicio] = 5; // Diente central inferior


    // 6. TORRE CENTRAL (CÓDIGO 4)
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

} // <-- Cierre de la función de construcción del plano.

inicializarYConstruirPlano(); // <-- Llama a la función para construir el plano


// ====================================================================================
// PARTE 3: RENDERIZADO Y ANIMACIÓN
// ====================================================================================

function renderizarMundo() {
    for (let x = 0; x < TAMAÑO_MUNDO; x++) {
        for (let y = 0; y < ALTURA_TORRE_CENTRAL + 1; y++) {
            for (let z = 0; z < TAMAÑO_MUNDO; z++) {
                const tipoBloque = planoFortaleza[x][y][z];
                
                if (tipoBloque !== 0) {
                    const materialData = materiales[tipoBloque];

                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshLambertMaterial({ color: materialData.color }); 
                    const block = new THREE.Mesh(geometry, material);
                    
                    block.position.set(x - TAMAÑO_MUNDO / 2, y, z - TAMAÑO_MUNDO / 2); 
                    
                    scene.add(block);
                }
            }
        }
    }
}

renderizarMundo(); 

// Bucle de animación (para rotar la cámara)
function animate() {
    requestAnimationFrame(animate); 
    
    const time = Date.now() * 0.0001;
    camera.position.x = Math.cos(time) * (TAMAÑO_MUNDO * 1.5);
    camera.position.z = Math.sin(time) * (TAMAÑO_MUNDO * 1.5);
    camera.lookAt(0, ALTURA_MURO * 0.5, 0); 

    renderer.render(scene, camera); 
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
