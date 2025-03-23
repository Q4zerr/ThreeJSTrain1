import React, { useEffect, useRef } from 'react'
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const CarScene = () => {
    const mountRef = useRef(null);
    const carRef = useRef(null);
    const groundRef = useRef(null);
    const keysPressed = useRef({});

    const rotationSpeed = 0.06;
    const speed = 0.2;

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
        const roadTexture = textureLoader.load('src/assets/textures/Asphalt.jpg');
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(10, 10);
        roadTexture.offset.set(0.5, 0.5);

        // Créer le sol
        const groundGeometry = new THREE.PlaneGeometry(100, 100); // Un sol large
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Mettre le plan à l'horizontale
        ground.position.y = -1; // Ajustement du sol pour être sous les roues
        scene.add(ground);
        groundRef.current = ground;

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

                // Déplacement du sol en sens inverse
                groundRef.current.position.x += moveX;
                groundRef.current.position.z += moveZ;

                // Effet infini en repositionnant la texture
                groundRef.current.material.map.offset.x += moveX * 0.2;
                groundRef.current.material.map.offset.y += moveZ * 0.2;

                // Appliquer le déplacement
                carRef.current.position.x -= moveX;
                carRef.current.position.z -= moveZ;

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