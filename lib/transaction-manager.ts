/**
 * lib/transaction-manager.ts
 *
 * Transaction manager for ACID-like operations across multiple systems.
 * Implements compensating transactions pattern when true ACID is not available.
 * 
 * Since Sitniks API and Nova Poshta don't support real transactions,
 * we use compensating actions to maintain data consistency.
 */

import { createSitniksOrder, updateSitniksOrder, type CreateOrderDto } from "./sitniks-consolidated";
import { createNovaPoshtaTTN } from "./novaposhta-create-ttn";
import { sendTelegramNotification } from "./telegram";
import { addToOutbox } from "./transactional-outbox";

export interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  compensate?: (result: any) => Promise<void>;
  critical?: boolean; // If false, failure doesn't rollback entire transaction
}

export interface TransactionResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
  compensationsExecuted: string[];
}

/**
 * Execute a transaction with compensating actions
 */
export async function executeTransaction(steps: TransactionStep[]): Promise<TransactionResult> {
  const completedSteps: string[] = [];
  const stepResults: Record<string, any> = {};
  const compensationsExecuted: string[] = [];
  
  console.log(`[transaction] Starting transaction with ${steps.length} steps`);
  
  try {
    // Execute all steps
    for (const step of steps) {
      console.log(`[transaction] Executing step: ${step.name}`);
      
      try {
        const result = await step.execute();
        stepResults[step.name] = result;
        completedSteps.push(step.name);
        console.log(`[transaction] ✅ Step completed: ${step.name}`);
      } catch (error) {
        console.error(`[transaction] ❌ Step failed: ${step.name}`, error);
        
        // If this is a critical step, rollback all previous steps
        if (step.critical !== false) {
          console.log(`[transaction] Starting compensation for ${completedSteps.length} steps`);
          
          // Execute compensations in reverse order
          for (const stepName of [...completedSteps].reverse()) {
            const step = steps.find(s => s.name === stepName);
            if (step?.compensate) {
              try {
                console.log(`[transaction] Compensating step: ${stepName}`);
                await step.compensate(stepResults[stepName]);
                compensationsExecuted.push(stepName);
                console.log(`[transaction] ✅ Compensation completed: ${stepName}`);
              } catch (compError) {
                console.error(`[transaction] ❌ Compensation failed: ${stepName}`, compError);
                // Continue with other compensations even if one fails
              }
            }
          }
        }
        
        return {
          success: false,
          completedSteps,
          failedStep: step.name,
          error: error instanceof Error ? error.message : String(error),
          compensationsExecuted,
        };
      }
    }
    
    console.log(`[transaction] ✅ All ${steps.length} steps completed successfully`);
    
    return {
      success: true,
      completedSteps,
      compensationsExecuted: [],
    };
    
  } catch (error) {
    console.error(`[transaction] Unexpected error:`, error);
    
    return {
      success: false,
      completedSteps,
      error: error instanceof Error ? error.message : String(error),
      compensationsExecuted,
    };
  }
}

/**
 * Create order with full transaction support
 */
