import React, { useEffect, useRef, useState } from 'react';
import type p5 from 'p5';

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  type: 'residential' | 'commercial' | 'industrial' | 'park' | 'solar';
  color: string;
  energyEfficiency: number;
  population: number;
  greenScore: number;
}

interface WeatherEffect {
  type: 'rain' | 'snow' | 'clear';
  intensity: number;
  particles: Array<{x: number; y: number; z: number; speed: number}>;
}

const SustainableCities: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalPopulation: 0,
    averageEfficiency: 0,
    greenScore: 0,
    renewableEnergy: 0
  });

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    import('p5').then((p5Module) => {
      const p5 = p5Module.default;
      
      const sketch = (p: any) => {
        // Constants
        const GRID_SIZE = 30;
        const BUILDING_SPACING = 25;
        const MAX_HEIGHT = 200;
        const MIN_HEIGHT = 30;
        const TIME_SPEED = 0.0003;
        const FOG_DENSITY = 0.08;
        const WEATHER_PARTICLES = 1000;
        
        // State variables
        let buildings: Building[] = [];
        let timeOfDay = 0;
        let noiseOffset = 0;
        let weather: WeatherEffect = { type: 'clear', intensity: 0, particles: [] };
        let windDirection = 0;
        let temperature = 20;
        let buildingWidthOffsets: Array<{offset: number, speed: number}> = [];
        
        // Color palettes with enhanced variety
        const buildingColors = {
          residential: ['#A3B9C9', '#8FA3B3', '#7B8E9D', '#C4D4E0', '#95A8B7'],
          commercial: ['#89AAC9', '#6B8DAE', '#5D7A94', '#7B9BB8', '#A0B8D1'],
          industrial: ['#A68A6B', '#8B7355', '#6D5A43', '#9E8164', '#B59B7C'],
          park: ['#5C9A4B', '#4A7B3C', '#3C6230', '#6BAF59', '#4F8341'],
          solar: ['#2C3E50', '#34495E', '#2980B9', '#3498DB']
        };

        function initWeatherParticles() {
          weather.particles = Array.from({length: WEATHER_PARTICLES}, () => ({
            x: p.random(-p.width, p.width),
            y: p.random(-p.height, p.height),
            z: p.random(0, 500),
            speed: p.random(2, 5)
          }));
        }

        function initBuildingWidthOffsets() {
          buildingWidthOffsets = Array.from({length: GRID_SIZE * GRID_SIZE}, () => ({
            offset: 1,
            speed: p.random(0.005, 0.01) * (p.random() > 0.5 ? 1 : -1)
          }));
        }

        function updateWeather() {
          const hour = (timeOfDay * 24) % 24;
          const seasonalEffect = p.sin(p.frameCount * 0.001);
          
          temperature = 20 + seasonalEffect * 10;
          
          if (p.random() < 0.001) {
            weather.type = p.random() < 0.7 ? 'clear' : p.random() < 0.5 ? 'rain' : 'snow';
            weather.intensity = p.random(0.3, 1);
            initWeatherParticles();
          }
          
          windDirection += p.noise(timeOfDay) * 0.01 - 0.005;
        }

        function updateBuildingWidths() {
          buildingWidthOffsets.forEach((offset, index) => {
            offset.offset += offset.speed;
            if (offset.offset > 1.3 || offset.offset < 0.7) {
              offset.speed *= -1;
            }
          });
        }

        function generateBuildings() {
          buildings = [];
          let totalPop = 0;
          let totalEff = 0;
          let totalGreen = 0;
          let renewableCount = 0;

          for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
              const noiseVal = p.noise(x * 0.2, y * 0.2 + noiseOffset);
              const buildingType = getBuildingType(noiseVal);
              const heightFactor = p.map(x, 0, GRID_SIZE - 1, 0.3, 1);
              const heightNoise = p.noise(x * 0.3, y * 0.3, noiseOffset);
              const baseHeight = MIN_HEIGHT + heightNoise * heightFactor * (MAX_HEIGHT - MIN_HEIGHT);

              const energyEfficiency = p.random(0.5, 1);
              const population = buildingType === 'residential' ? p.floor(p.random(10, 50)) : 0;
              const greenScore = p.random(0.3, 1);

              if (buildingType === 'solar') renewableCount++;
              totalPop += population;
              totalEff += energyEfficiency;
              totalGreen += greenScore;

              buildings.push({
                x: x * BUILDING_SPACING - (GRID_SIZE * BUILDING_SPACING) / 2,
                y: y * BUILDING_SPACING - (GRID_SIZE * BUILDING_SPACING) / 2,
                width: BUILDING_SPACING * (0.7 + p.noise(x, y) * 0.3),
                height: baseHeight,
                depth: BUILDING_SPACING * (0.7 + p.noise(x + 100, y + 100) * 0.3),
                type: buildingType,
                color: p.random(buildingColors[buildingType]),
                energyEfficiency,
                population,
                greenScore
              });
            }
          }

          setStats({
            totalPopulation: totalPop,
            averageEfficiency: totalEff / buildings.length,
            greenScore: totalGreen / buildings.length,
            renewableEnergy: renewableCount / buildings.length
          });
        }

        function getBuildingType(noise: number): Building['type'] {
          if (noise < 0.15) return 'park';
          if (noise < 0.2) return 'solar';
          if (noise < 0.5) return 'residential';
          if (noise < 0.8) return 'commercial';
          return 'industrial';
        }

        function drawSky() {
          p.push();
          p.translate(0, 0, -500);
          
          // Draw orange background for the entire canvas
          p.background(p.color('#EA8126'));  // gradient start color
          p.fill(p.color('#C76839'));  // gradient end color
          p.noStroke();
          p.rect(0, 0, p.width, p.height);
          
          // Draw black rectangle for the bottom part
          p.fill(0);  // black
          p.noStroke();
          p.rect(-p.width, 0, p.width * 2, p.height);
          
          p.pop();
        }

        function drawWeatherEffects() {
          if (weather.type === 'clear') return;

          p.push();
          p.stroke(weather.type === 'rain' ? '#89CFF0' : '#FFFFFF');
          p.strokeWeight(weather.type === 'rain' ? 1 : 3);

          weather.particles.forEach(particle => {
            particle.y += particle.speed;
            particle.x += Math.sin(windDirection) * particle.speed;
            
            if (particle.y > p.height) particle.y = -p.height;
            if (particle.x > p.width) particle.x = -p.width;
            if (particle.x < -p.width) particle.x = p.width;

            p.point(particle.x, particle.y, particle.z);
          });
          p.pop();
        }

        function drawSolarPanel(x: number, y: number, width: number, depth: number) {
          p.push();
          p.translate(x, y, 10);
          p.rotateX(p.PI * 0.2);
          p.fill('#2980B9');
          p.box(width, depth, 2);
          
          // Draw grid pattern
          const gridSize = 5;
          p.stroke('#3498DB');
          for (let i = -width/2; i <= width/2; i += gridSize) {
            p.line(i, -depth/2, 0, i, depth/2, 0);
          }
          for (let i = -depth/2; i <= depth/2; i += gridSize) {
            p.line(-width/2, i, 0, width/2, i, 0);
          }
          p.pop();
        }

        function drawBuilding(building: Building, distanceFromCamera: number, index: number) {
          const { x, y, width, height, depth, color, type } = building;
          
          const timeScale = p.frameCount * 0.01;
          const widthNoise = p.noise(timeScale + index * 0.5, 0);
          const heightNoise = p.noise(0, timeScale + index * 0.5);
          
          const widthScale = p.map(widthNoise, 0, 1, 0.8, 1.2);
          const heightScale = p.map(heightNoise, 0, 1, 0.85, 1.15);
          
          const animatedWidth = width * widthScale;
          const animatedDepth = depth * widthScale;
          const animatedHeight = height * heightScale;
          
          const fogFactor = 1 - Math.min(distanceFromCamera * FOG_DENSITY, 0.8);
          const baseColor = p.color(color);
          const shadedColor = p.color(color);
          const topColor = p.color(color);
          const edgeColor = p.color(30, 30, 30);
          const highlightColor = p.color(255, 255, 255);
              
          const dayLight = Math.sin(timeOfDay * p.TWO_PI);
          const weatherDarkness = weather.type === 'clear' ? 1 : 1 - weather.intensity * 0.3;
          const ambientLight = p.map(dayLight, -1, 1, 0.3, 1) * weatherDarkness;
          
          shadedColor.setAlpha(fogFactor * 255 * ambientLight * 0.7);
          baseColor.setAlpha(fogFactor * 255 * ambientLight);
          topColor.setAlpha(fogFactor * 255 * ambientLight * 1.2);
          edgeColor.setAlpha(fogFactor * 255 * ambientLight * 0.9);
          highlightColor.setAlpha(fogFactor * 255 * ambientLight * 0.3);
          
          p.push();
          p.translate(x, y, 0);
          
          if (type === 'solar') {
            drawSolarPanel(0, 0, animatedWidth, animatedDepth);
          } else {
            // Draw building edges first
            p.stroke(edgeColor);
            p.strokeWeight(2);
            
            // Draw vertical edges
            p.push();
            // Front edges
            p.line(-animatedWidth/2, animatedDepth/2, 0, -animatedWidth/2, animatedDepth/2, animatedHeight);
            p.line(animatedWidth/2, animatedDepth/2, 0, animatedWidth/2, animatedDepth/2, animatedHeight);
            // Back edges
            p.line(-animatedWidth/2, -animatedDepth/2, 0, -animatedWidth/2, -animatedDepth/2, animatedHeight);
            p.line(animatedWidth/2, -animatedDepth/2, 0, animatedWidth/2, -animatedDepth/2, animatedHeight);
            p.pop();

            // Draw edge highlights
            p.stroke(highlightColor);
            p.strokeWeight(1);
            p.push();
            // Vertical highlights
            p.line(-animatedWidth/2 + 1, animatedDepth/2, 0, -animatedWidth/2 + 1, animatedDepth/2, animatedHeight);
            p.line(animatedWidth/2 - 1, -animatedDepth/2, 0, animatedWidth/2 - 1, -animatedDepth/2, animatedHeight);
            p.pop();
            
            p.noStroke();
            
            // Top
            p.fill(topColor);
            p.push();
            p.translate(0, 0, animatedHeight);
            p.box(animatedWidth, animatedDepth, 1);
            p.pop();
            
            // Sides
            p.fill(shadedColor);
            p.push();
            p.translate(animatedWidth/2, 0, animatedHeight/2);
            p.box(1, animatedDepth, animatedHeight);
            p.translate(-animatedWidth, 0, 0);
            p.box(1, animatedDepth, animatedHeight);
            p.pop();
            
            // Front/Back
            p.fill(baseColor);
            p.push();
            p.translate(0, animatedDepth/2, animatedHeight/2);
            p.box(animatedWidth, 1, animatedHeight);
            p.translate(0, -animatedDepth, 0);
            p.box(animatedWidth, 1, animatedHeight);
            p.pop();

            if (type !== 'park') {
              const windowSize = 5;
              const windowSpacing = 15;
              
              for (let h = windowSize; h < animatedHeight; h += windowSpacing) {
                for (let w = -animatedWidth/2 + windowSize; w < animatedWidth/2; w += windowSpacing) {
                  // Random flickering effect with very high frequency
                  const flicker = p.random() > 0.2 ? p.random(200, 255) : 0;  // 80% chance to light up, full brightness or completely dark
                  p.fill(255, 255, 200, flicker);
                  
                  p.push();
                  p.translate(w, animatedDepth/2 + 1, h);
                  p.box(windowSize, 1, windowSize);
                  p.pop();
                  
                  p.push();
                  p.translate(w, -animatedDepth/2 - 1, h);
                  p.box(windowSize, 1, windowSize);
                  p.pop();
                }
              }
            }
          }
          
          p.pop();
        }

        function drawAtmosphericEffects() {
          // Draw clouds only during day time
          if (timeOfDay > 0.25 && timeOfDay < 0.75) {
            p.push();
            p.translate(0, -p.height/3, 200);
              p.noStroke();
              
            // Sunset colors for clouds
            let cloudColor;
            const hour = (timeOfDay * 24) % 24;
            if (hour < 8 || hour > 17) {
              // Dawn/Dusk - pink/orange clouds
              cloudColor = p.color(255, 188, 150);
            } else {
              // Daytime - white clouds
              cloudColor = p.color(255);
            }
            
            const cloudOpacity = p.map(Math.sin(timeOfDay * p.TWO_PI), -1, 1, 20, 60);
            cloudColor.setAlpha(cloudOpacity);
            p.fill(cloudColor);
            
            // Draw fewer, more natural looking clouds
            for (let i = 0; i < 8; i++) {
              const x = ((p.frameCount * 0.2 + i * 300) % (p.width * 2)) - p.width;
              const y = p.height * 0.1 + p.sin(x * 0.01) * 50;
              
              // Draw cloud cluster
              for (let j = 0; j < 5; j++) {
                const offsetX = p.random(-50, 50);
                const offsetY = p.random(-20, 20);
                p.ellipse(x + offsetX, y + offsetY, 100, 60);
              }
            }
            p.pop();
          }
        }

        function drawGround() {
          const hourBg = (timeOfDay * 24) % 24;
          let groundColor;
          if (hourBg < 6) groundColor = p.color(255, 120, 40);
          else if (hourBg < 8) groundColor = p.color(255, 150, 80);
          else if (hourBg < 17) groundColor = p.color(255, 180, 120);
          else if (hourBg < 19) groundColor = p.color(255, 120, 40);
          else groundColor = p.color(255, 120, 40);

          p.push();
          p.translate(0, 0, 0);
          p.rotateX(p.PI/2);
          p.noStroke();
          p.fill(groundColor);
          p.plane(p.width * 2, p.height * 2);
          p.pop();
        }

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
          p.colorMode(p.RGB);
          p.angleMode(p.RADIANS);
          
          generateBuildings();
          initWeatherParticles();
          initBuildingWidthOffsets();
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };

        // Pause control
        let isPaused = false;
        p.mousePressed = () => { isPaused = true; return false; };
        p.mouseReleased = () => { isPaused = false; return false; };

        p.draw = () => {
          p.background(0);

          if (!isPaused) {
            timeOfDay = (p.frameCount * TIME_SPEED) % 1;
            noiseOffset += 0.001;
            updateWeather();
          }

          p.camera(0, -750, 450, 0, 0, 0, 0, 0, -1);
          drawSky();

          buildings.sort((a, b) => {
            const distA = p.dist(a.x, a.y, 0, -750);
            const distB = p.dist(b.x, b.y, 0, -750);
            return distB - distA;
          });

          buildings.forEach((building, index) => {
            const distance = p.dist(building.x, building.y, 0, -750);
            drawBuilding(building, distance / (GRID_SIZE * BUILDING_SPACING), index);
          });
        };

        p.mouseWheel = (event: any) => {
          const zoomSpeed = 0.1;
          const newHeight = p.height * (1 + event.delta * zoomSpeed);
          if (newHeight > 200 && newHeight < 2000) {
            p.resizeCanvas(p.width, newHeight);
          }
          return false;
        };
      };

      new p5(sketch, canvasRef.current as HTMLElement);
    });

    return () => {
      if (canvasRef.current) {
        while (canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <div className="w-full h-screen relative">
      <div ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-black/50 p-4 rounded-lg text-white">
      
      </div>
    </div>
  );
};

export default SustainableCities; 