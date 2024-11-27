const MAX_POINTS = 100;
const THRESHOLD = 20; // minPts?
const MIN_NEIGHBORS_REQURIED = 1;
const COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", 
  "#800000", "#808000", "#008000", "#000080", "#800080", "#808080", 
  "#C0C0C0", "#FFD700", "#FF6347", "#98FB98", "#FF1493", "#FF4500", 
  "#2E8B57", "#4B0082", "#D2691E", "#ADFF2F", "#A52A2A", "#F4A300", 
  "#C71585", "#B0E0E6", "#A9A9A9", "#000000", "#FFFFFF", "#8B0000",
];

let grid = document.querySelector(".grid");
let points = generateSetOfPoints();
let { clusters, noise } = dbScan(points, THRESHOLD, MIN_NEIGHBORS_REQURIED);

drawClusters(clusters, noise);

function generateClusters(points) {
  let clusters = [];
  let addedClusterPoints = new Map();
  let add = (cluster, point) => {
    addedClusterPoints.set(point, true);
    cluster.push(point);
  };

  points.forEach((point) => {
    if (addedClusterPoints.get(point)) return;

    let cluster = [];
    let candidates = [point];
    let addToCluster = add.bind(this, cluster);

    addToCluster(point);

    while (candidates?.length) {
      let candidate = candidates.pop();
      let pointsWithinDistance = points.filter((point) => {
        let alreadyAdded = addedClusterPoints.get(point);
        let withinRange = calcDistance(point, candidate) <= THRESHOLD;
        let isCandidate = point === candidate;

        return !alreadyAdded && withinRange && !isCandidate;
      });

      pointsWithinDistance.forEach((point) => {
        candidates.push(point);
        addToCluster(point);
      });
    }

    clusters.push(cluster);
  });

  return clusters;
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSetOfPoints() {
  let result = [];
  let offset = 40;
  let widthBoundary = window.innerWidth - offset;
  let heightBoundary = window.innerHeight - offset

  for (let i = 0; i < MAX_POINTS; i++) {
    let x = getRandomInteger(offset, widthBoundary);
    let y = getRandomInteger(offset, heightBoundary);
    let pointValue = getRandomInteger(1, 100);

    result.push({ x, y, pointValue });
  }

  return result;
}

function drawClusters(clusters, noise) {
  clusters.forEach((cluster, index) => {
    let clusterColor = COLORS[index];

    // drawClusterOutline(cluster);
    cluster.forEach((p) => renderPoint(p, clusterColor))
  });

  noise.forEach((p) => renderPoint(p, "#fff"));
}

function renderPoint({ x, y }, color) {
  let point = document.createElement("div");
  
  point.classList.add("point");
  point.style.top = `${y}px`;
  point.style.left = `${x}px`;
  point.style.backgroundColor = color;

  grid.appendChild(point);
}


function drawClusterOutline(cluster) {
    let boxMinWidth = 30; 
    let lowerX = cluster[0].x;
    let upperX = cluster[0].x;
    let lowerY = cluster[0].y;
    let upperY = cluster[0].y;

    cluster.forEach((point) => {
        if (point.x < lowerX) lowerX = point.x;
        if (point.x > upperX) upperX = point.x;
        if (point.y < lowerY) lowerY = point.y;
        if (point.y > upperY) upperY = point.y;
    });

    let box = document.createElement("div");
    let boxWidth = Math.max(upperX - lowerX + 5, boxMinWidth);
    let boxHeight = Math.max(upperY - lowerY + 5, boxMinWidth);
    let centerX = upperX - boxWidth / 2;
    let centerY = upperY - boxHeight / 2;

    box.classList.add("box");
    box.style.width = `${boxWidth + 30}px`;
    box.style.height = `${boxHeight + 30}px`;
    box.style.left = `${centerX}px`;
    box.style.top = `${centerY}px`;

    grid.appendChild(box);
}

function calcDistance(point1, point2) {
  let dx = point2.x - point1.x;
  let dy = point2.y - point1.y;

  return Math.sqrt(dx**2 + dy**2);
}

// DB Scan
function getPointKey(point) {
  return `${point.x},${point.y}`;
}

function inHashMap(hm, point) {
  return hm[getPointKey(point)];
}

function addToHashMap(hm, point, value) {
  hm[getPointKey(point)] = value || true;
}

function dbScan(points, threshold, neighborsRequired) {
  let clusters = [];
  let corePointsHM = getCorePoints(points, threshold, neighborsRequired);
  let corePointsArr = points.filter((p) => inHashMap(corePointsHM, p));
  let noise = points.filter((p) => !inHashMap(corePointsHM, p));
  let processed = {};

  for (let corePoint of corePointsArr) {
    if (inHashMap(processed, corePoint)) continue;

    let cluster = [];
    let candidates = [corePoint];

    while(candidates.length) {
      let candidate = candidates.pop();
      let neighbors = inHashMap(corePointsHM, candidate);

      cluster.push(candidate);
      addToHashMap(processed, candidate);

      neighbors
        ?.filter((nPoint) => inHashMap(corePointsHM, nPoint) && !inHashMap(processed, nPoint))
        ?.forEach((point) => candidates.push(point));
    }

    clusters.push(cluster);
  }

  return {clusters, noise };
}

function getCorePoints(points, threshold, neighborsRequired) {
  let corePoints = {};
  let processed = {};

  for (let point of points) {
    if (inHashMap(processed, point)) continue;

    let neighbors = points.filter((p) => calcDistance(p, point) < threshold && p !== point);

    if (neighbors.length >= neighborsRequired) {
      addToHashMap(corePoints, point, neighbors);      
    }

    addToHashMap(processed, point);
  }

  return corePoints;
}
