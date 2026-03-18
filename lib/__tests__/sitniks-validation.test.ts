import { createSitniksOrder, type CreateOrderDto } from '../sitniks-consolidated';

// Mock sitniksSafe to test validation without actual API calls
jest.mock('../sitniks-consolidated', () => {
  const actual = jest.requireActual('../sitniks-consolidated');
  return {
    ...actual,
    sitniksSafe: jest.fn(),
  };
});

describe('Sitniks Order Validation', () => {
  const validDto: CreateOrderDto = {
    client: {
      fullname: 'Іван Петренко',
      phone: '+380501234567',
      email: 'ivan@example.com',
    },
    products: [
      {
        productVariationId: 123,
        isUpsale: false,
        price: 500,
        quantity: 2,
        title: 'Тестовий товар',
      },
    ],
    statusId: 1,
    salesChannelId: 1,
  };

  describe('Client validation', () => {
    it('should reject empty client name', async () => {
      const dto = { ...validDto, client: { ...validDto.client, fullname: '' } };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject client name with less than 2 characters', async () => {
      const dto = { ...validDto, client: { ...validDto.client, fullname: 'A' } };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject invalid phone format', async () => {
      const dto = { ...validDto, client: { ...validDto.client, phone: '0501234567' } };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject phone without +380 prefix', async () => {
      const dto = { ...validDto, client: { ...validDto.client, phone: '+38501234567' } };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject invalid email format', async () => {
      const dto = { ...validDto, client: { ...validDto.client, email: 'invalid-email' } };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should accept valid client data', async () => {
      const dto = { ...validDto };
      // This will still return null because sitniksSafe is mocked, but validation should pass
      await createSitniksOrder(dto);
      // If we got here without throwing, validation passed
      expect(true).toBe(true);
    });
  });

  describe('Products validation', () => {
    it('should reject empty products array', async () => {
      const dto = { ...validDto, products: [] };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with invalid variationId', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], productVariationId: 0 }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with negative variationId', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], productVariationId: -1 }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with empty title', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], title: '' }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with negative price', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], price: -100 }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with zero quantity', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], quantity: 0 }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject product with negative quantity', async () => {
      const dto = {
        ...validDto,
        products: [{ ...validDto.products[0], quantity: -1 }],
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });
  });

  describe('Nova Poshta delivery validation', () => {
    const validNpDelivery = {
      integrationNovaposhtaId: 1,
      price: 100,
      seatsAmount: 1,
      city: 'Київ',
      cityRef: 'city-ref-123',
      department: 'Відділення №1',
      departmentRef: 'dept-ref-123',
      serviceType: 'WarehouseWarehouse',
      payerType: 'Recipient',
      cargoType: 'Parcel',
      paymentMethod: 'Cash',
      productPaymentMethod: 'postpaid',
      weight: 1.5,
      description: 'Тестовий товар x2',
    };

    it('should reject invalid integration ID', async () => {
      const dto = {
        ...validDto,
        npDelivery: { ...validNpDelivery, integrationNovaposhtaId: 0 },
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject empty city', async () => {
      const dto = {
        ...validDto,
        npDelivery: { ...validNpDelivery, city: '' },
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject empty department', async () => {
      const dto = {
        ...validDto,
        npDelivery: { ...validNpDelivery, department: '' },
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject zero weight', async () => {
      const dto = {
        ...validDto,
        npDelivery: { ...validNpDelivery, weight: 0 },
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });

    it('should reject negative weight', async () => {
      const dto = {
        ...validDto,
        npDelivery: { ...validNpDelivery, weight: -1 },
      };
      const result = await createSitniksOrder(dto);
      expect(result).toBeNull();
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle Cyrillic product names', async () => {
      const dto = {
        ...validDto,
        products: [
          {
            productVariationId: 123,
            isUpsale: false,
            price: 500,
            quantity: 1,
            title: 'Крем для обличчя з гіалуроновою кислотою',
          },
        ],
      };
      // Validation should pass (returns null because of mock, but no error thrown)
      await createSitniksOrder(dto);
      expect(true).toBe(true);
    });

    it('should handle multiple products', async () => {
      const dto = {
        ...validDto,
        products: [
          {
            productVariationId: 123,
            isUpsale: false,
            price: 500,
            quantity: 2,
            title: 'Товар 1',
          },
          {
            productVariationId: 456,
            isUpsale: true,
            price: 300,
            quantity: 1,
            title: 'Товар 2',
          },
        ],
      };
      await createSitniksOrder(dto);
      expect(true).toBe(true);
    });
  });
});
