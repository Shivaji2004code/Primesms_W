// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'prime-sms',
    script: './dist/index.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Enable cluster mode for better performance
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 5050
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5050
    },

    // Performance & Resource Management
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    min_uptime: '10s', // Minimum uptime before considering stable
    max_restarts: 10, // Maximum restarts within unstable_restarts window
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Health monitoring
    health_check_url: 'http://localhost:5050/api/health',
    health_check_grace_period: 3000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Auto-restart configuration
    restart_delay: 4000,
    
    // Watch & ignore (for development only)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    
    // Source map support
    source_map_support: true,
    
    // Additional options
    time: true,
    autorestart: true,
    
    // Error handling
    crash_restart_delay: 1000,
    
    // Monitoring
    pmx: true,
    
    // Process arguments
    args: [],
    node_args: ['--max-old-space-size=1024']
  }],

  // Deployment configuration for production
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/prime-sms.git',
      path: '/var/www/prime-sms',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/prime-sms/logs'
    }
  }
};