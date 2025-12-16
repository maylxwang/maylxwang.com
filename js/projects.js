async function projectsElements(height, width) {
  const padding = 20; // 20px padding around the frame
  const innerHeight = height - dims.innerBorder * 2 - dims.upperGap - padding * 2;
  const innerWidth = width - dims.innerBorder * 2 - padding * 2;

  const elements = [];

  // Fetch projects data
  const data = await fetch("../json/projects.json").then((response) => response.json());

  // Calculate heights for each section
  const bigProjectsHeight = calculateSectionHeight(data.bigProjects, innerWidth, "bigProjects");
  const smallProjectsHeight = calculateSectionHeight(data.smallProjects, innerWidth, "smallProjects");

  // Create "Larger Projects" section
  const bigProjectsSection = createProjectsSection(innerWidth, bigProjectsHeight, "bigProjects", "Larger Projects", padding, data);
  elements.push(bigProjectsSection);

  // Create "Smaller Projects" section, positioning it below "Larger Projects"
  const smallProjectsSection = createProjectsSection(innerWidth, smallProjectsHeight, "smallProjects", "Smaller Projects", padding, data);
  smallProjectsSection.style.top = `${dims.innerBorder + dims.upperGap + padding + bigProjectsHeight + 60}px`;
  elements.push(smallProjectsSection);

  // Adjust the container height to fit all sections
  const totalHeight = bigProjectsHeight + smallProjectsHeight + dims.upperGap + padding * 2;
  container.style.height = `${totalHeight}px`;

  return elements;
}

async function calculateDimensions() {
  const data = await fetch("../json/projects.json").then((response) => response.json());

  const cardWidth = 300; // Width of each project card
  const cardHeight = 400; // Height of each project card
  const gap = 20; // Gap between cards
  const padding = 20; // Padding around sections
  const maxCardsPerRow = Math.floor(
    (window.innerWidth - dims.innerBorder * 2 - padding * 2) / (cardWidth + gap)
  );

  // Calculate heights for each section
  const bigProjectsHeight =
    Math.ceil(data.bigProjects.length / maxCardsPerRow) * (cardHeight + gap) + padding * 2;
  const smallProjectsHeight =
    Math.ceil(data.smallProjects.length / maxCardsPerRow) * (cardHeight + gap) + padding * 2;

  const totalHeight = bigProjectsHeight + smallProjectsHeight + dims.upperGap + 2 * dims.innerBorder + 150;
  // Total width is the full window width
  const totalWidth = window.innerWidth - getScrollbarWidth();

  return { totalHeight, totalWidth };
}

function calculateSectionHeight(projects, innerWidth, projectType) {
  const cardWidth = 300; // Width of each project card
  const gap = 20; // Gap between cards
  const cardsPerRow = Math.floor(innerWidth / (cardWidth + gap));
  const rows = Math.ceil(projects.length / cardsPerRow);
  const cardHeight = 400; // Height of each project card
  return rows * (cardHeight + gap);
}

function createProjectsSection(innerWidth, sectionHeight, projectType, sectionTitle, padding, data) {
  const sectionContainer = document.createElement("div");
  sectionContainer.style.cssText = `
          position: absolute;
          left: ${dims.innerBorder + padding}px;
          top: ${dims.innerBorder + dims.upperGap + padding}px;
          width: ${innerWidth}px;
          height: ${sectionHeight}px;
          font-family: "Ubuntu", sans-serif;
          text-align: center;
      `;

  // Section Title
  const title = document.createElement("h1");
  title.textContent = sectionTitle;
  title.style.cssText = `
          font-size: 36px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 20px;
      `;
  sectionContainer.appendChild(title);

  // Projects Grid
  const projectsGrid = document.createElement("div");
  projectsGrid.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px; // Reduced gap between projects
      `;

  data[projectType].forEach((project) => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });

  sectionContainer.appendChild(projectsGrid);
  return sectionContainer;
}

function createProjectCard(project) {
  const card = document.createElement("div");
  card.style.cssText = `
          width: 300px;
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          border-radius: 10px;
          padding: 10px;
      `;

  const link = document.createElement("a");
  link.href = `./projects/${project.id}.html`;
  link.style.cssText = `
        text-decoration: none;
        color: inherit;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      `;

  // Project Image
  const img = document.createElement("img");
  img.src = getImageSource(project); // Use the project object
  img.style.cssText = `
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 5px;
      `;
  link.appendChild(img);

  // Project Name
  const name = document.createElement("h2");
  name.textContent = project.name;
  name.style.cssText = `
          font-size: 20px;
          font-weight: bold;
          margin: 10px 0 5px;
      `;
  link.appendChild(name);

  // Project Date
  const date = document.createElement("p");
  date.textContent = project.date;
  date.style.cssText = `
          font-size: 16px;
          font-style: italic;
          margin: 0;
      `;
  link.appendChild(date);

  // Project Blurb
  const blurb = document.createElement("p");
  blurb.textContent = project.blurb;
  blurb.style.cssText = `
          font-size: 14px;
          margin: 5px 0;
      `;
  link.appendChild(blurb);
  card.appendChild(link);
  return card;
}

function getImageSource(project) {
  return `../assets/projects/${project.id}/${project.assets.main}`;
}
