/**
 * 3D Tooth model using Three.js for Cloud's Dental Hospital website
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/jsm/controls/OrbitControls.js';

// Function to initialize the 3D tooth model
export function init3DToothModel() {
    // Check if the container exists
    const container = document.querySelector('#tooth-3d-container');
    if (!container) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f9ff);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Add tooth geometry (simplified as a combination of shapes)
    const toothGroup = createSimplifiedTooth();
    scene.add(toothGroup);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.enableZoom = true;
    controls.enablePan = false;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Auto-rotate the tooth model slightly
        toothGroup.rotation.y += 0.003;
        
        // Update controls
        controls.update();
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Start animation loop
    animate();
}

// Create a simplified tooth model
function createSimplifiedTooth() {
    const group = new THREE.Group();
    
    // Create crown
    const crownGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    roundEdges(crownGeometry, 0.2);
    const crownMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 70
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 0.5;
    group.add(crown);
    
    // Create roots
    const rootMaterial = new THREE.MeshPhongMaterial({
        color: 0xfffaf0,
        shininess: 50
    });
    
    // Root 1
    const root1Geometry = new THREE.ConeGeometry(0.4, 2, 16);
    const root1 = new THREE.Mesh(root1Geometry, rootMaterial);
    root1.position.set(-0.5, -1, 0);
    root1.rotation.z = Math.PI / 12;
    group.add(root1);
    
    // Root 2
    const root2Geometry = new THREE.ConeGeometry(0.4, 2, 16);
    const root2 = new THREE.Mesh(root2Geometry, rootMaterial);
    root2.position.set(0.5, -1, 0);
    root2.rotation.z = -Math.PI / 12;
    group.add(root2);
    
    // Add a slight blue glow around the tooth (dental care concept)
    const glowGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00a0e3,
        transparent: true,
        opacity: 0.1
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    return group;
}

// Helper function to round edges of geometry
function roundEdges(geometry, radius) {
    // This is a simplified version
    // In a real project, you'd use a more complex approach or a library
    geometry.translate(0, 0, 0);
    geometry.computeBoundingBox();
    
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Scale slightly smaller to create rounded appearance
    geometry.scale(
        (size.x - radius * 2) / size.x,
        (size.y - radius * 2) / size.y,
        (size.z - radius * 2) / size.z
    );
    
    return geometry;
}
