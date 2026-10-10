# Database Schema (MongoDB / Mongoose)

All collections have `createdAt` / `updatedAt`. `→` denotes an ObjectId reference.

Indexes are declared on the schemas and created explicitly at API start-up and by the seeder (`ensureIndexes()` in `config/database.js`), because Mongoose `autoIndex` is disabled in production.

## appconfigs (singleton, `key: "main"`)
| Field | Type | Notes |
|---|---|---|
| version | Number | Incremented on every admin save |
| theme | Object | primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor, successColor, warningColor, errorColor, vegColor, nonVegColor, darkModeDefault, fontFamily, appFontScale, buttonRadius, cardRadius, inputRadius, appIconUrl, splashLogoUrl, splashBackgroundColor, splashDuration, faviconUrl, adminLogoUrl |
| branding | Object | appName, appTagline, vendorAppName, deliveryAppName, supportEmail, supportPhone, websiteUrl, whatsappNumber, address, copyright, socialLinks{facebook, instagram, twitter, youtube, linkedin} |
| onboarding | Object | enabled, pages[{title, description, imageUrl, order}] |
| homeLayout | Array | {id, type (banner\|categories\|search\|restaurants\|offers\|cuisines\|featured\|topRated\|nearby\|reorder\|custom), enabled, order, title, titleKey, subtitle, layout (grid\|list\|carousel), columns, limit, filter{}, style{}} |
| features | Object<Boolean> | wallet, coupons, tipping, reviews, favorites, referral, liveTracking, chatWithVendor, deliveryPartnerTips, scheduleOrder, vegOnlyFilter, searchFilters, googleSignIn, appleSignIn, otpLogin, emailNotifications, smsNotifications, pushNotifications, onboarding, darkModeToggle, deliveryPhotoProof, deliveryOtp |
| businessRules | Object | currencySymbol, currencyCode, commissionPercent, deliveryFee{base, perKm, baseKm, freeAbove}, deliveryPartnerPayout{base, perKm, tipSharePercent}, taxPercent, taxLabel, packagingFee, platformFee, minOrderValue, maxTipPercent, tipPresets[], surgePricing{enabled, multiplier, reason}, radiusKm, cancellationWindowMinutes, cancellationPenaltyPercent, referralBonus, refereeBonus, walletMaxUsePercent, otpLogin, otpLength, autoAssignDelivery, vendorAcceptTimeoutMinutes, paymentTimeoutMinutes, etaBufferMinutes, etaMinutesPerKm, deliveryOtpLength, deliverySlots[{id,label,start,end,enabled}], paymentMethods{card, upi, wallet, cod, netbanking}, codMaxAmount, minPayoutAmount |
| legal | Object | privacyPolicy, termsAndConditions, refundPolicy, aboutUs (HTML) |
| languages / defaultLanguage | [String] / String | Enabled language codes |
| maintenance | Object | appInMaintenance, maintenanceMessage, maintenanceImageUrl, affectedApps[] |
| appVersions | Object | customer/vendor/delivery → {minVersion, latestVersion, forceUpdate, storeUrlAndroid, storeUrlIos} |
| updatedBy | → users | |

Missing keys are filled at read time from `backend/config/defaultConfig.js` (fallback only).

## translations
`code` (unique, ISO 639-1), `name`, `nativeName`, `isRTL`, `isActive`, `strings: Map<String,String>`.
Keys are dotted (`cart.view`); because Mongoose maps cannot store `.`, keys are stored with U+FF0E and decoded by model helpers (`getStrings`, `setString`, `encodeStrings`).

## banners
`title, subtitle, imageUrl*, placement (home|offers|restaurant|cart), linkType (none|restaurant|category|cuisine|url|coupon), linkValue, order, startDate, endDate, isActive, backgroundColor, clicks`.

