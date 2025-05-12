<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Realistische Bodenrisse</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #E6D2B5; /* Sandiger Boden-Hintergrund */
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <canvas id="crackCanvas"></canvas>

    <script>
        class GroundCrack {
            constructor(x, y, angle, depth = 1) {
                this.origin = { x, y };
                this.path = [{ x, y }];
                this.angle = angle;
                this.length = 0;
                this.depth = depth;
                this.maxLength = Math.random() * 200 + 100; // Zufällige Maximallänge
                this.branchProbability = 0.05;
                this.complexity = Math.random() * 0.5 + 0.5; // Zufällige Komplexität
            }

            extend() {
                const lastPoint = this.path[this.path.length - 1];
                
                // Leichte Winkeländerung mit Berücksichtigung der Komplexität
                const angleVariation = (Math.random() - 0.5) * this.complexity * 0.5;
                const newAngle = this.angle + angleVariation;
                
                // Berechne neuen Punkt mit unterschiedlicher Schrittlänge basierend auf Tiefe
                const stepLength = 2 + this.depth;
                const nextX = lastPoint.x + Math.cos(newAngle) * stepLength;
                const nextY = lastPoint.y + Math.sin(newAngle) * stepLength;

                return {
                    point: { x: nextX, y: nextY },
                    angle: newAngle
                };
            }

            grow(canvas) {
                if (this.length >= this.maxLength) return false;

                const { point, angle } = this.extend();
                const { width, height } = canvas;

                // Prüfe Grenzen und Bedingungen
                if (point.x < 0 || point.x > width || 
                    point.y < 0 || point.y > height) {
                    return false;
                }

                this.path.push(point);
                this.angle = angle;
                this.length += 2;

                return true;
            }
        }

        class CrackSimulation {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.cracks = [];
                this.setupCanvas();
            }

            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            initialize() {
                const numInitialCracks = 10;
                for (let i = 0; i < numInitialCracks; i++) {
                    this.addCrack();
                }
            }

            addCrack(x = null, y = null, depth = 1) {
                x = x || Math.random() * this.canvas.width;
                y = y || Math.random() * this.canvas.height;
                const angle = Math.random() * Math.PI * 2;
                const crack = new GroundCrack(x, y, angle, depth);
                this.cracks.push(crack);
                return crack;
            }

            render() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                this.ctx.lineWidth = 1;

                this.cracks.forEach(crack => {
                    this.ctx.beginPath();
                    crack.path.forEach((point, index) => {
                        if (index === 0) {
                            this.ctx.moveTo(point.x, point.y);
                        } else {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    });
                    this.ctx.stroke();
                });
            }

            update() {
                // Wachstum und Management der Risse
                for (let i = this.cracks.length - 1; i >= 0; i--) {
                    const crack = this.cracks[i];
                    
                    if (!crack.grow(this.canvas)) {
                        this.cracks.splice(i, 1);
                    }

                    // Zufällige Verzweigung
                    if (Math.random() < crack.branchProbability && crack.length > 20) {
                        const lastPoint = crack.path[crack.path.length - 1];
                        this.addCrack(lastPoint.x, lastPoint.y, crack.depth + 1);
                    }
                }

                // Gelegentlich neue Risse hinzufügen
                if (Math.random() < 0.02 && this.cracks.length < 50) {
                    this.addCrack();
                }
            }

            animate() {
                this.update();
                this.render();
                requestAnimationFrame(() => this.animate());
            }

            start() {
                this.initialize();
                this.animate();
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('crackCanvas');
            const simulation = new CrackSimulation(canvas);

            simulation.start();

            window.addEventListener('resize', () => {
                simulation.setupCanvas();
                simulation.cracks = []; // Risse zurücksetzen
                simulation.initialize();
            });
        });
    </script>
</body>
</html>