// src/validators/order.validator.js
import { z } from 'zod';

export const createOrderSchema = z.object({
  customerPhone: z.string().regex(/^\+91\d{10}$/),
  customerName: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative()
  })).min(1, 'At least one item required'),
  subtotal: z.number().nonnegative(),
  grandTotal: z.number().nonnegative(),
  paymentMethod: z.enum(['cod', 'upi', 'credit']).optional().default('cod'),
  source: z.enum(['chatbot', 'manual', 'phone']).optional().default('chatbot')
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
});
