import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Sword = () => {
  const mountRef = useRef(null);
  const [sword, setSword] = useState(null);

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
      30,
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
    directionalLight.position.set(0, 5, 25);
    scene.add(directionalLight);

    // Ajout d'une sphère pour visualiser la position de la lumière
    // const lightSphereGeometry = new THREE.SphereGeometry(0.5, 8, 8);  // Petite sphère
    // const lightSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });  // Jaune pour bien voir la lumière
    // const lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
    // scene.add(lightSphere);

    // Charger le modèle 3D
    const loader = new GLTFLoader();
    loader.load("src/assets/models/damascus_steel_katana.glb", (gltf) => {
        const swordObject = gltf.scene;
        const screenWidth = window.innerWidth;
        swordObject.position.set(0, 0, 0);
        swordObject.rotation.set(Math.PI * 1.5, Math.PI / 6, 0.5); // X, Y, Z
        scene.add(swordObject);
        setSword(swordObject);

        // Animation GSAP sur l'objet
        const tlSword = gsap.timeline({
            scrollTrigger: {
                trigger: mountRef.current,
                start: "50% 50%",
                end: "bottom top",
                scrub: true,
                pin: true,
                markers: true,
            },
        });

        // // Premier tour sur l'axe Y
        tlSword.to(swordObject.rotation, {
            z: 1,
            duration: 2,
            ease: "power1.inOut",
        })
        tlSword.to(swordObject.rotation, {
            x: Math.PI * 2.5,
            duration: 5,
            ease: "power1.inOut",
        })
        tlSword.to(swordObject.position, {
            x: screenWidth / 25,
            duration: 10,
            ease: "power1.inOut",
        })
        tlSword.to(swordObject.rotation, {
            y: 0,
            duration: 10,
            ease: "power1.inOut",
        }, "-=7"); // Démarre en même temps que la translation sur x (anim précédente)
    });

    // Position de la caméra
    camera.position.set(0, 0, 200); // X, Y, Z

    // Animation de la scène
    const animate = () => {
        requestAnimationFrame(animate);

        // Position de la sphère = position de la lumière
        // lightSphere.position.copy(directionalLight.position);

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
    <div className="scene-object" style={{ position: "relative", zIndex: "-1000" }}>
        <div ref={mountRef}/>
    </div>
  )
};

export default Sword;
