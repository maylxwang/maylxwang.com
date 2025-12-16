function aboutMeElements(height, width) {
  const innerHeight = height - dims.innerBorder * 2 - dims.upperGap;
  const innerWidth = width - dims.innerBorder * 2;

  const elements = [createAboutMeText(innerWidth, innerHeight), 
    createAboutMeImage(innerWidth, innerHeight)];
  return elements;
}

function createPopupPanel(content, triggerElement) {
  const popup = document.createElement("div");

  // Position calculation function
  const positionPopup = () => {
    const trigger = triggerElement.getBoundingClientRect();
    popup.style.left = `${trigger.left + trigger.width / 2}px`;
    popup.style.top = `${trigger.top}px`;
  };

  popup.style.cssText = `
      position: fixed;
      transform: translate(-50%, -100%);
      background-color: #e6e6db;
      padding: 10px;
      font-size: 18px;
      z-index: 1000;
      display: none;
    `;

  // Create fancy border overlay
  const borderContainer = document.createElement("div");
  borderContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    `;

  // Create the border lines
  const lines = [
    {
      style: `
          position: absolute;
          top: 0;
          left: ${dims.cornerGap}px;
          right: ${dims.cornerGap}px;
          height: ${dims.stroke}px;
          background-color: #c0c0c0;
        `,
    },
    {
      style: `
          position: absolute;
          bottom: 0;
          left: ${dims.cornerGap}px;
          right: ${dims.cornerGap}px;
          height: ${dims.stroke}px;
          background-color: #c0c0c0;
        `,
    },
    {
      style: `
          position: absolute;
          left: 0;
          top: ${dims.cornerGap}px;
          bottom: ${dims.cornerGap}px;
          width: ${dims.stroke}px;
          background-color: #c0c0c0;
        `,
    },
    {
      style: `
          position: absolute;
          right: 0;
          top: ${dims.cornerGap}px;
          bottom: ${dims.cornerGap}px;
          width: ${dims.stroke}px;
          background-color: #c0c0c0;
        `,
    },
  ];

  lines.forEach((lineConfig) => {
    const line = document.createElement("div");
    line.className = "line";
    line.style.cssText = lineConfig.style;
    borderContainer.appendChild(line);
  });

  const contentContainer = document.createElement("div");
  contentContainer.style.padding = `${dims.cornerGap}px`;
  contentContainer.style.whiteSpace = "pre-line";
  contentContainer.appendChild(content);

  popup.appendChild(contentContainer);
  popup.appendChild(borderContainer);

  // Close popup when clicking outside
  document.addEventListener("click", (e) => {
    if (popup.style.display === "block" && !popup.contains(e.target) && !triggerElement.contains(e.target)) {
      popup.style.display = "none";
    }
  });

  // Show popup on trigger click
  triggerElement.addEventListener("click", (e) => {
    e.stopPropagation();
    if (popup.style.display === "none" || popup.style.display === "") {
      popup.style.display = "block";
      positionPopup();
    } else {
      popup.style.display = "none";
    }
  });

  // Update position on resize
  window.addEventListener("resize", () => {
    if (popup.style.display === "block") {
      positionPopup();
    }
  });

  return popup;
}

function createAboutMeText(innerWidth, innerHeight) {
  const container = document.createElement("div");
  const textWidth = innerWidth * 0.5;

  container.style.cssText = `
      position: absolute;
      left: ${dims.innerBorder + innerWidth * 0.4}px;
      top: ${dims.innerBorder + dims.upperGap}px;
      width: ${textWidth}px;
      height: ${innerHeight}px;
      font-family: inherit;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      justify-content: center;
    `;

  const paragraphs = [
    {
      text: [
        "Hi! I'm May, a third-year undergrad studying Mechanical Engineering at Cornell University. On campus I'm a MechE subteam member of ",
        { text: "CU Autonomous Underwater Vehicle", link: "https://cuauv.org" },
        ", Training Chair in ",
        { text: "Cornell Maker Club", link: "https://makerclub.ece.cornell.edu/" },
        ", and researcher at ",
        { text: "Shepherd's Organic Robotics Lab", link: "https://orl.mae.cornell.edu/index.html" },
        ".",
      ],
    },
    "At this point I'm planning to pursue grad school in Mechatronics, exploring the amalgamation of kinesthetic haptics, unconventional interfaces, musical synthesizers, and soft robotics.",
    {
      text: [
        "If you think my skillset is fitting, I'm also always looking for commission engineering work! I wont charge much if the challenge is interesting and fun. ",
        {
          text: "Contact me",
          popup: {
            content: "may.lx.wang@gmail.com",
          },
        },
        " if you're interested.",
      ],
    },
    {
      text: [
        "When I'm free, outside of my time making projects, I find myself grinding ",
        {
          text: "competitive ranked ladders",
          popup: {
            content: `LoL: 👦🏻❄️🐻 | Diamond
      SC2: 🐛 | Master
      BeatSaber: 💨 | ~3k
      TFT: 🃏🔄 | Master
      WoW: 🩸💀/🐻 | KSM
      SSBM:🧑🏻🗡️ | 0️-2er`,
          },
        },
        ", being a ",
        {
          text: "washed gym rat",
          popup: {
            content: `SBD: 405 | 185 | 445 @ 235lbs 
      1Hr FTP: 280W
      Half-Marathon: 1:58:55
      50-Mile: 18 Hrs 10 Mins`,
          },
        },
        ", and cooking ",
        {
          text: "absurd(ly bad) dishes",
          popup: {
            content: `some of my proudest contrivances:
      tamago kake gohan ice cream w/ laoganma
      five spice powder pumpkin pie
      strawberry mozzerella uncrustables`,
          },
        },
        ".",
      ],
    },
    "HRT 12.21.24"
  ];

  paragraphs.forEach((paragraph, index) => {
    const p = document.createElement("p");
    p.style.cssText = `
        margin: 0;
        margin-bottom: ${index !== paragraphs.length - 1 ? "20px" : "0"};
        font-size: 18px;
      `;

    if (typeof paragraph === "string") {
      p.textContent = paragraph;
    } else {
      paragraph.text.forEach((segment) => {
        if (typeof segment === "string") {
          p.appendChild(document.createTextNode(segment));
        } else if (segment.link) {
          const link = document.createElement("a");
          link.href = segment.link;
          link.textContent = segment.text;
          p.appendChild(link);
        } else if (segment.popup) {
          const span = document.createElement("span");
          span.textContent = segment.text;
          span.style.cssText = `
              cursor: pointer;
              border-bottom: 1px solid currentColor;
              transition: color 0.2s ease;
            `;

          // Add hover events
          span.addEventListener("mouseenter", () => {
            span.style.color = "#FF8000";
          });
          span.addEventListener("mouseleave", () => {
            span.style.color = "inherit";
          });

          // Create popup content
          const popupContent = document.createElement("div");
          popupContent.textContent = segment.popup.content;

          const popup = createPopupPanel(popupContent, span);
          document.body.appendChild(popup);

          p.appendChild(span);
        }
      });
    }
    container.appendChild(p);
  });

  return container;
}

function createAboutMeImage(innerWidth, innerHeight) {
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

function createAboutMeImage(innerWidth, innerHeight) {
    const container = document.createElement("div");
    const imageWidth = 0.22 * innerWidth;
  
    // Position: centered on right side
    const leftPosition = dims.innerBorder + innerWidth * 0.09;
  
    container.style.cssText = `
      position: absolute;
      left: ${leftPosition}px;
      top: ${dims.innerBorder + dims.upperGap}px;
      width: ${imageWidth}px;
      height: ${innerHeight}px;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
  
    const img = document.createElement("img");
    img.src = "../assets/about-me/about-me.png";
    img.style.cssText = `
      width: 100%;
      height: auto;
      object-fit: contain;
    `;
  
    container.appendChild(img);
    return container;
}