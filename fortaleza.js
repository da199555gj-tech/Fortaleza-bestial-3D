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
    1: { color: 0x1A1A1A, name: 'Muro_Negro' }, 
    2: { color: 0x1A1A1A, name: 'Torre_Negra' }, 
    3: { color: 0x333333, name: 'Terreno_Rocoso' }, 
    4: { color: 0x0D0D0D, name: 'Torre_Central' }, 
    5: { color: 0xFFFFFF, name: 'Dientes_Ojo' } 
};


// Crear la Escena (el mundo) y el Ambiente Oscuro
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a); // Fondo oscuro
scene.fog = new THREE.Fog(0x0a0a0a, 1, 100); // Niebla oscura para atmósfera

// Crear la Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Posicionar la cámara para ver la fortaleza desde arriba/lejos
camera.position.set(TAMAÑO_MUNDO / 2, ALTURA_TORRE_CENTRAL * 0.7, TAMAÑO_MUNDO); 

// Crear el Renderer (dibuja el 3D en la pantalla)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Luz suave
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffccaa, 1); // Luz direccional
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// ====================================================================================
// PARTE 2: CONSTRUCCIÓN DE LA MATRIZ (EL PLANO DE BLOQUES)
// ====================================================================================

function inicializarYConstruirPlano() {
    const alto_total = ALTURA_TORRE_CENTRAL + 1;
    const fin = TAMAÑO_MUNDO - 5;
    const inicio = 5;

    // Inicializar matriz (crear el array 3D lleno de aire y terreno base)
    for (let x = 0; x < TAMAÑO_MUNDO; x++) {
        planoFortaleza[x] = [];
        for (let y = 0; y < alto_total; y++) {
            planoFortaleza[x][y] = [];
            for (let z = 0; z < TAMAÑO_MUNDO; z++) {
                planoFortaleza[x][y][z] = (y < ALTURA_BASE_TERRENO) ? 3 : 0;
            }
        }
    }

    // MURALLAS EXTERIORES (Lados Norte y Sur)
    for (let x = inicio; x < fin; x++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO; y++) {
            planoFortaleza[x][y][inicio] = 1; 
            planoFortaleza[x][y][fin - 1] = 1; 
        }
    }
    // MURALLAS EXTERIORES (Lados Este y Oeste)
    for (let z = inicio; z < fin; z++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO; y++) {
            planoFortaleza[fin - 1][y][z] = 1; 
            planoFortaleza[inicio][y][z] = 1; 
        }
    }

    // TORRES DE ESQUINA (3x3)
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
    buildTower(inicio - 2, inicio - 2); // Esquina NW
    buildTower(fin - 1, inicio - 2);     // Esquina NE
    buildTower(inicio - 2, fin - 1);     // Esquina SW
    buildTower(fin - 1, fin - 1);         // Esquina SE

    // HUECO DE LA ENTRADA (Muro Norte, centro)
    const centro_x = TAMAÑO_MUNDO / 2;
    for (let x = centro_x - 3; x <= centro_x + 3; x++) {
        for (let y = ALTURA_BASE_TERRENO; y < ALTURA_BASE_TERRENO + ALTURA_MURO + 2; y++) {
            planoFortaleza[x][y][inicio] = 0; // Se vuelve aire para crear el hueco
        }
    }
}

inicializarYConstruirPlano();


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
                    
                    // Ajuste de posición para centrar el mundo en (0,0,0)
                    block.position.set(x - TAMAÑO_MUNDO / 2, y, z - TAMAÑO_MUNDO / 2); 
                    
                    scene.add(block);
                }
            }
        }
    }
}

renderizarMundo(); // Dibuja la matriz

// Bucle de animación (para rotar la cámara)
function animate() {
    requestAnimationFrame(animate); 
    
    const time = Date.now() * 0.0001;
    // La cámara gira en círculos grandes alrededor de la fortaleza
    camera.position.x = Math.cos(time) * (TAMAÑO_MUNDO * 1.5);
    camera.position.z = Math.sin(time) * (TAMAÑO_MUNDO * 1.5);
    camera.lookAt(0, ALTURA_MURO * 0.5, 0); // Siempre mira al centro
    
    renderer.render(scene, camera); 
}

animate();

// Responde a los cambios de tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
