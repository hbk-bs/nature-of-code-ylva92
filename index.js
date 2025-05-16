let cracks = []; // Array für alle Risse (Hauptriss und Verzweigungen)
let thickness = 3;
let framesSinceStart = 0;
let branchProbability = 0.01; // Wahrscheinlichkeit für neue Verzweigungen
let minBranchingDistance = 20; // Mindestabstand zwischen Verzweigungen
let maxCracks = 15; // Maximale Anzahl von Rissen

// Klasse für einen einzelnen Riss
class Crack {
  constructor(startPoint, endPoint, parent = null, parentIndex = -1) {
    this.points = [startPoint];
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.currentLength = 0;
    this.totalLength = dist(startPoint.x, startPoint.y, endPoint.x, endPoint.y) * 1.5;
    this.growthSpeed = random(3, 7);
    this.wobbleAmount = random(3, 8);
    this.wobbleFrequency = random(0.05, 0.15);
    this.color = color(random(80, 120));
    this.isGrowing = true;
    this.parent = parent; // Referenz zum Eltern-Riss (null für Hauptriss)
    this.parentIndex = parentIndex; // Index im Eltern-Riss, wo dieser Riss abzweigt
    this.lastBranchPoint = 0; // Letzte Position an der ein Zweig entstanden ist
  }

  // Einen Schritt wachsen
  grow() {
    if (!this.isGrowing) return;
    
    let lastPoint = this.points[this.points.length - 1];
    
    // Berechne Richtungsvektor zum Zielpunkt
    let dirX = this.endPoint.x - this.startPoint.x;
    let dirY = this.endPoint.y - this.startPoint.y;
    
    // Normalisiere und skaliere den Vektor
    let mag = sqrt(dirX * dirX + dirY * dirY);
    dirX = dirX / mag * this.growthSpeed;
    dirY = dirY / mag * this.growthSpeed;
    
    // Füge Wobble hinzu
    let wobbleX = random(-this.wobbleAmount, this.wobbleAmount);
    let wobbleY = sin(this.currentLength * this.wobbleFrequency) * this.wobbleAmount + random(-this.wobbleAmount/2, this.wobbleAmount/2);
    
    // Berechne neuen Punkt
    let nextX = lastPoint.x + dirX + wobbleX;
    let nextY = lastPoint.y + dirY + wobbleY;
    
    // Erzeuge temporären Punkt für Kollisionsprüfung
    let nextPoint = { x: nextX, y: nextY };
    
    // Prüfe, ob der neue Punkt eine Kollision verursachen würde (auch mit Rändern)
    if (this.checkCollision(nextPoint)) {
      this.isGrowing = false;
      return;
    }
    
    // Füge neuen Punkt hinzu
    this.points.push(nextPoint);
    this.currentLength += this.growthSpeed;
    
    // Prüfe, ob der Riss fertig ist
    if (this.currentLength >= this.totalLength) {
      this.isGrowing = false;
    }
  }

  // Prüfe, ob dieser Riss eine neue Verzweigung erzeugen sollte
  shouldBranch() {
    // Nur verzweigen, wenn der Riss noch wächst und die Gesamtzahl der Risse nicht zu groß ist
    if (!this.isGrowing || cracks.length >= maxCracks) return false;
    
    // Verzweige nur nach einer Mindestlänge
    if (this.points.length < 10) return false;
    
    // Prüfe Mindestabstand zur letzten Verzweigung
    if (this.currentLength - this.lastBranchPoint < minBranchingDistance) return false;
    
    // Zufällige Chance zu verzweigen
    return random() < branchProbability;
  }

  // Erzeuge eine neue Verzweigung an der aktuellen Position
  createBranch() {
    // Startpunkt ist der letzte Punkt dieses Risses
    let branchStartPoint = this.points[this.points.length - 1];
    
    // Zufälliger Endpunkt, der in einem Winkel vom aktuellen Riss abweicht
    let angle = random(-PI/3, PI/3); // ±60 Grad vom aktuellen Riss
    
    // Berechne aktuelle Richtung des Risses
    let lastIndex = this.points.length - 1;
    let prevIndex = max(0, lastIndex - 1);
    
    let currentDirection = createVector(
      this.points[lastIndex].x - this.points[prevIndex].x,
      this.points[lastIndex].y - this.points[prevIndex].y
    );
    
    currentDirection.normalize();
    currentDirection.rotate(angle);
    currentDirection.mult(random(100, 200)); // Ungefähre Länge des neuen Risses
    
    let branchEndPoint = {
      x: branchStartPoint.x + currentDirection.x,
      y: branchStartPoint.y + currentDirection.y
    };
    
    // Erzeuge neue Verzweigung und füge sie zum Array hinzu
    let newBranch = new Crack(branchStartPoint, branchEndPoint, this, this.points.length - 1);
    cracks.push(newBranch);
    
    // Aktualisiere den letzten Verzweigungspunkt
    this.lastBranchPoint = this.currentLength;
  }

