const repo = "pinball-hall-of-fame";

/** @type {import('next').NextConfig} */
module.exports = {
  output: "export", // enables `next export`
  trailingSlash: true, // better for GitHub Pages
  basePath: process.env.NODE_ENV === "production" ? `/${repo}` : "",
  assetPrefix: process.env.NODE_ENV === "production" ? `/${repo}/` : "",
  images: {
    unoptimized: true, // since export produces static HTML only
  },
};
