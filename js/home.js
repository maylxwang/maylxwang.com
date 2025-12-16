function homeElements(height, width) {
  const innerHeight = height - dims.innerBorder * 2 - dims.upperGap;
  const innerWidth = width - dims.innerBorder * 2;

  const elements = [createInteractiveSVG(innerWidth, innerHeight), createSpecSheet(innerWidth, innerHeight), createAUVImage(innerWidth, innerHeight)];
  return elements;
}

function createAUVImage(innerWidth, innerHeight) {
  const specSheetHeight = (dims.borderGap * dims.borderTextSizeMultiplier + 16 + dims.stroke) * 3;
  const container = document.createElement("div");

  // Position: centered between middle and right border
  const leftPosition = dims.innerBorder + innerWidth / 2;

  container.style.cssText = `
      position: absolute;
      left: ${leftPosition}px;
      top: ${dims.innerBorder + dims.upperGap}px;
      width: ${innerWidth / 2}px;
      height: ${innerHeight - specSheetHeight - dims.upperGap}px;
      display: flex;
      justify-content: center;
      align-items: center;
  `;

  const img = document.createElement("img");
  img.src = "../assets/home/auv.png";
  img.style.cssText = `
      max-width: 100%;
      max-height: 80%;
      object-fit: contain;
  `;

  container.appendChild(img);
  return container;
}

function createSpecSheet() {
  const specNotes = ["DIMENSIONS ARE IN INCHES", "DO NOT SCALE DRAWINGS", "DO NOT ANODIZE SEALING SURFACES", "DEBURR AND BREAK SHARP EDGES", "SHEET 1 OF 1, SCALE 1:1"];

  const container = document.createElement("div");
  const fontSize = dims.borderGap * dims.borderTextSizeMultiplier;
  container.style.cssText = `
      position: absolute;
      right: ${dims.innerBorder}px;
      bottom: ${dims.innerBorder}px;
      display: flex;
      flex-direction: column;
      font-size: ${fontSize}px;
    `;

  const lines = [
    { text: specNotes[Math.floor(Math.random() * specNotes.length)] },
    { text: "may.lx.wang@gmail.com", icon: "../assets/home/mail.svg" },
    { text: "Upstate NY / Bay Area", icon: "../assets/home/location.svg" },
  ];

  lines.forEach(({ text, icon }) => {
    const line = document.createElement("div");
    line.style.cssText = `
        border: ${dims.stroke}px solid #c0c0c0;
        padding: 8px 16px;
        margin-top: -${dims.stroke}px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

    if (icon) {
      const img = document.createElement("img");
      img.src = icon;
      img.style.cssText = `
          height: ${fontSize}px;
          width: ${fontSize}px;
        `;
      line.appendChild(img);
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    line.appendChild(textSpan);

    container.appendChild(line);
  });

  return container;
}

function createInteractiveSVG(innerWidth, innerHeight) {
  const svgContainer = document.createElement("div");
  svgContainer.className = "svg-container no-select";
  svgContainer.style.cssText = `
  position: absolute;
  width: ${innerWidth / 2}px;
  left: ${dims.innerBorder}px;
  top: ${dims.innerBorder + dims.upperGap + innerHeight * 0.5}px ;
  transform: translateY(-50%);
`;

  const object = document.createElement("object");
  object.data = "../assets/home/name.svg";
  object.type = "image/svg+xml";
  object.width = "100%";
  object.height = "100%";

  object.addEventListener("load", function () {
    const svgDoc = this.contentDocument;
    if (!svgDoc) return;
    function handleCtrlA(e) {
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAllDimensions();
      }
    }

    svgDoc.addEventListener("keydown", handleCtrlA);
    document.addEventListener("keydown", handleCtrlA);
    // Add styles
    const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
        :root {
          --transition-time: 0.2s;
          --hover-color: #FF8000;
          --select-color: #53A9FF;
        }
  
        #Angle,
        #Datum,
        #Symmetry,
        #Circularity {
          cursor: pointer;
          pointer-events: all;
          transition: fill var(--transition-time) ease;
          stroke: transparent;
          stroke-width: 25px;
          paint-order: stroke fill;
        }
  
        #Angle:hover:not(.selected),
        #Datum:hover:not(.selected),
        #Symmetry:hover:not(.selected),
        #Circularity:hover:not(.selected) {
          fill: var(--hover-color);
        }
  
        .selected {
          fill: var(--select-color) !important;
        }
  
        #Name {
          pointer-events: none;
        }
      `;
    svgDoc.querySelector("svg").appendChild(style);

    // Handle selection logic
    let selectedPaths = new Set();
    const selectablePaths = ["Angle", "Datum", "Symmetry", "Circularity"];

    svgDoc.addEventListener("click", function (e) {
      const targetPath = e.target.closest("#Angle, #Datum, #Symmetry, #Circularity");

      if (!targetPath) {
        if (!e.shiftKey) {
          clearAllSelections();
        }
        return;
      }

      const pathId = targetPath.id;

      if (e.shiftKey) {
        if (selectedPaths.has(pathId)) {
          selectedPaths.delete(pathId);
          targetPath.classList.remove("selected");
        } else {
          selectedPaths.add(pathId);
          targetPath.classList.add("selected");
        }
      } else {
        clearAllSelections();
        selectedPaths.add(pathId);
        targetPath.classList.add("selected");
      }
    });

    function clearAllSelections() {
      selectedPaths.forEach((pathId) => {
        const path = svgDoc.getElementById(pathId);
        if (path) {
          path.classList.remove("selected");
        }
      });
      selectedPaths.clear();
    }

    function selectAllDimensions() {
      selectablePaths.forEach((pathId) => {
        const path = svgDoc.getElementById(pathId);
        if (path) {
          path.classList.add("selected");
          selectedPaths.add(pathId);
        }
      });
    }

    // Handle clicks outside the SVG
    document.addEventListener("click", function (e) {
      if (!e.target.closest("object") && !e.shiftKey) {
        clearAllSelections();
      }
    });

    // Handle Ctrl+A
    document.addEventListener("keydown", function (e) {
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAllDimensions();
      }
    });
  });

  svgContainer.appendChild(object);
  return svgContainer;
}
