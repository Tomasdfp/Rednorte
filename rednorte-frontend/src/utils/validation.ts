/**
 * Validates a Chilean RUT (Rol Único Tributario) using the Modulo 11 algorithm.
 * Supports formats like: 12.345.678-9, 12345678-9, 123456789, etc.
 */
export const validateRut = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Clean: remove dots, hyphens, and spaces, and convert to uppercase
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRut.length < 2) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  if (!/^\d+$/.test(body)) return false;
  
  // Calculate verification digit
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  let expectedDvStr = '';
  
  if (expectedDv === 11) {
    expectedDvStr = '0';
  } else if (expectedDv === 10) {
    expectedDvStr = 'K';
  } else {
    expectedDvStr = expectedDv.toString();
  }
  
  return expectedDvStr === dv;
};
