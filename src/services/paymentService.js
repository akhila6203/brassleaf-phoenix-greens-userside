import { initiateOrderPayment, verifyOrderPayment, } from "./orderService";

export { initiateOrderPayment };

export async function openPaytmCheckout(
  payment,
  onSuccess,
  onFailure
) {
  if (
    !payment?.txnToken ||
    !payment?.mid
  ) {
    throw new Error(
      "Invalid Paytm payment session."
    );
  }

  /*
   * Backend already returns correct
   * Paytm host/environment.
   */
  const host =
    payment.host ||
    (
      payment.environment ===
      "production"
        ? "https://securegw.paytm.in"
        : "https://securegw-stage.paytm.in"
    );

  console.log(
    "[Paytm payment session]",
    {
      mid:
        payment.mid,

      orderId:
        payment.orderId,

      amount:
        payment.amountFormatted ||
        payment.amount,

      environment:
        payment.environment,

      host,
    }
  );

  /*
   * Load Paytm official CheckoutJS
   */
  await loadPaytmScript(
    host,
    payment.mid
  );

  return new Promise(
    (resolve, reject) => {
      let settled = false;

      const fail =
        async (error) => {
          if (settled) {
            return;
          }

          settled = true;

          console.error(
            "[Paytm payment failure]",
            error
          );

          try {
            if (onFailure) {
              await onFailure(
                error
              );
            }
          } catch (
            callbackError
          ) {
            console.error(
              "[Paytm failure callback]",
              callbackError
            );
          }

          reject(error);
        };

      const config = {
        root: "",

        flow: "DEFAULT",

        data: {
          orderId:
            payment.orderId,

          token:
            payment.txnToken,

          tokenType:
            "TXN_TOKEN",

          amount:
            payment.amountFormatted ||
            String(
              payment.amount
            ),
        },

        handler: {
          notifyMerchant(
            eventName,
            data
          ) {
            console.log(
              "[Paytm event]",
              eventName,
              data
            );

            if (
              eventName ===
                "APP_CLOSED" &&
              !settled
            ) {
              fail(
                new Error(
                  "Payment window closed."
                )
              );
            }
          },

          async transactionStatus(
            data
          ) {
            if (settled) {
              return;
            }

            console.log(
              "[Paytm transaction status]",
              data
            );

            const success =
              data?.STATUS ===
                "TXN_SUCCESS" ||
              data?.status ===
                "SUCCESS";

            if (!success) {
              await fail(
                new Error(
                  data?.RESPMSG ||
                    "Payment was not completed."
                )
              );

              return;
            }

            try {
              /*
               * Browser success alone
               * is NOT final success.
               *
               * onSuccess internally
               * calls backend verification.
               */
              if (onSuccess) {
                await onSuccess(
                  data
                );
              }

              settled = true;

              resolve(data);
            } catch (error) {
              await fail(error);
            }
          },
        },
      };

      const checkout =
        window.Paytm?.CheckoutJS;

      if (!checkout) {
        fail(
          new Error(
            "Paytm CheckoutJS not loaded."
          )
        );

        return;
      }

      /*
       * Paytm CheckoutJS should be
       * initialized after onLoad.
       */
      const initialize =
        () => {
          checkout
            .init(config)
            .then(() => {
              console.log(
                "[Paytm] invoking checkout"
              );

              return checkout.invoke();
            })
            .catch((error) => {
              fail(error);
            });
        };

      if (
        typeof checkout.onLoad ===
        "function"
      ) {
        checkout.onLoad(
          initialize
        );
      } else {
        /*
         * fallback for CheckoutJS
         * builds where onLoad
         * isn't exposed
         */
        initialize();
      }
    }
  );
}

