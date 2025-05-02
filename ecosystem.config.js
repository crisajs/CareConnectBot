module.exports = {
    apps: [
      {
        name: 'CareConnectBot',
        script: 'index.js',
        watch: false,
        autorestart: true
      },
      {
        name: 'CareConnect-Force',
        script: 'forcar.js',
        watch: false,
        autorestart: false,
        cron_restart: '0 7 * * *',   // todo dia às 7:00
      }
    ]
  }