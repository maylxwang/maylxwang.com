const dims = {
  outerBorder: 15,
  stroke: 5,
  upperGap: 18,
  borderGap: 30,
  cornerGap: 3,
  borderTextSizeMultiplier: 0.7,
  pageHeightMultiplier: 1,
  get innerBorder() {
    return this.borderGap + this.outerBorder;
  },
};

function templateElements(height, width, pageType) {
  // Modified function signature
  // Calculate inner dimensions
  const innerHeight = height - dims.innerBorder * 2 - dims.upperGap;
  const innerWidth = width - dims.innerBorder * 2;
  const gridCountHeight = Math.max(2, Math.floor(innerHeight / 450) * 2);
  const gridCountWidth = Math.max(2, Math.floor(innerWidth / 500) * 2);
  const heightSpacing = innerHeight / gridCountHeight;
  const widthSpacing = innerWidth / gridCountWidth;

  const elements = [
    ...createMainBorders(height, width),
    ...createTopNavigation(innerWidth, pageType), // Added pageType parameter
    ...createVerticalGridLines(innerWidth, gridCountHeight, heightSpacing),
    ...createHorizontalGridLines(height, width, gridCountWidth, widthSpacing),
    ...createWidthLabels(height, gridCountWidth, widthSpacing),
    ...createHeightLabels(width, gridCountHeight, heightSpacing),
  ];
  return elements;
}

function createMainBorders(height, width) {
  const createBorder = (top, side, innerWidth) => {
    const borderLines = [
      {
        top,
        left: side + dims.cornerGap,
        width: width - (side + dims.cornerGap) * 2,
        height: innerWidth,
      },
      {
        top: height - side - innerWidth,
        left: side + dims.cornerGap,
        width: width - (side + dims.cornerGap) * 2,
        height: innerWidth,
      },
      {
        top: top + dims.cornerGap,
        left: side,
        width: innerWidth,
        height: height - (top + side + dims.cornerGap * 2),
      },
      {
        top: top + dims.cornerGap,
        right: side,
        width: innerWidth,
        height: `calc(${height}px - ${top + side + dims.cornerGap * 2}px)`,
      },
    ];
    return borderLines.map((styles) => createDivWithStyles("line", styles));
  };

  return [...createBorder(dims.outerBorder, dims.outerBorder, dims.stroke), ...createBorder(dims.innerBorder + dims.upperGap, dims.innerBorder, dims.stroke)];
}

function createTopNavigation(innerWidth, pageType = 'home') {
  const navItems = [
    { text: "home", href: "/html/home.html" },
    { text: "projects", href: "/html/projects.html" },
    { text: "about me", href: "/html/about-me.html" },
    { text: "resume", href: "/assets/resume/may-wang-resume.pdf" }
  ];
  const topSpacing = innerWidth / 4;
  const elements = [];

  // Create tick marks
  for (let i = 1; i < 4; i++) {
    const lineStyles = {
      left: dims.innerBorder + topSpacing * i - dims.stroke / 2,
      top: dims.outerBorder,
      width: dims.stroke,
      height: dims.innerBorder + dims.upperGap - dims.outerBorder + (i === 2 ? 20 : 0),
    };
    elements.push(createDivWithStyles("line", lineStyles));
  }

  // Create navigation text with links
  navItems.forEach((item, i) => {
    // Create the label first with original positioning
    const labelStyles = {
      fontSize: (dims.upperGap + dims.innerBorder - dims.outerBorder) * 0.7,
      position: 'absolute',
      left: dims.innerBorder + topSpacing * i + topSpacing / 2,
      top: dims.outerBorder + (dims.innerBorder + dims.upperGap - dims.outerBorder) / 2,
      transform: "translate(-50%, -50%)"
    };

    // Create and style the link
    const link = document.createElement('a');
    link.href = item.href;
    link.style.textDecoration = 'none';
    link.style.color = 'inherit';
    
    // Create the label div with positioning
    const label = createDivWithStyles("nav-label", labelStyles);
    label.textContent = item.text;
    
    if (item.text === pageType) {
      label.classList.add('nav-label-active');
    }

    link.appendChild(label);
    elements.push(link);
  });

  return elements;
}

function createVerticalGridLines(innerWidth, gridCountHeight, heightSpacing) {
  const elements = [];
  for (let i = 1; i < gridCountHeight; i++) {
    [dims.outerBorder, dims.innerBorder + innerWidth].forEach((leftPos) => {
      const lineStyles = {
        left: leftPos,
        top: dims.innerBorder + dims.upperGap + heightSpacing * i,
        width: dims.borderGap,
        height: dims.stroke,
      };

      if (i * 2 == gridCountHeight) {
        if (leftPos === dims.outerBorder) {
          lineStyles.width += 20;
        } else {
          lineStyles.left -= 20;
          lineStyles.width += 20;
        }
      }
      elements.push(createDivWithStyles("line", lineStyles));
    });
  }
  return elements;
}

function createHorizontalGridLines(height, width, gridCountWidth, widthSpacing) {
  const elements = [];
  for (let i = 1; i < gridCountWidth; i++) {
    const lineStyles = {
      left: dims.innerBorder + widthSpacing * i,
      top: height - dims.outerBorder - dims.borderGap - dims.stroke - (i * 2 == gridCountWidth ? 15 : 0), // subtract stroke to account for line thickness
      width: dims.stroke,
      height: dims.borderGap + (i * 2 == gridCountWidth ? 20 : 0),
    };
    elements.push(createDivWithStyles("line", lineStyles));
  }
  return elements;
}

function createWidthLabels(height, gridCountWidth, widthSpacing) {
  const elements = [];
  for (let i = gridCountWidth; i > 0; i--) {
    const labelStyles = {
      fontSize: dims.borderGap * dims.borderTextSizeMultiplier,
      left: dims.innerBorder + widthSpacing * (gridCountWidth - i) + widthSpacing / 2,
      top: height - dims.outerBorder - dims.borderGap / 2,
      transform: "translate(0%,-60%)",
    };
    const label = createDivWithStyles("number-label", labelStyles);
    label.textContent = i;
    elements.push(label);
  }
  return elements;
}

function createHeightLabels(width, gridCountHeight, heightSpacing) {
  const elements = [];
  for (let i = gridCountHeight; i > 0; i--) {
    [dims.outerBorder, width - dims.outerBorder - dims.borderGap].forEach((leftPos) => {
      const labelStyles = {
        fontSize: dims.borderGap * dims.borderTextSizeMultiplier,
        left: leftPos === dims.outerBorder ? dims.outerBorder + dims.borderGap / (dims.borderGap / dims.stroke) : leftPos,
        top: dims.innerBorder + dims.upperGap + heightSpacing * (gridCountHeight - i) + heightSpacing / 2,
        transform: "translate(35%, 0%)",
      };
      const label = createDivWithStyles("number-label", labelStyles);
      label.textContent = String.fromCharCode(64 + i);
      elements.push(label);
    });
  }
  return elements;
}