  // Prüft, ob dieser Riss andere Risse kreuzt oder einen Rand berührt
  checkCollision(newPoint) {
    // Prüfe, ob der Punkt einen Rand berührt
    if (newPoint.x <= 0 || newPoint.x >= width || newPoint.y <= 0 || newPoint.y >= height) {
      return true;
    }
    
    // Prüfe Kollision mit allen Rissen
    for (let crack of cracks) {
      // Überspringe sich selbst und den Eltern-Riss
      if (crack === this || crack === this.parent) continue;
      
      // Überspringe die ersten Punkte bei Verzweigungen
      let startIdx = crack === this.parent ? this.parentIndex + 2 : 0;
      
      // Prüfe jeden Liniensegment des Risses
      for (let i = startIdx; i < crack.points.length - 1; i++) {
        let p1 = crack.points[i];
        let p2 = crack.points[i + 1];
        
        // Prüfe Abstand zum Liniensegment
        let d = distToSegment(newPoint, p1, p2);
        if (d < 5) { // Kollisionsabstand
          return true;
        }
      }
    }
    return false;
  }

  // Zeichne den Riss
  draw() {
    stroke(this.color);
    strokeWeight(thickness);
    noFill();
    
    beginShape();
    for (let point of this.points) {
      vertex(point.x, point.y);
    }
    endShape();
  }
}

// Hilfsfunktion: Abstand zwischen Punkt und Liniensegment
function distToSegment(p, v, w) {
  let l2 = sq(v.x - w.x) + sq(v.y - w.y);
  if (l2 === 0) return dist(p.x, p.y, v.x, v.y);
  
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = constrain(t, 0, 1);
  
  let projX = v.x + t * (w.x - v.x);
  let projY = v.y + t * (w.y - v.y);
  
  return dist(p.x, p.y, projX, projY);
}

// Starte einen neuen Hauptriss vom Rand
function createMainCrack() {
  // Wähle einen zufälligen Startpunkt am Rand
  let side = floor(random(4));
  let startPoint;
  
  if (side === 0) {
    startPoint = { x: random(width), y: 0 };
  } else if (side === 1) {
    startPoint = { x: width, y: random(height) };
  } else if (side === 2) {
    startPoint = { x: random(width), y: height };
  } else {
    startPoint = { x: 0, y: random(height) };
  }
  
  // Wähle einen zufälligen Endpunkt in ungefähr diagonaler Richtung
  let endPoint;
  
  // Grobe diagonale Richtung bestimmen
  if (startPoint.x < width/2 && startPoint.y < height/2) {
    // Links oben -> nach rechts unten
    endPoint = { 
      x: random(width/2, width), 
      y: random(height/2, height) 
    };
  } else if (startPoint.x >= width/2 && startPoint.y < height/2) {
    // Rechts oben -> nach links unten
    endPoint = { 
      x: random(0, width/2), 
      y: random(height/2, height) 
    };
  } else if (startPoint.x < width/2 && startPoint.y >= height/2) {
    // Links unten -> nach rechts oben
    endPoint = { 
      x: random(width/2, width), 
      y: random(0, height/2) 
    };
  } else {
    // Rechts unten -> nach links oben
    endPoint = { 
      x: random(0, width/2), 
      y: random(0, height/2) 
    };
  }
  
  // Etwas Variation zulassen
  endPoint.x += random(-width/4, width/4);
  endPoint.y += random(-height/4, height/4);
  
  // Punkte innerhalb des Canvas halten
  endPoint.x = constrain(endPoint.x, 0, width);
  endPoint.y = constrain(endPoint.y, 0, height);
  
  // Hauptriss erstellen und zum Array hinzufügen
  cracks = []; // Alle vorherigen Risse löschen
  cracks.push(new Crack(startPoint, endPoint));
  framesSinceStart = 0;
}

function setup() {
  createCanvas(600, 400);
  createMainCrack();
}

function draw() {
  background(220);
  framesSinceStart++;
  
  // Wachstum und Verzweigung für alle Risse
  for (let i = 0; i < cracks.length; i++) {
    let crack = cracks[i];
    
    // Riss wachsen lassen
    if (crack.isGrowing) {
      crack.grow();
      
      // Prüfe, ob eine neue Verzweigung entstehen soll
      if (crack.shouldBranch()) {
        crack.createBranch();
      }
    }
  }
  
  // Alle Risse zeichnen
  for (let crack of cracks) {
    crack.draw();
  }
  
  // Prüfe, ob alle Risse fertig sind
  let allFinished = true;
  for (let crack of cracks) {
    if (crack.isGrowing) {
      allFinished = false;
      break;
    }
  }
}

function mousePressed() {
  createMainCrack(); // Neue Risse starten
}