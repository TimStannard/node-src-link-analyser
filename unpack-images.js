const fs = require('fs');
const path = require('path');

const currentDirectory = process.cwd();

// Get all .html files in the current directory and its subdirectories
const fileExtensions = ['.html'];
const fileList = [];

function getFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            getFiles(filePath);
        } else if (fileExtensions.includes(path.extname(file))) {
            fileList.push(filePath);
        }
    }
}

getFiles(currentDirectory);

const viewsData = {};

// Function to search for resources in view
function searchForResources(filePath) {
    const data = fs.readFileSync(filePath, { encoding: 'utf8' });
    const matches = data.match(/["']([^"']+?\.(?:png|jpg|jpeg|css|js))["']/g);

    if (matches) {
        const viewName = path.basename(filePath, '.html');
        viewsData[viewName] = { scripts: [], images: [] };

        for (const resourcePath of matches) {
            const cleanResourcePath = resourcePath.replace(/["']/g, '');
            const resourceName = path.basename(cleanResourcePath);

            if (cleanResourcePath.endsWith('.css') || cleanResourcePath.endsWith('.js')) {
                viewsData[viewName].scripts.push(cleanResourcePath);
            } else if (cleanResourcePath.endsWith('.png') || cleanResourcePath.endsWith('.jpg') || cleanResourcePath.endsWith('.jpeg')) {
                if (!viewsData[viewName].images.includes(cleanResourcePath)) {
                    viewsData[viewName].images.push(cleanResourcePath);
                }
            }
        }
    }
}

// Run the resource search for each view
for (const file of fileList) {
    searchForResources(file);
}

// Generate an overview of assets
const overview = {
    images: {},
    scripts: {}
};

for (const viewData of Object.values(viewsData)) {
    for (const image of viewData.images) {
        if (!overview.images[image]) {
            overview.images[image] = 1;
        } else {
            overview.images[image]++;
        }
    }
    for (const script of viewData.scripts) {
        if (!overview.scripts[script]) {
            overview.scripts[script] = 1;
        } else {
            overview.scripts[script]++;
        }
    }
}

// Sort images and scripts by repetition count
const sortedImages = Object.keys(overview.images).sort((a, b) => overview.images[b] - overview.images[a]);
const sortedScripts = Object.keys(overview.scripts).sort((a, b) => overview.scripts[b] - overview.scripts[a]);

// Rearrange images and scripts in the overview
const rearrangedOverview = {
    images: sortedImages.reduce((obj, image) => {
        obj[image] = overview.images[image];
        return obj;
    }, {}),
    scripts: sortedScripts.reduce((obj, script) => {
        obj[script] = overview.scripts[script];
        return obj;
    }, {})
};

// Generate full paths to assets
const fullPaths = {
    images: [],
    scripts: []
};

for (const viewData of Object.values(viewsData)) {
    for (const image of viewData.images) {
        if (!fullPaths.images.includes(image)) {
            fullPaths.images.push(image);
        }
    }
    for (const script of viewData.scripts) {
        if (!fullPaths.scripts.includes(script)) {
            fullPaths.scripts.push(script);
        }
    }
}

// Append overviews and full paths to viewsData
viewsData['Overview of assets repeated'] = rearrangedOverview;
viewsData['Full paths to assets'] = fullPaths;

// Write the view data to a JSON file
const outputPath = path.join(currentDirectory, 'output.json');
fs.writeFileSync(outputPath, JSON.stringify({
    'Overview of assets repeated': viewsData['Overview of assets repeated'],
    'Full paths to assets': viewsData['Full paths to assets']
}, null, 2));

console.log(`View data saved to ${outputPath}`);