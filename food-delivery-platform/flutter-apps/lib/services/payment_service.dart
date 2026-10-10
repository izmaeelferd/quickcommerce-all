import 'dart:async';

import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../models/json_utils.dart';
import 'api_service.dart';

/// Runs the gateway selected by the backend (`payment.provider` in /api/config).
class PaymentService {
  final ApiService _api = ApiService.instance;

  /// Returns true when the payment is verified by the backend.
  Future<bool> payForOrder(String orderId) async {
    final intent = await _api.createIntent({'orderId': orderId});
    return _run(intent, orderId: orderId);
  }

  Future<bool> topUpWallet(double amount) async {
    final intent = await _api.createIntent({'purpose': 'wallet_topup', 'amount': amount});
    return _run(intent);
  }

  Future<bool> _run(Map<String, dynamic> intent, {String? orderId}) async {
    final provider = toStr(intent['provider']);
    if (provider == 'stripe') return _stripe(intent, orderId: orderId);
    return _razorpay(intent, orderId: orderId);
  }

  Future<bool> _stripe(Map<String, dynamic> intent, {String? orderId}) async {
    Stripe.publishableKey = toStr(intent['publicKey']);
    await Stripe.instance.applySettings();
    final branding = toMap(intent['branding']);
    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        paymentIntentClientSecret: toStr(intent['clientSecret']),
        merchantDisplayName: toStr(branding['name']),
      ),
    );
    try {
      await Stripe.instance.presentPaymentSheet();
    } on StripeException {
      return false;
    }
    await _api.verifyPayment({if (orderId != null) 'orderId': orderId, 'intentId': intent['id']});
    return true;
  }

  Future<bool> _razorpay(Map<String, dynamic> intent, {String? orderId}) async {
    final completer = Completer<bool>();
    final rzp = Razorpay();
    rzp.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse r) async {
      try {
        await _api.verifyPayment({
          if (orderId != null) 'orderId': orderId,
          'intentId': r.orderId ?? intent['id'],
          'paymentId': r.paymentId,
          'signature': r.signature,
        });
        if (!completer.isCompleted) completer.complete(true);
      } catch (_) {
        if (!completer.isCompleted) completer.complete(false);
      }
    });
    rzp.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) {
      if (!completer.isCompleted) completer.complete(false);
    });
    rzp.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse r) {});
    final branding = toMap(intent['branding']);
    rzp.open({
      'key': intent['publicKey'] ?? intent['keyId'],
      'order_id': intent['id'],
      'amount': intent['amount'],
      'currency': intent['currency'],
      'name': branding['name'],
      'description': intent['orderNumber'] ?? '',
      'prefill': intent['prefill'] ?? {},
      'theme': {'color': branding['color']},
    });
    final result = await completer.future;
    rzp.clear();
    return result;
  }
}
