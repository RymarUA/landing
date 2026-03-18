import { sanitizeProductName } from '../wayforpay';

describe('sanitizeProductName', () => {
  it('should transliterate Ukrainian Cyrillic to Latin', () => {
    expect(sanitizeProductName('Крем для обличчя')).toBe('Krem dlya oblychchya');
    expect(sanitizeProductName('Маска для волосся')).toBe('Maska dlya volossya');
    expect(sanitizeProductName('Олія жожоба')).toBe('Oliya zhozhoba');
  });

  it('should transliterate Russian Cyrillic to Latin', () => {
    expect(sanitizeProductName('Крем для лица')).toBe('Krem dlya litsa');
    expect(sanitizeProductName('Маска для волос')).toBe('Maska dlya volos');
  });

  it('should handle mixed Cyrillic and Latin', () => {
    expect(sanitizeProductName('Крем Nivea 50ml')).toBe('Krem Nivea 50ml');
    expect(sanitizeProductName('Шампунь L\'Oreal')).toBe('Shampun LOreal');
  });

  it('should remove special characters except basic punctuation', () => {
    expect(sanitizeProductName('Крем №1 (50мл)')).toBe('Krem 1 50ml');
    expect(sanitizeProductName('Олія 100% натуральна')).toBe('Oliya 100 naturalna');
  });

  it('should preserve spaces and basic punctuation', () => {
    expect(sanitizeProductName('Крем для рук (50 мл)')).toBe('Krem dlya ruk 50 ml');
    expect(sanitizeProductName('Маска - зволожуюча')).toBe('Maska - zvolozhuyucha');
  });

  it('should limit length to 100 characters', () => {
    const longName = 'Крем для обличчя з гіалуроновою кислотою та вітамінами А, Е, С для інтенсивного зволоження та живлення шкіри обличчя та шиї';
    const result = sanitizeProductName(longName);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('should trim whitespace', () => {
    expect(sanitizeProductName('  Крем для рук  ')).toBe('Krem dlya ruk');
    expect(sanitizeProductName('Маска   для   волосся')).toBe('Maska   dlya   volossya');
  });

  it('should handle empty string', () => {
    expect(sanitizeProductName('')).toBe('');
  });

  it('should handle product names with sizes', () => {
    expect(sanitizeProductName('Крем (Розмір: 50мл)')).toBe('Krem Rozmir 50ml');
    expect(sanitizeProductName('Шампунь (L)')).toBe('Shampun L');
  });

  it('should handle real product examples', () => {
    expect(sanitizeProductName('Зволожуючий крем для обличчя')).toBe('Zvolozhuyuchyy krem dlya oblychchya');
    expect(sanitizeProductName('Олія для тіла з ефірними маслами')).toBe('Oliya dlya tila z efirnymy maslamy');
    expect(sanitizeProductName('Маска для волосся з кератином')).toBe('Maska dlya volossya z keratynom');
  });
});
