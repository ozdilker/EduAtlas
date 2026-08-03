import type { PaymentOrderRepository } from "@eduatlas/application";
import {
  createPaymentOrder,
  type BillingPeriod,
  type PaymentOrder,
  type PaymentOrderStatus,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const PAYMENT_ORDERS_COLLECTION = "payment_orders";

type FirestorePaymentOrderDocument = {
  merchantOid: string;
  institutionId: string;
  planCode: string;
  billingPeriod: string;
  amountTry: number;
  amountKurus: number;
  status: string;
  paytrStatus?: string;
  totalAmountKurus?: number;
  createdAt: string;
  updatedAt: string;
};

function fromDocument(data: FirestorePaymentOrderDocument): PaymentOrder {
  return createPaymentOrder({
    merchantOid: data.merchantOid,
    institutionId: data.institutionId,
    planCode: data.planCode,
    billingPeriod: data.billingPeriod as BillingPeriod,
    amountTry: data.amountTry,
    status: data.status as PaymentOrderStatus,
    ...(data.paytrStatus ? { paytrStatus: data.paytrStatus } : {}),
    ...(typeof data.totalAmountKurus === "number"
      ? { totalAmountKurus: data.totalAmountKurus }
      : {}),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

function toDocument(order: PaymentOrder): FirestorePaymentOrderDocument {
  return {
    merchantOid: order.merchantOid,
    institutionId: order.institutionId,
    planCode: order.planCode,
    billingPeriod: order.billingPeriod,
    amountTry: order.amountTry,
    amountKurus: order.amountKurus,
    status: order.status,
    ...(order.paytrStatus ? { paytrStatus: order.paytrStatus } : {}),
    ...(typeof order.totalAmountKurus === "number"
      ? { totalAmountKurus: order.totalAmountKurus }
      : {}),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export class FirestorePaymentOrderRepository implements PaymentOrderRepository {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = PAYMENT_ORDERS_COLLECTION,
  ) {}

  private collection() {
    return this.db.collection(this.collectionPath);
  }

  async getByMerchantOid(merchantOid: string): Promise<PaymentOrder | null> {
    const id = merchantOid.trim();
    if (!id) return null;
    countFirestoreRead();
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    return fromDocument(snap.data() as FirestorePaymentOrderDocument);
  }

  async save(order: PaymentOrder): Promise<PaymentOrder> {
    countFirestoreWrite();
    await this.collection().doc(order.merchantOid).set(toDocument(order), { merge: false });
    return order;
  }
}

export function createFirestorePaymentOrderRepository(db: Firestore): PaymentOrderRepository {
  return new FirestorePaymentOrderRepository(db);
}
