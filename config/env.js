const getEnv = () => {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || '',
    databaseUrl,
  };
};

const validateEnv = () => {
  const env = getEnv();
  const missing = [];

  if (!env.databaseUrl) missing.push('SUPABASE_DB_URL');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  return { env, missing };
};

module.exports = { getEnv, validateEnv };