export async function payOrderWithPaytm(
  orderId,
  callbacks = {}
) {
  const payment =
    await initiateOrderPayment(
      orderId
    );

  console.log(
    "Paytm session:",
    {
      orderId,
      paytmOrderId:
        payment?.orderId,
      amount:
        payment?.amount,
    }
  );

  return openPaytmCheckout(
    payment,

    async (gatewayData) => {
      console.log(
        "Paytm browser success:",
        gatewayData
      );

      /*
       * Browser success alone is
       * NOT enough.
       *
       * Verify with our backend.
       */
      const verified =
        await verifyOrderPayment(
          orderId,
          payment.orderId
        );

      console.log(
        "Backend verified payment:",
        verified
      );

      if (!verified?.success) {
        throw new Error(
          verified?.message ||
          "Payment could not be verified."
        );
      }

      if (
        callbacks.onSuccess
      ) {
        await callbacks.onSuccess(
          verified,
          gatewayData
        );
      }

      return verified;
    },

    callbacks.onFailure
  );
}

// export async function payOrderWithPaytm(
//   orderId,
//   callbacks = {}
// ) {
//   const payment =
//     await initiateOrderPayment(
//       orderId
//     );

//   return openPaytmCheckout(
//     payment,

//     async (gatewayData) => {
//       const verified =
//         await verifyOrderPayment(
//           orderId,
//           payment.orderId
//         );

//       if (!verified?.success) {
//         throw new Error(
//           "Payment could not be verified."
//         );
//       }

//       if (callbacks.onSuccess) {
//         await callbacks.onSuccess(
//           verified,
//           gatewayData
//         );
//       }
//     },

//     callbacks.onFailure
//   );
// }


