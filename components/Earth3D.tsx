'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Earth3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number>(0);
  const textureLoader = useRef(new THREE.TextureLoader());
  const mousePosition = useRef<{ x: number; y: number } | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const isMouseDown = useRef(false);
  const lastIntersectPoint = useRef<THREE.Vector2 | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Load night sky background
    textureLoader.current.load('//unpkg.com/three-globe/example/img/night-sky.png', (texture) => {
      scene.background = texture;
    });

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.enablePan = false;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 3, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Earth geometry
    const earthGeometry = new THREE.SphereGeometry(1.8, 256, 256);

    // Load Earth textures
    Promise.all([
      textureLoader.current.loadAsync('//unpkg.com/three-globe/example/img/earth-day.jpg'),
      textureLoader.current.loadAsync('//unpkg.com/three-globe/example/img/earth-topology.png'),
      textureLoader.current.loadAsync('//unpkg.com/three-globe/example/img/earth-water.png')
    ]).then(([dayTexture, topologyTexture, waterTexture]) => {
      [dayTexture, topologyTexture, waterTexture].forEach(texture => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      });

      const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: dayTexture },
          topologyTexture: { value: topologyTexture },
          waterTexture: { value: waterTexture },
          mousePosition: { value: new THREE.Vector2(-1, -1) },
          isMouseDown: { value: 0 },
          droughtRadius: { value: 0.05 },
          droughtIntensity: { value: 0 },
          holdDuration: { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          uniform sampler2D topologyTexture;
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            
            vec3 displaced = position + normal * texture2D(topologyTexture, uv).r * 0.1;
            vPosition = displaced;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D dayTexture;
          uniform sampler2D waterTexture;
          uniform vec2 mousePosition;
          uniform float isMouseDown;
          uniform float droughtRadius;
          uniform float droughtIntensity;
          uniform float holdDuration;
          
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            // Sample textures
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 waterMask = texture2D(waterTexture, vUv);
            
            // Calculate growing radius based on hold duration
            float growingRadius = droughtRadius + (holdDuration * 0.1);
            
            // Mouse interaction drought effect with smooth animation and growing radius
            float distToMouse = distance(vUv, mousePosition);
            float mouseEffect = isMouseDown * smoothstep(growingRadius, 0.0, distToMouse) * droughtIntensity;
            
            // Only apply drought to land
            vec3 baseColor = mix(
              dayColor.rgb,
              vec3(0.95, 0.7, 0.1), // Drought yellow
              mouseEffect * (1.0 - waterMask.r) // Don't affect water
            );
            
            // Enhanced atmospheric scattering
            float atmosphere = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphereColor = mix(baseColor, vec3(0.4, 0.7, 1.0), atmosphere * 0.4);
            
            // Add specular highlight
            vec3 lightDir = normalize(vec3(5.0, 3.0, 5.0));
            float specular = pow(max(0.0, dot(reflect(-lightDir, vNormal), vec3(0.0, 0.0, -1.0))), 32.0);
            
            gl_FragColor = vec4(atmosphereColor + specular * 0.3, 1.0);
          }
        `
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      earth.castShadow = true;
      earth.receiveShadow = true;
      earthRef.current = earth;
      scene.add(earth);

      // Add cloud layer with lower opacity and density
      const CLOUDS_ALT = 0.004;
      const cloudGeometry = new THREE.SphereGeometry(1.82 * (1 + CLOUDS_ALT), 128, 128);
      const cloudMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.current.load('//unpkg.com/three-globe/example/img/clouds.png'),
        transparent: true,
        opacity: 0.1, // Reduced opacity
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloudsRef.current = clouds;
      scene.add(clouds);

      // Mouse event handlers
      const handleMouseMove = (event: MouseEvent) => {
        if (!earthRef.current || !earthMaterial.uniforms) return;

        const rect = mountRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.current.setFromCamera(mouse, camera);
        const intersects = raycaster.current.intersectObject(earthRef.current);

        if (intersects.length > 0) {
          const uv = intersects[0].uv;
          if (uv) {
            earthMaterial.uniforms.mousePosition.value.set(uv.x, uv.y);
            lastIntersectPoint.current = new THREE.Vector2(uv.x, uv.y);
          }
        }
      };

      const handleMouseDown = () => {
        if (earthMaterial.uniforms) {
          isMouseDown.current = true;
          earthMaterial.uniforms.isMouseDown.value = 1;
          earthMaterial.uniforms.holdDuration.value = 0;
        }
      };

      const handleMouseUp = () => {
        if (earthMaterial.uniforms) {
          isMouseDown.current = false;
          earthMaterial.uniforms.isMouseDown.value = 0;
          earthMaterial.uniforms.holdDuration.value = 0;
        }
      };

      mountRef.current?.addEventListener('mousemove', handleMouseMove);
      mountRef.current?.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        
        // Update controls
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Update drought intensity and hold duration
        if (earthMaterial.uniforms) {
          const targetIntensity = earthMaterial.uniforms.isMouseDown.value;
          const currentIntensity = earthMaterial.uniforms.droughtIntensity.value;
          const smoothFactor = 0.01;
          
          earthMaterial.uniforms.droughtIntensity.value += (targetIntensity - currentIntensity) * smoothFactor;

          // Increment hold duration if mouse is down
          if (isMouseDown.current) {
            earthMaterial.uniforms.holdDuration.value += 0.016; // Approximately 1/60 for 60fps
          }
        }
        
        // Rotate clouds independently
        if (cloudsRef.current) {
          cloudsRef.current.rotation.y += 0.0005;
        }
        
        renderer.render(scene, camera);
      };

      animate();

      // Cleanup event listeners
      return () => {
        mountRef.current?.removeEventListener('mousemove', handleMouseMove);
        mountRef.current?.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    });

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      earthGeometry.dispose();
      if (earthRef.current?.material) {
        (earthRef.current.material as THREE.Material).dispose();
      }
      if (cloudsRef.current?.material) {
        (cloudsRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    />
  );
};

export default Earth3D; 