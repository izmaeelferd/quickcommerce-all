# Razorpay
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/
-keepclasseswithmembers class * { public void onPayment*(...); }
# Stripe
-dontwarn com.stripe.android.pushProvisioning.**
-keep class com.stripe.android.** { *; }
# Flutter local notifications / Gson
-keep class com.dexterous.** { *; }
-keep class com.google.gson.** { *; }
