import React, { useEffect, useRef } from 'react'
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const CarScene = () => {
    const mountRef = useRef(null);
    const carRef = useRef(null);
    const grounds = useRef([]);
    const keysPressed = useRef({});
    const jumpState = useRef({ isJumping: false, velocity: 0 });

    const rotationSpeed = 0.06;
    const speed = 0.2;
    const gravity = -0.02;
    const jumpStrength = 0.3;

    const resizeScene = (camera, renderer) => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Maj taille du rendu
        renderer.setSize(width, height);

        // Maj du ratio de la caméra
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    useEffect(() => {
        // Initialisation scène Three.js
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
    
        // Listener redimensionnement fenêtre
        window.addEventListener('resize', () => resizeScene(camera, renderer));
    
        // Lumière
        const light = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        // Texture
        const textureLoader = new THREE.TextureLoader();
        const roadTexture = textureLoader.load('src/assets/textures/Asphalt_xojqdrrye_4k_Displacement.jpg');
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(10, 10);
        roadTexture.offset.set(0.5, 0.5);

        // Créer plusieurs morceaux de sol (tuiles)
        const tileSize = 50;
        for (let i = -1; i <= 1; i++){
            for(let j = -1; j <= 1; j++){
                const ground = new THREE.Mesh(
                    new THREE.PlaneGeometry(tileSize, tileSize),
                    new THREE.MeshStandardMaterial({ map: roadTexture })
                );

                ground.rotation.x = -Math.PI / 2;
                ground.position.set(i * tileSize, -1, j * tileSize);
                scene.add(ground);
                grounds.current.push(ground);
            }
        }

        // Charger le modèle 3D
        const loader = new GLTFLoader();
        loader.load("src/assets/models/Car_low_poly.glb", (gltf) => {
            const carObject = gltf.scene;
            carObject.position.set(0, 0, 0);
            scene.add(carObject);
            carRef.current = carObject;

            // Parcous les matériaux de tous les objets du modèle
            carObject.traverse((child) => {
                if(child.isMesh){
                    if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material.roughness = 1;
                    }
                }
            })
        });

        // Position de la caméra
        camera.position.set(0, 8, -10); // Au dessus de la voiture
        camera.lookAt(0, 0, 0);

        // Animation de la scène
        const animate = () => {
            requestAnimationFrame(animate);

            if (carRef.current) {
                let moveX = 0;
                let moveZ = 0;

                if (keysPressed.current["z"]) {
                    moveX -= Math.sin(carRef.current.rotation.y) * speed;
                    moveZ -= Math.cos(carRef.current.rotation.y) * speed;
                }
                if (keysPressed.current["s"]) {
                    moveX += Math.sin(carRef.current.rotation.y) * speed;
                    moveZ += Math.cos(carRef.current.rotation.y) * speed;
                }
                if (keysPressed.current["q"]) {
                    carRef.current.rotation.y += rotationSpeed;
                }
                if (keysPressed.current["d"]) {
                    carRef.current.rotation.y -= rotationSpeed;
                }
                
                // Gestion du saut de la voiture
                if(jumpState.current.isJumping){
                    carRef.current.position.y += jumpState.current.velocity;
                    jumpState.current.velocity += gravity;

                    // Lorsque la voiture touche le sol, elle arrête de sauter
                    if(carRef.current.position.y <= 0){
                        carRef.current.position.y = 0;
                        jumpState.current.isJumping = false;
                        jumpState.current.velocity = 0;
                    }
                }

                // Déplacement de la voiture
                carRef.current.position.x -= moveX;
                carRef.current.position.z -= moveZ;

                // Repositionner les tuiles du sol pour simuler un sol infini
                grounds.current.forEach((ground) => {
                    const dx = carRef.current.position.x - ground.position.x;
                    const dz = carRef.current.position.z - ground.position.z;

                    // Seuil de distance pour déplacer les tuiles
                    const threshold = tileSize * 1.5;

                    // Déplacer les tuiles au fur et à mesure que la voiture avance
                    if (Math.abs(dx) > threshold){
                        ground.position.x += Math.sign(dx) * tileSize * 3;
                    }
                    if(Math.abs(dz) > threshold){
                        ground.position.z += Math.sign(dz) * tileSize * 3;
                    }
                });

                // Met à jour la caméra pour suivre la voiture
                camera.position.x = carRef.current.position.x;
                camera.position.z = carRef.current.position.z - 10;
                camera.lookAt(carRef.current.position);
            }


            renderer.render(scene, camera);
        }
        animate();        

        // Nettoyage des ressources
        return () => {
            window.removeEventListener('resize', () => resizeScene(camera, renderer));
            if(mountRef.current){
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            scene.clear();
        }
    }, []);

    // Gestion des entrées clavier pour détecter plusieurs touches en même temps
    useEffect(() => {
        const handleKeyDown = (event) => {
            keysPressed.current[event.key] = true;

            // Lancer un saut si la touche espace est presser
            if(event.key === " "){
                if(!jumpState.current.isJumping){
                    jumpState.current.isJumping = true;
                    jumpState.current.velocity = jumpStrength;
                }
            }
        };

        const handleKeyUp = (event) => {
            keysPressed.current[event.key] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

  return (
    <div ref={mountRef}/>
  )
}

export default CarScene