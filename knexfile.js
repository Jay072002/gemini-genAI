module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      user: 'postgres',
      password: '(Jay)@12345',
      database: 'geminiai'
    },
    migrations: {
      directory: './migrations'
    }
  }
};
