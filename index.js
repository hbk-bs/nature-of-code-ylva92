let cracks = [];
let numStartingPoints = 5; // Anzahl der Hauptausgangspunkte für die Risse

function setup() {
  createCanvas(600, 400);
  stroke(100);
  strokeWeight(1);
}

function draw() {
  background(220);

  if (cracks.length < 200) { // Begrenze die Anzahl der Risse für die Performance
    if (frameCount % 5 === 0) { // Erzeuge neue Segmente in regelmäßigen Abständen
      for (let i = 0; i < numStartingPoints; i++) {
        if (!cracks[i]) {
          let center = createVector(width / 2, height / 2);
          let angle = map(i, 0, numStartingPoints, 0, TWO_PI) + random(-PI / 4, PI / 4);
          cracks[i] = new Crack(center.x, center.y, angle);
        } else if (cracks[i].isAlive) {
          cracks[i].addSegment();
        }
      }
      // Erzeuge neue Verzweigungen von bestehenden Rissen
      for (let i = 0; i < cracks.length; i++) {
        if (cracks[i] && cracks[i].isAlive && random(1) < 0.01) {
          cracks.push(cracks[i].branch());
        }
      }
    }
  }

  for (let i = cracks.length - 1; i >= 0; i--) {
    if (cracks[i]) {
      cracks[i].update();
      cracks[i].draw();
      if (!cracks[i].isAlive) {
        cracks.splice(i, 1);
      }
    }
  }
}

class Crack {
  constructor(x, y, initialAngle) {
    this.segments = [createVector(x, y)];
    this.angle = initialAngle + random(-PI / 8, PI / 8);
    this.segmentLength = random(5, 15);
    this.angleVariance = PI / 6;
    this.lifeSpan = random(100, 300);
    this.age = 0;
    this.isAlive = true;
    this.branchProbability = 0.05;
  }

  addSegment() {
    let lastSegment = this.segments[this.segments.length - 1];
    let nextPos = p5.Vector.add(lastSegment, p5.Vector.fromAngle(this.angle).mult(this.segmentLength));
    this.segments.push(nextPos);
    this.angle += random(-0.2, 0.2); // Leichte, zufällige Richtungsänderung
  }

  branch() {
    let lastSegment = this.segments[this.segments.length - 1];
    let newAngle = this.angle + random(-this.angleVariance, this.angleVariance);
    return new Crack(lastSegment.x, lastSegment.y, newAngle);
  }

  update() {
    this.age++;
    if (this.age > this.lifeSpan) {
      this.isAlive = false;
    }
  }

  draw() {
    for (let i = 0; i < this.segments.length - 1; i++) {
      let p1 = this.segments[i];
      let p2 = this.segments[i + 1];
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
}