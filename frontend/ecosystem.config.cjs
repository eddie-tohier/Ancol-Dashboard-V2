module.exports = {
  apps: [
    {
      name: "ancol-frontend",
      cwd: "/Users/eddietohier/Documents/Projects/Ancol-Dashboard-V2/frontend",
      script: "npm",
      args: "run dev",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      out_file: "/tmp/ancol-frontend-out.log",
      error_file: "/tmp/ancol-frontend-err.log",
      merge_logs: true,
    },
  ],
};
