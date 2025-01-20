//------------------------------------------------------
// SHADER PROGRAMS
//------------------------------------------------------
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size; // used for points
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

//------------------------------------------------------
// GLOBAL VARIABLES
//------------------------------------------------------
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// Sliders
let redSlider, greenSlider, blueSlider, sizeSlider, segmentSlider;

// All shapes drawn by user or loaded from JSON
let shapesList = [];

// Current shape: "POINT", "TRIANGLE", "SQUARE", or "CIRCLE"
let currentShape = "POINT";

// We'll load external pixel data here
let myPixelArt = [];

//------------------------------------------------------
// MAIN & INITIAL SETUP
//------------------------------------------------------
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  setupSlidersAndEvents();

  // Clear the canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Update UI previews
  updateColorPreview();
  updateSizePreview();
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the WebGL context");
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get a_Position");
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get u_FragColor");
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get u_Size");
    return;
  }
}

function setupSlidersAndEvents() {
  redSlider     = document.getElementById("redSlider");
  greenSlider   = document.getElementById("greenSlider");
  blueSlider    = document.getElementById("blueSlider");
  sizeSlider    = document.getElementById("sizeSlider");
  segmentSlider = document.getElementById("segmentSlider"); // for circles

  // Show segment count in real time
  if (segmentSlider) {
    segmentSlider.oninput = () => {
      let segVal = document.getElementById("segmentValue");
      if (segVal) segVal.innerHTML = segmentSlider.value;
    };
  }

  // Mouse events: click or drag
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) {
    if (ev.buttons === 1) {
      click(ev);
    }
  };
}

//------------------------------------------------------
// SHAPE SELECTION
//------------------------------------------------------
function selectShape(shapeType) {
  currentShape = shapeType;
  console.log("Current shape:", currentShape);
}

//------------------------------------------------------
// MOUSE CLICK 
//------------------------------------------------------
function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  // Read sliders for color & size
  let r = parseFloat(redSlider.value);
  let g = parseFloat(greenSlider.value);
  let b = parseFloat(blueSlider.value);
  let s = parseFloat(sizeSlider.value);

  if (currentShape === "POINT") {
    let p = new Point();
    p.position = [x, y, 0.0];
    p.color    = [r, g, b, 1.0];
    p.size     = s * 3.0; // scale for gl_PointSize
    shapesList.push(p);
  }
  else if (currentShape === "TRIANGLE") {
    let t = new Triangle();
    t.position = [x, y, 0.0];
    t.color    = [r, g, b, 1.0];
    t.size     = s;
    shapesList.push(t);
  }
  else if (currentShape === "SQUARE") {
    let sideLen = s / 50.0; // convert slider to WebGL coords
    let sq = new Square(x, y, sideLen, [r, g, b, 1.0]);
    shapesList.push(sq);
  }
  else if (currentShape === "CIRCLE") {
    let c = new Circle();
    c.position = [x, y, 0.0];
    c.color    = [r, g, b, 1.0];
    c.size     = s; 
    if (segmentSlider) {
      c.segments = parseInt(segmentSlider.value, 10);
    } else {
      c.segments = 12;
    }
    shapesList.push(c);
  }

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let rect = ev.target.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
}

//------------------------------------------------------
// RENDER
//------------------------------------------------------
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let shape of shapesList) {
    shape.render();
  }
}

//------------------------------------------------------
// CLEAR
//------------------------------------------------------
function clearCanvas() {
  shapesList = [];
  renderAllShapes();
}

//------------------------------------------------------
// LOADING & RENDERING EXTERNAL PIXEL ART
//------------------------------------------------------
function loadPixelArt() {
  fetch("hu_tao_small.json") 
    .then(response => response.json())
    .then(data => {
      myPixelArt = data.pixels;  
      renderPixelArt(data.width, data.height);
      
      // << NEW LINES: show reference image after JSON is loaded & squares are drawn
      const refDiv = document.getElementById("referenceImage");
      if (refDiv) {
        // Clear old content if needed
        refDiv.innerHTML = "";
        // Create an <img> for "drawing.jpg"
        let img = document.createElement("img");
        img.src = "drawing.jpg";  // must be in the same folder
        img.alt = "Reference drawing";
        img.style.width = "200px";  // or any size you like
        refDiv.appendChild(img);
      }
      // END NEW LINES
    })
    .catch(error => console.error("Error loading pixel art:", error));
}

function renderPixelArt(imgWidth, imgHeight) {
  for (let pix of myPixelArt) {
    let cellW = 2 / imgWidth;
    let cellH = 2 / imgHeight;
    
    let x = -1 + (pix.gx + 0.5) * cellW; 
    let y =  1 - (pix.gy + 0.5) * cellH; 
    
    let side = Math.min(cellW, cellH);  
    
    let color = [pix.r, pix.g, pix.b, pix.a];
    let sq = new Square(x, y, side, color);
    shapesList.push(sq);
  }
  renderAllShapes();
}

//------------------------------------------------------
// OPTIONAL UI PREVIEW
//------------------------------------------------------
function updateColorPreview() {
  let preview = document.getElementById("colorPreview");
  if (!preview) return;

  let r255 = Math.round(redSlider.value * 255);
  let g255 = Math.round(greenSlider.value * 255);
  let b255 = Math.round(blueSlider.value * 255);
  preview.style.backgroundColor = `rgb(${r255}, ${g255}, ${b255})`;
}

function updateSizePreview() {
  let sizeValueElem = document.getElementById("sizeValue");
  if (!sizeValueElem) return;
  sizeValueElem.innerHTML = sizeSlider.value;
}