export async function createOrderTransaction(
  orderDto: CreateOrderDto,
  customerName: string,
  customerPhone: string,
  amount: number,
  cardMask?: string,
  npDelivery?: any
): Promise<TransactionResult> {
  const steps: TransactionStep[] = [
    {
      name: "create_sitniks_order",
      execute: async () => {
        const order = await createSitniksOrder(orderDto);
        if (!order) {
          throw new Error("Failed to create order in Sitniks CRM");
        }
        return order;
      },
      compensate: async (result) => {
        // Cancel the created order
        console.log(`[transaction] Cancelling Sitniks order: ${result.orderNumber}`);
        await updateSitniksOrder(result.orderNumber, "cancelled");
      },
      critical: true,
    },
    {
      name: "create_ttn",
      execute: async () => {
        if (!npDelivery) {
          console.log(`[transaction] No NP delivery data, skipping TTN creation`);
          return null;
        }
        
        const senderCityRef = process.env.NOVAPOSHTA_SENDER_CITY_REF;
        const senderWarehouseRef = process.env.NOVAPOSHTA_SENDER_WAREHOUSE_REF;
        const senderCounterpartyRef = process.env.NOVAPOSHTA_SENDER_COUNTERPARTY_REF;
        const senderContactRef = process.env.NOVAPOSHTA_SENDER_CONTACT_REF;
        const senderPhone = process.env.NOVAPOSHTA_SENDER_PHONE;

        if (!senderCityRef || !senderWarehouseRef || !senderCounterpartyRef || !senderContactRef || !senderPhone) {
          console.log(`[transaction] Missing sender NP data, skipping TTN creation`);
          return null;
        }

        const ttnResult = await createNovaPoshtaTTN({
          senderCityRef,
          senderWarehouseRef,
          senderCounterpartyRef,
          senderContactRef,
          senderPhone,
          recipientCityRef: npDelivery.cityRef,
          recipientWarehouseRef: npDelivery.departmentRef,
          recipientName: npDelivery.recipientName,
          recipientPhone: npDelivery.recipientPhone,
          description: npDelivery.description,
          weight: npDelivery.weight,
          cost: npDelivery.cost,
          seatsAmount: 1,
          paymentMethod: 'NonCash',
          payerType: 'Recipient',
        });
        
        if (!ttnResult.success) {
          throw new Error(`Failed to create TTN: ${ttnResult.error}`);
        }
        
        return ttnResult.ttn;
      },
      compensate: async (result) => {
        // TTN cancellation would require Nova Poshta API call
        // For now, we just log it
        if (result) {
          console.log(`[transaction] TTN ${result} created but transaction failed - manual cleanup required`);
        }
      },
      critical: false, // TTN failure doesn't cancel the order
    },
    {
      name: "send_notification",
      execute: async () => {
        const sitniksOrder = stepResults["create_sitniks_order"];
        const ttnNumber = stepResults["create_ttn"];
        
        const msg = [
          "✅ Оплата підтверджена!",
          "",
          `📋 Замовлення: #${sitniksOrder.orderNumber}`,
          `👤 Клієнт: ${customerName}`,
          `📞 Телефон: ${customerPhone}`,
          `💰 Сума: ${amount} грн`,
          ...(cardMask ? [`💳 Картка: ${cardMask}`] : []),
          ...(ttnNumber ? [`📦 ТТН: ${ttnNumber}`] : []),
        ].join("\n");
        
        await sendTelegramNotification(msg);
        return msg;
      },
      compensate: async () => {
        // Notifications don't need compensation
        console.log(`[transaction] Notification sent - no compensation needed`);
      },
      critical: false,
    },
  ];

  // Store step results for compensation
  const stepResults: Record<string, any> = {};
  
  // Override execute to store results
  steps.forEach(step => {
    const originalExecute = step.execute;
    step.execute = async () => {
      const result = await originalExecute();
      stepResults[step.name] = result;
      return result;
    };
  });

  return executeTransaction(steps);
}

/**
 * Add order to outbox with transaction support
 */
export async function addOrderToOutboxTransaction(
  orderDto: CreateOrderDto,
  customerName: string,
  customerPhone: string,
  amount: number,
  cardMask?: string,
  npDelivery?: any
): Promise<TransactionResult> {
  const steps: TransactionStep[] = [
    {
      name: "add_to_outbox",
      execute: async () => {
        const outboxId = await addToOutbox({
          type: "create_order",
          data: {
            orderDto,
            customerName,
            customerPhone,
            amount,
            cardMask,
            npDelivery,
          },
        });
        
        if (!outboxId) {
          throw new Error("Failed to add order to outbox");
        }
        
        return outboxId;
      },
      compensate: async (result) => {
        // Outbox items are stored as files - we could delete the file here
        console.log(`[transaction] Outbox item ${result} created - cleanup would be manual`);
      },
      critical: true,
    },
    {
      name: "send_initial_notification",
      execute: async () => {
        const msg = [
          "✅ Оплата отримана! Обробка...",
          "",
          `📋 Замовлення: ${orderDto.externalId || 'Unknown'}`,
          `👤 Клієнт: ${customerName}`,
          `📞 Телефон: ${customerPhone}`,
          `💰 Сума: ${amount} грн`,
          ...(cardMask ? [`💳 Картка: ${cardMask}`] : []),
          `🔄 Статус: Додано в чергу обробки`,
        ].join("\n");
        
        await sendTelegramNotification(msg);
        return msg;
      },
      compensate: async () => {
        console.log(`[transaction] Initial notification sent - no compensation needed`);
      },
      critical: false,
    },
  ];

  return executeTransaction(steps);
}
