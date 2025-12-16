import json
from pathlib import Path

# Load the projects data
with open(r"C:\Users\May\Desktop\Projects\maylxwang.com\json\projects.json", "r", encoding="utf-8") as f:
    projects = json.load(f)

# Template for project pages
project_template = '''<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>{name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../css/styles.css" />
</head>
<body>
  <div class="container" id="container"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="../../js/utils.js"></script>
  <script src="../../js/template.js"></script>
  <script src="../../js/single.js"></script>
  <script>
    window.projectData = {{
      id: "{id}",
      name: "{name}",
      blurb: "{blurb}",
      date: "{date}",
      assets: {assets}
    }};

      
async function render() {{
  const container = document.getElementById("container");
  container.innerHTML = '';

  const {{ elements, height: contentHeight }} = await singleElements(window.innerHeight, window.innerWidth);

  // Check if content overflows
  if (contentHeight > window.innerHeight) {{
    // Subtract scrollbar width if necessary
    const totalWidth = window.innerWidth - getScrollbarWidth();

    // Set container height to fit content
    container.style.height = `${{contentHeight}}px`;

    // Re-render template with the new height
    const templateEls = templateElements(contentHeight, totalWidth, 'projects');

    // Combine all elements
    const fragment = document.createDocumentFragment();
    const allElements = [...templateEls, ...elements];
    allElements.forEach((el) => fragment.appendChild(el));
    container.appendChild(fragment);
  }} else {{
    // Use default height
    const templateEls = templateElements(window.innerHeight, window.innerWidth, 'projects');

    // Combine all elements
    const fragment = document.createDocumentFragment();
    const allElements = [...templateEls, ...elements];
    allElements.forEach((el) => fragment.appendChild(el));
    container.appendChild(fragment);
  }}
}}

render().then(() => {{
  window.addEventListener("resize", render);
}});
  </script>
</body>
</html>'''

# Directory to store the generated HTML files
output_dir = Path(r"C:\Users\May\Desktop\Projects\maylxwang.com\html\projects")
output_dir.mkdir(exist_ok=True)


for project in projects['bigProjects'] + projects['smallProjects']:
    html_file_path = output_dir / (project["id"] + ".html")
    
    # Remove JSON.parse since we're passing the JSON directly
    assets_json = json.dumps(project.get("assets", {}))
    
    with open(html_file_path, "w", encoding="utf-8") as f:
        f.write(project_template.format(
            id=project['id'],
            name=project['name'],
            blurb=project['blurb'],
            date=project['date'],
            assets=assets_json  # Pass the JSON string directly
        ))