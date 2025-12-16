const singleDims = {
  buffer: 20,
};

function singleElements(height, width) {
  const project = window.projectData;
  let assetsHeight;
  return new Promise((resolve) => {
    const elements = [
      createProjectTitle(project.name, project.date),
      createProjectAssets(project.assets),
    ];

    const assetsElement = elements[1];

    // Append assetsElement to DOM to measure its height
    document.body.appendChild(assetsElement);

    const images = Array.from(assetsElement.getElementsByTagName('img'));
    const imagePromises = images.map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    });

    Promise.all(imagePromises).then(() => {
      assetsHeight = assetsElement.getBoundingClientRect().height;
      console.log("Assets container height:", assetsHeight);

      // Remove assetsElement from DOM after measuring
      document.body.removeChild(assetsElement);

      const description = createProjectDescription(project.id, assetsHeight + 150);
      elements.push(description);

      // Wait for markdown to load
      fetch(`../../assets/projects/${project.id}/${project.id}.md`)
        .then((response) => response.text())
        .then((markdown) => {
          description.innerHTML = marked.parse(markdown);

          // Temporarily append description to DOM to measure its height
          document.body.appendChild(description);

          // Calculate markdownHeight after the element is rendered
          const markdownHeight = description.getBoundingClientRect().height;

          // Remove description from DOM after measuring
          document.body.removeChild(description);

          // Calculate total height
          const totalHeight = 150 + assetsHeight + markdownHeight + singleDims.buffer + dims.innerBorder;
          console.log("assetsHeight " + assetsHeight);
          console.log("markdownHeight " + markdownHeight);
          console.log("singleDims.buffer " + singleDims.buffer);
          resolve({ elements, height: totalHeight });
        });
    });
  });
}

function createProjectTitle(name, date) {
  const container = document.createElement("div");

  container.style.cssText = `
        position: absolute;
        top: ${dims.innerBorder + dims.upperGap + singleDims.buffer}px;
        left: ${dims.innerBorder + singleDims.buffer}px;
        font-family: "Ubuntu", sans-serif;
        text-align: left;
    `;

  const projectName = document.createElement("h1");
  projectName.textContent = name;
  projectName.style.cssText = `
        font-size: 36px;
        font-weight: bold;
        margin: 0;
    `;

  const projectDate = document.createElement("p");
  projectDate.textContent = date;
  projectDate.style.cssText = `
        font-size: 16px;
        font-style: italic;
        margin: 5px 0 0 0;
    `;

  container.appendChild(projectName);
  container.appendChild(projectDate);
  return container;
}

function createProjectAssets(assets) {
  const container = document.createElement("div");

  container.style.cssText = `
        position: absolute;
        top: ${dims.innerBorder + 120}px;
        left: ${dims.innerBorder}px;
        right: ${dims.innerBorder}px;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
    `;

  // Add main asset
  if (assets.main) {
    const mainAsset = createAssetElement(assets.main);
    container.appendChild(mainAsset);
  }

  // Add additional assets
  if (assets.additional && assets.additional.length > 0) {
    assets.additional.forEach((asset) => {
      const additionalAsset = createAssetElement(asset);
      container.appendChild(additionalAsset);
    });
  }

  // Add YouTube video if present
  if (assets.youtube) {
    const youtubeVideo = createYoutubeEmbed(assets.youtube);
    container.appendChild(youtubeVideo);
  }

  return container;
}

function createYoutubeEmbed(youtubeUrl) {
  const videoContainer = document.createElement("div");
  videoContainer.style.cssText = `
        max-width: 560px;
        width: 100%;
    `;

  const iframe = document.createElement("iframe");
  iframe.src = youtubeUrl.replace("watch?v=", "embed/");
  iframe.width = "100%";
  iframe.height = "315";
  iframe.frameBorder = "0";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;

  videoContainer.appendChild(iframe);
  return videoContainer;
}

function createAssetElement(assetName) {
  const assetElement = document.createElement("img");
  assetElement.src = `../../assets/projects/${window.projectData.id}/${assetName}`;
  assetElement.style.cssText = `
        max-height: 300px;
        object-fit: contain;
        border-radius: 5px;
    `;
  return assetElement;
}

function createProjectDescription(projectId, assetsBottom) {
  const container = document.createElement("div");

  container.style.cssText = `
      position: absolute;
      top: ${assetsBottom}px;
      left: ${dims.innerBorder}px;
      right: ${dims.innerBorder}px;
      font-family: "Ubuntu", sans-serif;
      white-space: pre-wrap;
      padding: 20px;
      border-radius: 10px;
  `;

  container.classList.add("markdown-content");

  fetch(`../../assets/projects/${projectId}/${projectId}.md`)
    .then((response) => response.text())
    .then((markdown) => {
      const html = marked.parse(markdown);
      container.innerHTML = html;
    })
    .catch((error) => {
      console.error("Failed to load markdown file:", error);
      container.textContent = "Markdown content not available.";
    });

  return container;
}