function loadPaytmScript(
  host,
  mid
) {
  const merchantId =
    String(mid || "").trim();

  if (!merchantId) {
    return Promise.reject(
      new Error(
        "Paytm merchant ID is missing."
      )
    );
  }

  const cleanHost =
    String(host || "")
      .replace(/\/$/, "");

  /*
   * IMPORTANT:
   *
   * Production:
   * https://securegw.paytm.in/
   * merchantpgpui/checkoutjs/merchants/MID.js
   *
   * Staging:
   * https://securegw-stage.paytm.in/
   * merchantpgpui/checkoutjs/merchants/MID.js
   */
  const src =
    `${cleanHost}` +
    `/merchantpgpui/checkoutjs/merchants/` +
    `${encodeURIComponent(merchantId)}.js`;

  console.log(
    "[Paytm Checkout JS URL]",
    src
  );

  /*
   * Already correctly loaded
   */
  if (
    window.Paytm?.CheckoutJS
  ) {
    return Promise.resolve();
  }

  /*
   * Remove previous Paytm scripts
   */
  document
    .querySelectorAll(
      "script[data-paytm-checkout]"
    )
    .forEach((node) => {
      node.remove();
    });

  return new Promise(
    (resolve, reject) => {
      const script =
        document.createElement(
          "script"
        );

      script.type =
        "application/javascript";

      script.src = src;

      script.async = true;

      script.crossOrigin =
        "anonymous";

      script.dataset.paytmCheckout =
        merchantId;

      script.onload = () => {
        console.log(
          "[Paytm] checkout.js loaded"
        );

        if (
          window.Paytm?.CheckoutJS
        ) {
          resolve();

          return;
        }

        reject(
          new Error(
            "Paytm CheckoutJS is unavailable after script load."
          )
        );
      };

      script.onerror = (
        error
      ) => {
        console.error(
          "[Paytm] checkout script load failed",
          {
            src,
            error,
          }
        );

        reject(
          new Error(
            "Unable to load Paytm checkout."
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}
// function loadPaytmScript(host, mid) {
//   const merchantId = String(mid || "").trim();

//   if (!merchantId) {
//     return Promise.reject(new Error("Paytm merchant ID is missing."));
//   }

//   const src = `${host}/merchantpgpui/checkoutjs/merchants/${encodeURIComponent(
//     merchantId
//   )}/checkout.js`;

//   const existing = document.querySelector(
//     `script[data-paytm-checkout="${merchantId}"]`
//   );

//   if (existing && window.Paytm?.CheckoutJS) {
//     return Promise.resolve();
//   }

//   if (existing) {
//     return new Promise((resolve, reject) => {
//       existing.addEventListener("load", () => resolve());
//       existing.addEventListener("error", () =>
//         reject(new Error("Unable to load Paytm checkout."))
//       );
//     });
//   }

//   document
//     .querySelectorAll('script[data-paytm-checkout]')
//     .forEach((node) => node.remove());

//   delete window.Paytm;

//   return new Promise((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = src;
//     script.async = true;
//     script.dataset.paytmCheckout = merchantId;
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error("Unable to load Paytm checkout."));
//     document.body.appendChild(script);
//   });
// }



// import { initiateOrderPayment } from "./orderService";

// export { initiateOrderPayment };

// export async function openPaytmCheckout(payment, onSuccess, onFailure) {
//   if (!payment?.txnToken || !payment?.mid) {
//     throw new Error("Invalid Paytm payment session.");
//   }

//   const host =
//     payment.host ||
//     (payment.environment === "production"
//       ? "https://securegw.paytm.in"
//       : "https://securegw-stage.paytm.in");

//   await loadPaytmScript(host, payment.mid);

//   return new Promise((resolve, reject) => {
//     const config = {
//       root: "",
//       flow: "DEFAULT",
//       data: {
//         orderId: payment.orderId,
//         token: payment.txnToken,
//         tokenType: "TXN_TOKEN",
//         amount: payment.amountFormatted || String(payment.amount),
//       },
//       handler: {
//         notifyMerchant(eventName) {
//           if (eventName === "APP_CLOSED") {
//             const error = new Error("Payment window closed.");
//             onFailure?.(error);
//             reject(error);
//           }
//         },
//         transactionStatus(data) {
//           if (data?.STATUS === "TXN_SUCCESS" || data?.status === "SUCCESS") {
//             onSuccess?.(data);
//             resolve(data);
//             return;
//           }

//           const error = new Error(
//             data?.RESPMSG || "Payment was not completed."
//           );
//           onFailure?.(error);
//           reject(error);
//         },
//       },
//     };

//     if (!window.Paytm?.CheckoutJS) {
//       const error = new Error("Paytm checkout script failed to load.");
//       reject(error);
//       return;
//     }

//     window.Paytm.CheckoutJS.init(config)
//       .then(() => window.Paytm.CheckoutJS.invoke())
//       .catch((error) => {
//         onFailure?.(error);
//         reject(error);
//       });
//   });
// }

// export async function payOrderWithPaytm(orderId, callbacks = {}) {
//   const payment = await initiateOrderPayment(orderId);

//   return openPaytmCheckout(
//     payment,
//     callbacks.onSuccess,
//     callbacks.onFailure
//   );
// }

// function loadPaytmScript(host, mid) {
//   const merchantId = String(mid || "").trim();

//   if (!merchantId) {
//     return Promise.reject(new Error("Paytm merchant ID is missing."));
//   }

//   const src = `${host}/merchantpgpui/checkoutjs/merchants/${encodeURIComponent(
//     merchantId
//   )}/checkout.js`;

//   const existing = document.querySelector(
//     `script[data-paytm-checkout="${merchantId}"]`
//   );

//   if (existing && window.Paytm?.CheckoutJS) {
//     return Promise.resolve();
//   }

//   if (existing) {
//     return new Promise((resolve, reject) => {
//       existing.addEventListener("load", () => resolve());
//       existing.addEventListener("error", () =>
//         reject(new Error("Unable to load Paytm checkout."))
//       );
//     });
//   }

//   document
//     .querySelectorAll('script[data-paytm-checkout]')
//     .forEach((node) => node.remove());

//   delete window.Paytm;

//   return new Promise((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = src;
//     script.async = true;
//     script.dataset.paytmCheckout = merchantId;
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error("Unable to load Paytm checkout."));
//     document.body.appendChild(script);
//   });
// }
