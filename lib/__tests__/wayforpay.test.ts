/**
 * lib/__tests__/wayforpay.test.ts
 *
 * Unit tests for WayForPay signature generation and verification
 */

import { describe, it, expect } from '@jest/globals';
import {
  buildWfpSignature,
  buildWfpResponseSignature,
  verifyWfpWebhookSignature,
  buildWfpPaymentUrl,
} from '../wayforpay';
import type { WayForPayPaymentParams } from '../types';

describe('WayForPay Signature Generation', () => {
  const secretKey = 'test_secret_key_12345';

  describe('buildWfpSignature', () => {
    it('generates correct signature for payment params', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-123',
        orderDate: 1678886400,
        amount: 1000,
        currency: 'UAH',
        productName: ['Product 1', 'Product 2'],
        productPrice: [500, 500],
        productCount: [1, 1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const signature = buildWfpSignature(params, secretKey);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(32); // MD5 hash is 32 chars
      expect(signature).toMatch(/^[a-f0-9]{32}$/); // Lowercase hex
    });

    it('generates different signatures for different params', () => {
      const params1: WayForPayPaymentParams = {
        merchantAccount: 'merchant1',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-1',
        orderDate: 1678886400,
        amount: 1000,
        currency: 'UAH',
        productName: ['Product 1'],
        productPrice: [1000],
        productCount: [1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const params2: WayForPayPaymentParams = {
        ...params1,
        orderReference: 'ORDER-2',
      };

      const signature1 = buildWfpSignature(params1, secretKey);
      const signature2 = buildWfpSignature(params2, secretKey);

      expect(signature1).not.toBe(signature2);
    });

    it('generates same signature for identical params', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-123',
        orderDate: 1678886400,
        amount: 1500,
        currency: 'UAH',
        productName: ['Test Product'],
        productPrice: [1500],
        productCount: [1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const signature1 = buildWfpSignature(params, secretKey);
      const signature2 = buildWfpSignature(params, secretKey);

      expect(signature1).toBe(signature2);
    });

    it('handles multiple products correctly', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-456',
        orderDate: 1678886400,
        amount: 3500,
        currency: 'UAH',
        productName: ['Product A', 'Product B', 'Product C'],
        productPrice: [1000, 1500, 1000],
        productCount: [1, 1, 1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const signature = buildWfpSignature(params, secretKey);

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('buildWfpResponseSignature', () => {
    it('generates correct response signature', () => {
      const orderReference = 'ORDER-123';
      const status = 'accept' as const;
      const time = 1678886400;

      const signature = buildWfpResponseSignature(orderReference, status, time, secretKey);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(32);
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it('generates different signatures for different timestamps', () => {
      const orderReference = 'ORDER-123';
      const status = 'accept' as const;

      const signature1 = buildWfpResponseSignature(orderReference, status, 1678886400, secretKey);
      const signature2 = buildWfpResponseSignature(orderReference, status, 1678886401, secretKey);

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifyWfpWebhookSignature', () => {
    it('verifies valid webhook callback', () => {
      const payload = {
        merchantAccount: 'test_merchant',
        orderReference: 'ORDER-123',
        amount: 1000,
        currency: 'UAH',
        authCode: 'AUTH123',
        cardPan: '4***1234',
        transactionStatus: 'Approved',
        reasonCode: 1100,
        merchantSignature: '',
      };

      // Generate valid signature
      const signatureString = [
        payload.merchantAccount,
        payload.orderReference,
        payload.amount,
        payload.currency,
        payload.authCode,
        payload.cardPan,
        payload.transactionStatus,
        payload.reasonCode,
      ].join(';');

      const crypto = require('crypto');
      payload.merchantSignature = crypto
        .createHmac('md5', secretKey)
        .update(signatureString, 'utf8')
        .digest('hex');

      const isValid = verifyWfpWebhookSignature(payload, secretKey);

      expect(isValid).toBe(true);
    });

    it('rejects invalid webhook callback with tampered signature', () => {
      const payload = {
        merchantAccount: 'test_merchant',
        orderReference: 'ORDER-123',
        amount: 1000,
        currency: 'UAH',
        authCode: 'AUTH123',
        cardPan: '4***1234',
        transactionStatus: 'Approved',
        reasonCode: 1100,
        merchantSignature: 'invalid_signature_12345678901234567890',
      };

      const isValid = verifyWfpWebhookSignature(payload, secretKey);

      expect(isValid).toBe(false);
    });

    it('rejects callback with tampered amount', () => {
      const payload = {
        merchantAccount: 'test_merchant',
        orderReference: 'ORDER-123',
        amount: 1000,
        currency: 'UAH',
        authCode: 'AUTH123',
        cardPan: '4***1234',
        transactionStatus: 'Approved',
        reasonCode: 1100,
        merchantSignature: '',
      };

      // Generate signature for original amount
      const signatureString = [
        payload.merchantAccount,
        payload.orderReference,
        payload.amount,
        payload.currency,
        payload.authCode,
        payload.cardPan,
        payload.transactionStatus,
        payload.reasonCode,
      ].join(';');

      const crypto = require('crypto');
      payload.merchantSignature = crypto
        .createHmac('md5', secretKey)
        .update(signatureString, 'utf8')
        .digest('hex');

      // Tamper with amount
      payload.amount = 2000;

      const isValid = verifyWfpWebhookSignature(payload, secretKey);

      expect(isValid).toBe(false);
    });

    it('rejects callback with wrong secret key', () => {
      const payload = {
        merchantAccount: 'test_merchant',
        orderReference: 'ORDER-123',
        amount: 1000,
        currency: 'UAH',
        authCode: 'AUTH123',
        cardPan: '4***1234',
        transactionStatus: 'Approved',
        reasonCode: 1100,
        merchantSignature: '',
      };

      // Generate signature with different secret
      const signatureString = [
        payload.merchantAccount,
        payload.orderReference,
        payload.amount,
        payload.currency,
        payload.authCode,
        payload.cardPan,
        payload.transactionStatus,
        payload.reasonCode,
      ].join(';');

      const crypto = require('crypto');
      payload.merchantSignature = crypto
        .createHmac('md5', 'wrong_secret_key')
        .update(signatureString, 'utf8')
        .digest('hex');

      const isValid = verifyWfpWebhookSignature(payload, secretKey);

      expect(isValid).toBe(false);
    });
  });

  describe('buildWfpPaymentUrl', () => {
    it('builds valid payment URL with all parameters', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-789',
        orderDate: 1678886400,
        amount: 2500,
        currency: 'UAH',
        productName: ['Test Product'],
        productPrice: [2500],
        productCount: [1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const url = buildWfpPaymentUrl(params, secretKey);

      expect(url).toContain('https://secure.wayforpay.com/pay?');
      expect(url).toContain('merchantAccount=test_merchant');
      expect(url).toContain('merchantDomainName=example.com');
      expect(url).toContain('orderReference=ORDER-789');
      expect(url).toContain('amount=2500');
      expect(url).toContain('currency=UAH');
      expect(url).toContain('merchantSignature=');
      expect(url).toContain('productName%5B0%5D=Test+Product');
      expect(url).toContain('productPrice%5B0%5D=2500');
      expect(url).toContain('productCount%5B0%5D=1');
    });

    it('includes signature in payment URL', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-999',
        orderDate: 1678886400,
        amount: 1000,
        currency: 'UAH',
        productName: ['Product'],
        productPrice: [1000],
        productCount: [1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const url = buildWfpPaymentUrl(params, secretKey);
      const signature = buildWfpSignature(params, secretKey);

      expect(url).toContain(`merchantSignature=${signature}`);
    });

    it('handles multiple products in URL', () => {
      const params: WayForPayPaymentParams = {
        merchantAccount: 'test_merchant',
        merchantDomainName: 'example.com',
        orderReference: 'ORDER-MULTI',
        orderDate: 1678886400,
        amount: 3000,
        currency: 'UAH',
        productName: ['Product 1', 'Product 2', 'Product 3'],
        productPrice: [1000, 1000, 1000],
        productCount: [1, 1, 1],
        returnUrl: 'https://example.com/success',
        serviceUrl: 'https://example.com/webhook',
      };

      const url = buildWfpPaymentUrl(params, secretKey);

      expect(url).toContain('productName%5B0%5D=');
      expect(url).toContain('productName%5B1%5D=');
      expect(url).toContain('productName%5B2%5D=');
      expect(url).toContain('productPrice%5B0%5D=1000');
      expect(url).toContain('productPrice%5B1%5D=1000');
      expect(url).toContain('productPrice%5B2%5D=1000');
    });
  });
});