## users
`name, email (unique sparse), phone (unique sparse), password (bcrypt, hidden), role (customer|vendor|delivery|admin|superadmin), adminRole → adminroles, avatar, addresses[{label, fullAddress, landmark, city, state, pincode, contactName, contactPhone, location GeoJSON Point, isDefault}], favorites → restaurants[], walletBalance, referralCode (unique), referredBy → users, referralRewarded, language, fcmTokens[], isVerified, isBanned, banReason, googleId, appleId, otp/otpExpires/otpAttempts/otpSentAt (hashed/hidden), resetAttempts (hidden), resetPasswordToken/Expires (hashed, hidden), refreshTokens[] (hashed, hidden), notificationPrefs{push,email,sms}, lastLoginAt`.

## adminroles
`name (unique), description, permissions[]` from: dashboard, users, vendors, restaurants, categories, orders, transactions, coupons, delivery, notifications, reports, config, banners, translations, legal, roles, settings.

## restaurants
`owner → users, name, slug (unique), description, logo, coverImage, images[], cuisines[], categories → categories[], phone, email, address{fullAddress, city, state, pincode}, location (2dsphere), isPureVeg, priceForTwo, avgPrepTimeMinutes, rating, ratingCount, status (pending|approved|suspended|rejected), statusReason, isOpen, acceptingOrders, timings[{day, open, close, closed}], commissionPercent (null = global), offerText, tags[], isFeatured, totalOrders, walletBalance (pending payout), bankDetails{}, licenseNumber, gstNumber`.
Indexes: `location 2dsphere`, text index on name/cuisines/tags/description.

## categories
`name, nameKey (optional translation key), type (category|cuisine), image, order, isActive` — unique (name, type).

## menucategories
`restaurant → restaurants, name, description, order, isActive`.

## menuitems
`restaurant, category → menucategories, name, description, price, discountPrice, image, isVeg, isAvailable, isBestseller, spiceLevel, tags[], order, addOns[{name, required, minSelect, maxSelect, options[{name, price, isVeg, isAvailable}]}]`. Virtual `effectivePrice`.

## orders
`orderNumber (unique), customer, restaurant, deliveryPartner → users, items[{menuItem, name, image, isVeg, unitPrice, quantity, addOns[{group,name,price}], instructions, lineTotal}], deliveryAddress (snapshot incl. location), distanceKm, pricing{currencyCode, currencySymbol, subtotal, deliveryFee, packagingFee, platformFee, surgeFee, tax, tip, discount, walletUsed, total, payable}, commission{percent, amount}, vendorEarning, deliveryEarning, coupon{code, discount, couponId}, payment{method, status, provider, intentId, paymentId, paidAt}, status, statusHistory[{status, at, by, note}], scheduledFor, deliverySlot, instructions, estimatedDeliveryAt, deliveryOtp (hidden), deliveryPhoto, cancelledBy, cancelReason, cancellationFee, refundAmount, isRated, rejectedByPartners[], deliveredAt`.
Business values are **snapshotted** at order time so later config changes never alter historical orders.

## transactions
`user, restaurant, order, type (payment|refund|wallet_credit|wallet_debit|referral_bonus|vendor_payout|delivery_payout|commission|cancellation_fee), direction (credit|debit), amount, currencyCode, method, provider, providerRef, status (pending|success|failed), description, meta`.

## coupons
`code (unique, upper), title, description, discountType (percent|flat|free_delivery), value, maxDiscount, minOrderValue, validFrom, validTo, usageLimit, perUserLimit, usedCount, usedBy[{user, count}], restaurant (null = all), firstOrderOnly, isActive, showInOffers, bannerImage, createdBy`.

## reviews
`user, restaurant, order (unique), deliveryPartner, rating 1-5, deliveryRating, comment, images[], reply{text, at}, isVisible`. Restaurant rating is recalculated on create/visibility change.

## deliverypartners
`user (unique), vehicleType (bicycle|bike|scooter|car), vehicleNumber, licenseNumber, documents[{name,url}], status (pending|approved|suspended|rejected), isOnline, currentLocation (2dsphere), lastLocationAt, activeOrder → orders, totalDeliveries, totalEarnings, walletBalance (pending payout), rating, ratingCount, bankDetails{}`.

## notifications
`user (null = broadcast), audience (user|all|customer|vendor|delivery), title, body, imageUrl, type, data, channels[], readBy[], isRead, sentBy`.
