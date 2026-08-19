import { paymentService } from "./index";
export async function startCashfreeCheckout(teamId) {
    const order = await paymentService.createOrder({ teamId });
    const { load } = await import("@cashfreepayments/cashfree-js");
    const cashfree = await load({ mode: order.mode });
    await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_self",
    });
    return order;
}
export const verifyPayment = paymentService.verify;
export const createPaymentOrder = paymentService.createOrder;
