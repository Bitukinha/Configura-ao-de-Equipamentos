module.exports = {
  buildCommand: "npm run vercel-build",
  outputDirectory: "dist",
  env: {
    NODE_ENV: "production",
  },
  public: true,
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html",
    },
  ],
};
