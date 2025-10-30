# FeedLab

**FeedLab** is a lightweight, framework-free lab for designing and testing a brand’s social-media **visual system** (e.g., 3-column Instagram feed simulations). It lets you swap overlay templates, apply category color tokens, and tweak UI schemes — all without touching the post images.

---

## Highlights

- ⚙️ **Framework-free**: plain ES modules + CSS.
- 🧱 **Separation of concerns**:
  - `tokens.css` → design tokens (type, color, spacing, motion)
  - `core.css` → app shell (sidebar + main + grid), no template styles
  - `form.css` → UI form elements (filter bar), tokenized
- 🧩 **Templates as components**: each template ships its own `config.json`, `render.html`, and `styles.css` (plus optional `fonts`).
- 🗃️ **Data-driven**: posts are loaded from `assets/data/posts.json`.
- 🧭 **Filter Bar**: pick template, toggle theme, future filters (categories, search, layout modes).
- 🧪 **Replaceable overlay layer**: posts’ images remain unchanged; only the template layer swaps.

---

## Project Structure

```

assets/
css/
tokens.css         # design tokens (CSS variables only)
core.css           # app shell & layout (sidebar/main/grid)
form.css           # UI controls for FilterBar (labels, inputs, buttons)
data/
posts.json         # feed entries (title, caption, image, category, …)
templates.json     # list/registry of available templates
js/
app.js             # bootstraps app shell, loads data/templates, wires modules
main.js            # entry (imports App.init)
core/
utils.js         # helpers: el(), caches, CSS/HTML loaders
formBuilder.js   # generic schema→form builder (label+control+hint)
layout/
filterbar.js     # FilterBar view (builds schema form, emits changes)
grid.js          # renders fixed 3-column grid and attaches overlay hosts
schemas/
filterbarSchema.js  # schema factory for FilterBar (uses runtime data)
templates/
templatesManager.js # loads template configs, injects CSS/fonts, binds HTML
media/
...                # mock images for posts
templates/
v1-bottomleft/
config.json      # { name, title, paths, bindings, fonts?[] }
render.html      # overlay HTML (no JS required)
styles.css       # overlay CSS (consumes scheme/category tokens)
index.html

````

---

## Getting Started

> You can use any static server (no build step required).

```bash
# 1) clone
git clone https://github.com/plura/feedlab.git
cd feedlab

# 2) serve (pick one)
# python
python3 -m http.server 5173
# or Node
npx http-server -p 5173

# 3) open
open http://localhost:5173
````

> Make sure `index.html` includes your Google Fonts preconnect + Montserrat link.

---

## How It Works

1. **App Shell**

   * `app.js` creates:

     * `.plura-vs-app` (wrapper)
     * `.plura-vs-sidebar` (left, non-scrolling; FilterBar mounts here)
     * `.plura-vs-main` (right, scrolling; Grid mounts here)

2. **Grid**

   * `grid.js` renders a fixed **3-column** feed (`aspect-ratio: 4/5`) and attaches a per-post `.plura-vs-layer-host` for templates to render into.

3. **Templates**

   * `templates/templatesManager.js` loads `assets/data/templates.json`, then each template’s `config.json` to find `render.html`, `styles.css`, and optional `fonts`.
   * When you select a template, the manager:

     * injects template fonts **once** (persistent)
     * injects/removes template CSS as you switch
     * caches `render.html` and binds it to each post via `bindings` (e.g., title → `.plura-vs-title`)

4. **Filter Bar**

   * `layout/filterbar.js` + `core/formBuilder.js` + `schemas/filterbarSchema.js`
   * Presents a schema-driven form (template select, theme toggle, future filters).
   * Emits a single `onFilterChange(data)` to the App; App applies the chosen template via the manager.

---

## Add a New Template

1. Create a folder:

   ```
   templates/my-template/
     config.json
     render.html
     styles.css
   ```
2. Example `config.json`:

   ```json
   {
     "name": "v2-topright",
     "title": "Top Right",
     "paths": {
       "html": "templates/v2-topright/render.html",
       "css": "templates/v2-topright/styles.css"
     },
     "bindings": {
       "title": ".plura-vs-title",
       "caption": ".plura-vs-caption"
     },
     "fonts": [
       "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap"
     ]
   }
   ```
3. Register it in `assets/data/templates.json`:

   ```json
   [
     { "name": "v1-bottomleft", "title": "Bottom Left" },
     { "name": "v2-topright",   "title": "Top Right" }
   ]
   ```

> Keep template CSS **template-only** — it should consume global tokens + scheme/category variables but not modify the app shell.

---

## Posts Data

* `assets/data/posts.json` drives the grid.
* Each entry should include at least:

  ```json
  {
    "title": "Project Title",
    "caption": "Branding, Web",
    "image": "assets/media/placeholder-branding-4x5_0.jpg",
    "category": "branding"
  }
  ```

---

## Design Tokens

* Edit `assets/css/tokens.css` to change:

  * Typography: font sizes, weights, base line-height
  * Colors: background/surface/border/fg/accent
  * Spacing: consistent scale used by form and shell
  * Motion: default durations/easings
  * Control sizes: heights, paddings, gaps

> **No component rules** in `tokens.css` — it’s variables only.

---

## Roadmap

* [ ] Category filter (chips / select) wired to posts
* [ ] Export presets (PNG captures of grid rows)
* [ ] Template preview thumbnails
* [ ] Additional overlay templates (e.g., top-right, full-width bottom)
* [ ] Simple “layout mode” switch (density, gap tokens)

---

## License

MIT © Plura






feat: bootstrap FeedLab (framework-free visual system lab)

* add app shell (sidebar + main) and fixed 3-col grid
* implement tokens.css (typography, color roles, spacing, motion)
* add core.css (app layout only) and form.css (UI controls for FilterBar)
* generic FormBuilder with label/control/hint + schema factory for FilterBar
* templates manager (HTML/CSS/fonts per template) with atomic overlay binding
* initial data files (posts.json, templates.json) and template v1-bottomleft


