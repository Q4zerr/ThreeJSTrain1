import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const EarthScene = () => {
  const mountRef = useRef(null);
  const [earth, setEarth] = useState(null);

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
    // Initialisation de la scène Three.js
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

    // Charger le modèle 3D
    const loader = new GLTFLoader();
    loader.load("src/assets/models/Earth_low_poly_without_bg.glb", (gltf) => {
        const earthObject = gltf.scene;
        earthObject.position.set(0, 0, 0);
        earthObject.rotation.y = Math.PI * 0;
        scene.add(earthObject);
        setEarth(earthObject);

        // Parcous les matériaux de tous les objets du modèle
        earthObject.traverse((child) => {
            if(child.isMesh){
                if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                    child.material.roughness = 1;
                }
            }
        })

        // Animation GSAP sur l'objet (Rotation AXE X)
        // Timeline rotation axe X et Y
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: mountRef.current,
                start: "50% 50%",
                end: "bottom top",
                scrub: true,
                pin: true,
                markers: true,
            },
        });

        // Premier tour sur l'axe Y
        tl.to(earthObject.rotation, {
            y: Math.PI * 2,
            duration: 5,
            ease: "power1.inOut",
        })
        .to(earthObject.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 2,
            ease: "power1.inOut",
        });

        // // Deuxième tour sur l'axe X
        // tl.to(earthObject.rotation, {
        //     x: Math.PI * 2,
        //     duration: 3,
        //     ease: "power1.inOut",
        // });
    });

    // Position de la caméra
    camera.position.z = 5;

    // Ajouter les contrôles de la souris
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controls.rotateSpeed = 0.8;
    // controls.minDistance = 5;
    // controls.maxDistance = 5;

    // Animation de la scène
    const animate = () => {
        requestAnimationFrame(animate);
        // controls.update(); // Mise à jour des contrôles
        renderer.render(scene, camera); // Rendu de la scène
    };
    animate();

    // Nettoyage des ressources lors du démontage du composant
    return () => {
      window.removeEventListener("resize", () => resizeScene(camera, renderer));
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Libération des ressources WebGL
      renderer.dispose();
      scene.clear(); // Supprimer tous les objets de la scène
    };
  }, []);

  return (
    <div className="scene-object">
        <div ref={mountRef}/>
    </div>
  )
};

export default EarthScene;
