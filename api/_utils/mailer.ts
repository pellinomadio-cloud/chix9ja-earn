export function isValidEmailStrict(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: "Email address is required" };
  }
  const cleanEmail = email.trim().toLowerCase();
  
  if (cleanEmail.length < 5 || cleanEmail.length > 254) {
    return { valid: false, reason: "Email address length is invalid" };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, reason: "Invalid email syntax format" };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: "Invalid email structure" };
  }

  const [localPart, domain] = parts;
  if (localPart.length === 0 || domain.length === 0) {
    return { valid: false, reason: "Invalid local or domain part in email" };
  }

  const typoMap: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmai.com': 'hotmail.com',
    'outloo.com': 'outlook.com',
    'iclou.com': 'icloud.com',
  };

  if (typoMap[domain]) {
    return { 
      valid: false, 
      reason: `Did you mean @${typoMap[domain]}? Please check your email spelling.` 
    };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { valid: false, reason: "Invalid top-level domain (TLD) extension" };
  }

  const disposableDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com'];
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: "Disposable or temporary email addresses are not allowed" };
  }

  return { valid: true };
}
