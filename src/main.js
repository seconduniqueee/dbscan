const controls = {
  totalPoints: document.querySelector(".control input#total-points"),
  threshold: document.querySelector(".control input#threshold"),
  minNeighbors: document.querySelector(".control input#min-neighbors"),
  button: document.querySelector(".gen-clusters button"),
}

const COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", 
  "#800000", "#808000", "#008000", "#000080", "#800080", "#808080", 
  "#C0C0C0", "#FFD700", "#FF6347", "#98FB98", "#FF1493", "#FF4500", 
  "#2E8B57", "#4B0082", "#D2691E", "#ADFF2F", "#A52A2A", "#F4A300", 
  "#C71585", "#B0E0E6", "#A9A9A9", "#000000", "#FFFFFF", "#8B0000",
];

controls.button.addEventListener("click", () => {
  let total = controls.totalPoints.value;
  let threshold = controls.threshold.value;
  let minNeighbors = controls.minNeighbors.value;

  if (!total) {
    alert("total is not provided");
    return;
  }

  if (!threshold) {
    alert("threshold is not provided");
    return;
  }

  if (!minNeighbors) {
    alert("min distance is not provided");
    return;
  }

  let grid = document.querySelector(".grid");
  let rect = grid.getBoundingClientRect();
  let maxWidth = rect.width;
  let maxHeight = rect.height;
  let offset = 10;
  let points = generateSetOfPoints(+total, maxWidth, maxHeight, offset);
  let result = dbScan(points, +threshold, +minNeighbors);

  drawClusters(result.clusters, result.noise, grid);
});

function generateSetOfPoints(numberOfPoints, maxWidth, maxHeight, offset) {
  let result = [];

  for (let i = 0; i < numberOfPoints; i++) {
    let x = getRandomInteger(offset, maxWidth - offset);
    let y = getRandomInteger(offset, maxHeight - offset);
    let pointValue = getRandomInteger(1, 100);

    result.push({ x, y, pointValue });
  }

  return result;
}

function drawClusters(clusters, noise, grid) {
  grid.innerHTML = "";

  clusters.forEach((cluster, index) => {
    let clusterColor = COLORS[index];

    // drawClusterOutline(cluster, grid);
    cluster.forEach((p) => renderPoint(p, clusterColor, grid))
  });

  noise.forEach((p) => renderPoint(p, "#fff", grid));
}

function renderPoint({ x, y }, color, grid) {
  let point = document.createElement("div");
  
  point.classList.add("point");
  point.style.top = `${y}px`;
  point.style.left = `${x}px`;
  point.style.backgroundColor = color;

  grid.appendChild(point);
}

function drawClusterOutline(cluster, grid) {
    let boxMinWidth = 10; 
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
    box.style.width = `${boxWidth + 5}px`;
    box.style.height = `${boxHeight + 5}px`;
    box.style.left = `${centerX}px`;
    box.style.top = `${centerY}px`;

    grid.appendChild(box);
}

function calcDistance(point1, point2) {
  let dx = point2.x - point1.x;
  let dy = point2.y - point1.y;

  return Math.sqrt(dx**2 + dy**2);
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dbScan(points, threshold, neighborsRequired) {
  let clusters = [];
  let corePointsHM = getCorePoints(points, threshold, neighborsRequired);
  let corePointsArr = points.filter((p) => inHashMap(corePointsHM, p));
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

      cluster.push(...neighbors);
    }

    clusters.push(cluster);
  }

  let flat = clusters.flat();
  let noise = points.filter((p) => !flat.includes(p));

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


// UTILS
function getPointKey(point) {
  return `${point.x},${point.y}`;
}

function inHashMap(hm, point) {
  return hm[getPointKey(point)];
}

function addToHashMap(hm, point, value) {
  hm[getPointKey(point)] = value || true;
}