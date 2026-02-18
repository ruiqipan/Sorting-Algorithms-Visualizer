# Sorting Algorithms Visualizer

You can **use the live website here**:  
👉 [Sorting Algorithms Visualizer](https://ruiqipan.github.io/Sorting-Algorithms-Visualizer/sorting-algorithms.html)

A single-page, interactive study guide and visualizer for common sorting algorithms. It includes:

- Algorithm overviews (how it works, when to use it, key insights)
- Complexity analysis (best/average/worst time + space)
- Animated bar-chart demos with adjustable speed
- A “Compare All” reference table and decision guide

## Algorithms included

- Insertion sort
- Selection sort
- Bubble sort
- Merge sort
- Quick sort
- Heap sort
- Counting sort
- Radix sort
- Bucket sort

## Run locally

This project has **no build step** and **no dependencies**.

### Option 1: Use the hosted site (recommended)

Just click the live link above:  
`https://ruiqipan.github.io/Sorting-Algorithms-Visualizer/sorting-algorithms.html`

### Option 2: Open the file directly

Open `index.html` (or `sorting-algorithms.html`) in your browser.

### Option 3: Serve with a local web server (recommended)

Some browsers apply stricter rules when opening local files directly; running a local server avoids that.

```bash
cd "Sorting Algorithms"
python3 -m http.server 8000
```

Then visit `http://localhost:8000/` (or `http://localhost:8000/sorting-algorithms.html`).

## Project structure

```text
.
├── sorting-algorithms.html   # Main HTML page
├── sorting-algorithms.css    # Styles for the visualizer UI
├── sorting-algorithms.js     # All visualization + algorithm logic
└── README.md
```

## Author

Created by **Ricky Pan**.
