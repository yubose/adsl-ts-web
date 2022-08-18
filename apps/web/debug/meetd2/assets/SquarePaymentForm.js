//TODO: paste code from step 2.1.1
const idempotency_key = uuidv4()
let paymentForm
//TODO: paste code from step 2.1.2
//Generate a random UUID as an idempotency key for the payment request
// length of idempotency_key should be less than 45
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
// onGetCardNonce is triggered when the "Pay $1.00" button is clicked
function onGetCardNonce(event) {
  console.log(event)
  // Don't submit the form until SqPaymentForm returns with a nonce
  event.preventDefault()
  // Request a nonce from the SqPaymentForm object
  paymentForm.requestCardNonce()
}
const sqNode___ = document.createElement('script')
sqNode___.type = 'text/javascript'
sqNode___.src = 'https://js.squareupsandbox.com/v2/paymentform'
sqNode___.onload = () => {
  // Create and initialize a payment form object
  paymentForm = new SqPaymentForm({
    // Initialize the payment form elements
    //TODO: Replace with your sandbox application ID
    applicationId: 'sandbox-sq0idb-NZW9Yiwvqiqf5zAaaoFQgA',
    inputClass: 'sq-input',
    autoBuild: false,
    // Customize the CSS for SqPaymentForm iframe elements
    inputStyles: [
      {
        fontSize: '16px',
        lineHeight: '24px',
        padding: '16px',
        placeholderColor: '#a0a0a0',
        backgroundColor: 'transparent',
      },
    ],
    // Initialize the credit card placeholders
    cardNumber: {
      elementId: 'sq-card-number',
      placeholder: 'Card Number',
    },
    cvv: {
      elementId: 'sq-cvv',
      placeholder: 'CVV',
    },
    expirationDate: {
      elementId: 'sq-expiration-date',
      placeholder: 'MM/YY',
    },
    postalCode: {
      elementId: 'sq-postal-code',
      placeholder: 'Postal',
    },
    // SqPaymentForm callback functions
    callbacks: {
      /*
       * callback function: cardNonceResponseReceived
       * Triggered when: SqPaymentForm completes a card nonce request
       */
      cardNonceResponseReceived: function (errors, nonce, cardData) {
        if (errors) {
          // Log errors from nonce generation to the browser developer console.
          console.error('Encountered errors:')
          errors.forEach(function (error) {
            console.error('  ' + error.message)
          })
          alert(
            'Encountered errors, check browser developer console for more details',
          )
          return
        }
        //TODO: Replace alert with code in step 2.1
        console.log(nonce)
        alert(`Please click continue to finish the payment`);
        // fetch('process-payment', {
        //   method: 'POST',
        //   headers: {
        //     Accept: 'application/json',
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     nonce: nonce,
        //     idempotency_key: idempotency_key,
        //     location_id: 'LQHN3A834S19Y',
        //   }),
        // })
        //   .catch((err) => {
        //     alert('Network error: ' + err)
        //   })
        //   .then((response) => {
        //     if (!response.ok) {
        //       return response
        //         .json()
        //         .then((errorInfo) => Promise.reject(errorInfo))
        //     }
        //     return response.json()
        //   })
        //   .then((data) => {
        //     console.log(data)
        //     alert(
        //       'Payment complete successfully!\nCheck browser developer console for more details',
        //     )
        //   })
        //   .catch((err) => {
        //     console.error(err)
        //     alert(
        //       'Payment failed to complete!\nCheck browser developer console for more details',
        //     )
        //   })
      },
    },
  })
  //TODO: paste code from step 1.1.4
  //TODO: paste code from step 1.1.5
  paymentForm.build()
}
document.body.appendChild(sqNode___)