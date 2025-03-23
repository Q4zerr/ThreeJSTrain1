import React, { useEffect, useRef } from 'react'
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from 'cannon';

const CarScene = () => {
    const mountRef = useRef(null);
    const carRef = useRef(null);
    const grounds = useRef([]);
    const obstacles = useRef([]);
    const keysPressed = useRef({});
    const jumpState = useRef({ isJumping: false, velocity: 0 });

    const rotationSpeed = 0.06;
    const speed = 10;
    const gravity = -0.02;
    const jumpStrength = 0.3;

    // Initialiser la physique
    const world = useRef(new CANNON.World());
    world.current.gravity.set(0, gravity, 0);
    world.current.broadphase = new CANNON.NaiveBroadphase();
    world.current.solver = new CANNON.GSSolver();
    world.current.defaultContactMaterial.friction = 0.1;
    world.current.defaultContactMaterial.restitution = 0.3;

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

                const groundMaterial = new CANNON.Material();

                // Ajout de la physique pour le sol
                const groundBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(i * tileSize, -1, j * tileSize),
                    type: CANNON.Body.STATIC, // Ne bouge pas
                    material: groundMaterial,
                });
                const groundShape = new CANNON.Plane();
                groundBody.addShape(groundShape);
                world.current.addBody(groundBody);

                // Créer un matériau de contadct pour gérer la friction entre les obstacles et le sol
                const contactMaterial = new CANNON.ContactMaterial(
                    groundMaterial,
                    new CANNON.Material(),
                    {
                        friction: 0.21,
                        restitution: 0.02
                    }
                );

                world.current.addContactMaterial(contactMaterial);
            }
        }

        // Charger le modèle 3D de la voiture
        const loader = new GLTFLoader();
        loader.load("src/assets/models/Car_low_poly.glb", (gltf) => {
            const carObject = gltf.scene;
            carObject.position.set(0, 2, 0);
            scene.add(carObject);
            carRef.current = carObject;

            // Ajout de la physique à la voiture
            const carBody = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(0, 2, 0),
                linearDamping: 0.5,
                angularDamping: 0.9,
            });
            const carShape = new CANNON.Box(new CANNON.Vec3(2, 1, 4)); // Taille approximative de la voiture
            carBody.addShape(carShape);
            world.current.addBody(carBody);

            // Liaison de la voiture au modèle three.js
            carObject.userData.body = carBody;

            // Parcous les matériaux de tous les objets du modèle
            carObject.traverse((child) => {
                if(child.isMesh){
                    if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material.roughness = 1;
                    }
                }
            })
        });

        // Fonction pour créer des obstacles avec physique
        const createObstacle = () => {
            const obstacleGeometry = new THREE.BoxGeometry(5, 5, 5);
            const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        
            // Limiter la position des obstacles pour ne pas les mettre trop loin
            const maxRange = 300; // Limiter à une certaine plage
            obstacle.position.set(
                Math.random() * maxRange - maxRange / 2, // Pos random (X)
                2.5, // Hauteur de l'obstacle
                Math.random() * maxRange - maxRange / 2
            );
        
            scene.add(obstacle);
            obstacles.current.push(obstacle);
        
            // Ajouter la physique à l'obstacle
            const obstacleBody = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(obstacle.position.x, obstacle.position.y, obstacle.position.z),
                material: new CANNON.Material(),
            });
            const obstacleShape = new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5));
            obstacleBody.addShape(obstacleShape);

            // Appliquer un peu de restitution pour éviter qu'ils ne glissent
            const contactMaterial = new CANNON.ContactMaterial(
                new CANNON.Material(),
                obstacleBody.material,
                {
                    friction: 0.000002,   // Friction
                    restitution: 0.003, // Restitution pour un léger rebond
                }
            );
            world.current.addContactMaterial(contactMaterial);

            world.current.addBody(obstacleBody);
        
            // Synchroniser l'obstacle avec le modèle Three.js
            obstacle.userData.body = obstacleBody;
        };

        // Ajouter des obstacles de manière aléatoire
        for (let i = 0; i < 10; i++){
            createObstacle();
        }

        // Position de la caméra
        camera.position.set(0, 8, -10); // Au dessus de la voiture
        camera.lookAt(0, 0, 0);

        // Fonction de réinitialisation de la vitesse
        const resetVelocity = (carBody) => {
            carBody.velocity.set(0, carBody.velocity.y, 0); // Réinitialiser les vitesses sur les axes X et Z
            carBody.angularVelocity.set(0, 0, 0); // Réinitialiser les vitesses angulaires
        };

        // Fonction pour appliquer la force de déplacement
        const moveCar = () => {
            let moveX = 0;
            let moveZ = 0;

            if (keysPressed.current['z']) {
                moveX += Math.sin(carRef.current.rotation.y) * speed;
                moveZ += Math.cos(carRef.current.rotation.y) * speed;
            }
            if (keysPressed.current['s']) {
                moveX -= Math.sin(carRef.current.rotation.y) * speed;
                moveZ -= Math.cos(carRef.current.rotation.y) * speed;
            }
            if (keysPressed.current['q']) {
                carRef.current.rotation.y += rotationSpeed;
            }
            if (keysPressed.current['d']) {
                carRef.current.rotation.y -= rotationSpeed;
            }

            // Appliquer la force avec un peu plus de puissance pour éviter la lenteur
            const carBody = carRef.current.userData.body;
            carBody.applyForce(new CANNON.Vec3(moveX * 100, 0, moveZ * 100), carBody.position);
        }

        // Fonction de gestion du saut
        const handleJump = (carBody) => {
            if (jumpState.current.isJumping) {
                carBody.velocity.y = jumpState.current.velocity; // Appliquer la vitesse verticale
                jumpState.current.velocity += gravity;

                // Vérification pour que la voiture ne traverse pas le sol
                if (carBody.position.y <= 0) {
                    carBody.position.y = 0;
                    jumpState.current.isJumping = false;
                    jumpState.current.velocity = 0;
                }
            }
        };

        // Animation de la scène
        const animate = () => {
            requestAnimationFrame(animate);

            // Mettre à jour la physique
            world.current.step(1 / 60);

            if (carRef.current) {
                const carBody = carRef.current.userData.body;

                // Réinitialiser la vitesse à chaque boucle pour éviter les vitesses résiduelles
                resetVelocity(carBody);

                // Appliquer les mouvements
                moveCar();

                // Gestion du saut
                handleJump(carBody);

                // Synchroniser la position physique avec le modèle Three.js
                carRef.current.position.copy(carBody.position);

                // Vérification des obstacles
                obstacles.current.forEach(obstacle => {
                    const obstacleBody = obstacle.userData.body;
                    obstacle.position.copy(obstacleBody.position);
                    // obstacle.rotation.setFromRotationMatrix(obstacleBody.rotation);
                });

                // Repositionner les tuiles du sol pour simuler un sol infini
                grounds.current.forEach((ground) => {
                    const dx = carRef.current.position.x - ground.position.x;
                    const dz = carRef.current.position.z - ground.position.z;

                    // Seuil de distance pour déplacer les tuiles
                    const threshold = tileSize * 1.5;

                    // Déplacer les tuiles au fur et à mesure que la voiture avance
                    if (Math.abs(dx) > threshold) {
                        ground.position.x += Math.sign(dx) * tileSize * 3;
                    }
                    if (Math.abs(dz) > threshold) {
                        ground.position.z += Math.sign(dz) * tileSize * 3;
                    }
                });

                // Mise à jour de la caméra pour suivre la voiture
                camera.position.x = carRef.current.position.x;
                camera.position.z = carRef.current.position.z - 10;
                camera.lookAt(carRef.current.position);
            }

            // Rendu de la scène
            renderer.render(scene, camera);
        };
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