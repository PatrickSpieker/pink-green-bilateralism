module.exports = {
  apps: [
    {
      name: 'playlist-converter',
      cwd: './server',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
