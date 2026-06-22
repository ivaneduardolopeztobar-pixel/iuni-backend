// Dominios de correo gratuitos/genericos mas comunes en El Salvador y la region
const GENERIC_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es',
  'live.com', 'icloud.com', 'aol.com', 'protonmail.com', 'gmx.com',
  'mail.com', 'hotmail.es', 'outlook.es',
];

exports.classifyEmailDomain = (email) => {
  if (!email || !email.includes('@')) return 'GENERIC';
  const domain = email.split('@')[1].toLowerCase().trim();
  return GENERIC_DOMAINS.includes(domain) ? 'GENERIC' : 'CORPORATE';
};
