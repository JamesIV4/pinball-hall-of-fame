/** @type {import('next').NextConfig} */
module.exports = {
  output: "export", // enables `next export`
  trailingSlash: true, // better for GitHub Pages
  basePath: "/pinball-hall-of-fame", // GitHub Pages subdirectory
  distDir: "docs", // output to docs folder for GitHub Pages
  images: {
    unoptimized: true, // since export produces static HTML only
  },
};
