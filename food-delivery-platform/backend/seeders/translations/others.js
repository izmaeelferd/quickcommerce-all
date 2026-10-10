/* eslint-disable max-len, quote-props */
/**
 * Core customer-facing strings for additional languages. Any key not listed here falls back
 * to the default language automatically (merged server-side by GET /api/config/translations/:lang).
 * Complete the rest from Admin → Language Manager ("Only missing" filter).
 */
const KEYS = [
  'nav.home', 'nav.search', 'nav.orders', 'nav.profile',
  'common.add', 'common.apply', 'common.cancel', 'common.change', 'common.close', 'common.confirm', 'common.continue', 'common.delete', 'common.done', 'common.edit', 'common.loading', 'common.next', 'common.retry', 'common.save', 'common.search', 'common.seeAll', 'common.skip', 'common.km', 'common.minutes',
  'error.generic', 'error.network',
  'auth.welcome', 'auth.login', 'auth.logout', 'auth.signUp', 'auth.noAccount', 'auth.or', 'auth.name', 'auth.email', 'auth.phone', 'auth.emailOrPhone', 'auth.password', 'auth.sendOtp', 'auth.verifyOtp', 'auth.verify', 'auth.resendOtp', 'auth.forgotPassword', 'auth.continueGoogle', 'auth.continueApple', 'auth.invalidCredentials', 'auth.invalidOtp',
  'home.searchHint', 'home.categories', 'home.offers', 'home.featured', 'home.cuisines', 'home.topRated', 'home.allRestaurants', 'home.deliverTo', 'home.addAddress', 'search.noResults', 'filter.vegOnly',
  'restaurant.closedNow', 'restaurant.pureVeg', 'restaurant.reviews', 'restaurant.priceForTwo', 'menu.veg', 'menu.nonVeg', 'menu.bestseller', 'menu.recommended', 'menu.unavailable',
  'cart.title', 'cart.empty', 'cart.view', 'cart.itemsCount', 'cart.applyCoupon', 'cart.billDetails', 'cart.itemTotal', 'cart.discount', 'cart.deliveryFee', 'cart.packagingFee', 'cart.taxShort', 'cart.tip', 'cart.total', 'cart.toPay', 'cart.proceed', 'cart.selectAddress', 'cart.tipTitle',
  'payment.title', 'payment.placeOrder', 'payment.method.card', 'payment.method.upi', 'payment.method.wallet', 'payment.method.cod', 'payment.method.netbanking', 'payment.failed', 'payment.success',
  'order.placedTitle', 'order.track', 'order.backHome', 'order.number', 'order.cancel', 'order.reorder', 'order.noOrders', 'order.rate', 'order.yourRider', 'order.eta',
  'status.placed', 'status.accepted', 'status.preparing', 'status.ready', 'status.picked', 'status.delivered', 'status.cancelled', 'status.rejected',
  'address.title', 'address.add', 'address.home', 'address.work', 'address.other', 'address.full', 'address.useCurrent',
  'profile.edit', 'profile.addresses', 'profile.favorites', 'profile.wallet', 'profile.referral', 'profile.offers',
  'wallet.balance', 'wallet.addMoney', 'notifications.title', 'notifications.empty',
  'settings.title', 'settings.language', 'settings.theme', 'settings.theme_system', 'settings.theme_light', 'settings.theme_dark',
  'legal.about', 'legal.terms', 'legal.privacy', 'legal.refund', 'maintenance.title', 'onboarding.getStarted', 'offer.freeDelivery', 'offer.percentOff', 'offer.useCode',
];

const T = {
  hi: ['होम', 'खोजें', 'ऑर्डर', 'प्रोफ़ाइल',
    'जोड़ें', 'लागू करें', 'रद्द करें', 'बदलें', 'बंद करें', 'पुष्टि करें', 'जारी रखें', 'हटाएँ', 'हो गया', 'संपादित करें', 'लोड हो रहा है…', 'आगे', 'फिर से कोशिश करें', 'सेव करें', 'खोजें', 'सभी देखें', 'छोड़ें', '{value} कि.मी.', '{value} मिनट',
    'कुछ गलत हो गया। कृपया फिर से कोशिश करें।', 'सर्वर से कनेक्ट नहीं हो सका।',
    '{app} में आपका स्वागत है', 'लॉग इन करें', 'लॉग आउट', 'साइन अप करें', 'खाता नहीं है?', 'या', 'पूरा नाम', 'ईमेल', 'फ़ोन नंबर', 'ईमेल या फ़ोन', 'पासवर्ड', 'OTP भेजें', 'अपना नंबर सत्यापित करें', 'सत्यापित करें', 'कोड फिर से भेजें', 'पासवर्ड भूल गए?', 'Google के साथ जारी रखें', 'Apple के साथ जारी रखें', 'गलत लॉगिन विवरण', 'गलत या समाप्त कोड',
    'रेस्टोरेंट, व्यंजन या डिश खोजें', 'आज क्या खाना है?', 'बेहतरीन ऑफ़र', 'विशेष रेस्टोरेंट', 'लोकप्रिय व्यंजन', 'टॉप रेटेड', 'सभी रेस्टोरेंट', 'डिलीवरी पता', 'डिलीवरी पता जोड़ें', 'कोई रेस्टोरेंट नहीं मिला', 'केवल शाकाहारी',
    'अभी बंद है', 'शुद्ध शाकाहारी', 'समीक्षाएँ', 'दो लोगों के लिए {price}', 'शाकाहारी', 'मांसाहारी', 'बेस्टसेलर', 'सुझाए गए', 'अभी उपलब्ध नहीं',
    'कार्ट', 'आपका कार्ट खाली है', 'कार्ट देखें', '{count} आइटम · {total}', 'कूपन लगाएँ', 'बिल विवरण', 'आइटम कुल', 'छूट', 'डिलीवरी शुल्क ({km} कि.मी.)', 'पैकेजिंग', 'टैक्स', 'डिलीवरी टिप', 'कुल राशि', 'भुगतान करें', 'भुगतान करें · {total}', 'डिलीवरी पता चुनें', 'अपने डिलीवरी पार्टनर को टिप दें',
    'भुगतान', 'ऑर्डर करें', 'क्रेडिट / डेबिट कार्ड', 'UPI', 'वॉलेट', 'कैश ऑन डिलीवरी', 'नेट बैंकिंग', 'भुगतान विफल', 'भुगतान सफल',
    'ऑर्डर हो गया!', 'ऑर्डर ट्रैक करें', 'होम पर जाएँ', 'ऑर्डर #{number}', 'ऑर्डर रद्द करें', 'फिर से ऑर्डर करें', 'अभी तक कोई ऑर्डर नहीं', 'इस ऑर्डर को रेट करें', 'आपका डिलीवरी पार्टनर', '{time} तक पहुँचेगा',
    'ऑर्डर हुआ', 'स्वीकृत', 'तैयार हो रहा है', 'पिकअप के लिए तैयार', 'रास्ते में', 'डिलीवर हो गया', 'रद्द', 'अस्वीकृत',
    'पते', 'पता जोड़ें', 'घर', 'ऑफ़िस', 'अन्य', 'पूरा पता', 'वर्तमान स्थान का उपयोग करें',
    'प्रोफ़ाइल संपादित करें', 'सेव किए गए पते', 'पसंदीदा', 'वॉलेट', 'रेफ़र करें और कमाएँ', 'ऑफ़र',
    'वॉलेट बैलेंस', 'पैसे जोड़ें', 'सूचनाएँ', 'कोई नई सूचना नहीं',
    'सेटिंग्स', 'भाषा', 'दिखावट', 'सिस्टम', 'लाइट', 'डार्क',
    'हमारे बारे में', 'नियम और शर्तें', 'गोपनीयता नीति', 'रिफ़ंड नीति', 'हम जल्द वापस आएँगे', 'शुरू करें', 'फ़्री डिलीवरी', '{percent}% छूट', 'कोड {code} का उपयोग करें'],
  es: ['Inicio', 'Buscar', 'Pedidos', 'Perfil',
    'Añadir', 'Aplicar', 'Cancelar', 'Cambiar', 'Cerrar', 'Confirmar', 'Continuar', 'Eliminar', 'Listo', 'Editar', 'Cargando…', 'Siguiente', 'Reintentar', 'Guardar', 'Buscar', 'Ver todo', 'Omitir', '{value} km', '{value} min',
    'Algo salió mal. Inténtalo de nuevo.', 'No se puede conectar con el servidor.',
    'Bienvenido a {app}', 'Iniciar sesión', 'Cerrar sesión', 'Registrarse', '¿No tienes cuenta?', 'o', 'Nombre completo', 'Correo electrónico', 'Teléfono', 'Correo o teléfono', 'Contraseña', 'Enviar código', 'Verifica tu número', 'Verificar y continuar', 'Reenviar código', '¿Olvidaste tu contraseña?', 'Continuar con Google', 'Continuar con Apple', 'Datos de acceso incorrectos', 'Código inválido o caducado',
    'Busca restaurantes, cocinas o platos', '¿Qué se te antoja?', 'Mejores ofertas', 'Restaurantes destacados', 'Cocinas populares', 'Mejor valorados', 'Todos los restaurantes', 'Entregar en', 'Añade una dirección de entrega', 'Ningún restaurante coincide', 'Solo vegetariano',
    'Cerrado ahora', 'Totalmente vegetariano', 'Reseñas', '{price} para dos', 'Vegetariano', 'No vegetariano', 'Más vendido', 'Recomendados', 'No disponible',
    'Carrito', 'Tu carrito está vacío', 'Ver carrito', '{count} artículos · {total}', 'Aplicar cupón', 'Detalle de la factura', 'Total de artículos', 'Descuento', 'Envío ({km} km)', 'Empaque', 'Impuestos', 'Propina', 'Total', 'A pagar', 'Pagar · {total}', 'Selecciona la dirección', 'Deja una propina a tu repartidor',
    'Pago', 'Realizar pedido', 'Tarjeta de crédito / débito', 'UPI', 'Monedero', 'Pago contra entrega', 'Banca en línea', 'El pago falló', 'Pago realizado',
    '¡Pedido realizado!', 'Seguir pedido', 'Volver al inicio', 'Pedido #{number}', 'Cancelar pedido', 'Volver a pedir', 'Aún no tienes pedidos', 'Califica este pedido', 'Tu repartidor', 'Llega a las {time}',
    'Pedido realizado', 'Aceptado', 'En preparación', 'Listo para recoger', 'En camino', 'Entregado', 'Cancelado', 'Rechazado',
    'Direcciones', 'Añadir dirección', 'Casa', 'Trabajo', 'Otra', 'Dirección completa', 'Usar ubicación actual',
    'Editar perfil', 'Direcciones guardadas', 'Favoritos', 'Monedero', 'Invita y gana', 'Ofertas',
    'Saldo del monedero', 'Añadir dinero', 'Notificaciones', 'Estás al día',
    'Ajustes', 'Idioma', 'Apariencia', 'Sistema', 'Claro', 'Oscuro',
    'Sobre nosotros', 'Términos y condiciones', 'Política de privacidad', 'Política de reembolso', 'Volvemos pronto', 'Comenzar', 'Envío gratis', '{percent}% de descuento', 'Usa el código {code}'],
  ar: ['الرئيسية', 'بحث', 'الطلبات', 'حسابي',
    'إضافة', 'تطبيق', 'إلغاء', 'تغيير', 'إغلاق', 'تأكيد', 'متابعة', 'حذف', 'تم', 'تعديل', 'جارٍ التحميل…', 'التالي', 'إعادة المحاولة', 'حفظ', 'بحث', 'عرض الكل', 'تخطي', '{value} كم', '{value} دقيقة',
    'حدث خطأ ما. حاول مرة أخرى.', 'تعذر الاتصال بالخادم.',
    'مرحبًا بك في {app}', 'تسجيل الدخول', 'تسجيل الخروج', 'إنشاء حساب', 'ليس لديك حساب؟', 'أو', 'الاسم الكامل', 'البريد الإلكتروني', 'رقم الهاتف', 'البريد أو الهاتف', 'كلمة المرور', 'إرسال الرمز', 'تحقق من رقمك', 'تحقق ومتابعة', 'إعادة إرسال الرمز', 'نسيت كلمة المرور؟', 'المتابعة مع Google', 'المتابعة مع Apple', 'بيانات الدخول غير صحيحة', 'رمز غير صالح أو منتهي',
    'ابحث عن مطاعم أو مأكولات أو أطباق', 'ماذا تريد أن تأكل؟', 'أفضل العروض', 'مطاعم مميزة', 'مأكولات شائعة', 'الأعلى تقييمًا', 'جميع المطاعم', 'التوصيل إلى', 'أضف عنوان التوصيل', 'لا توجد مطاعم مطابقة', 'نباتي فقط',
    'مغلق حاليًا', 'نباتي بالكامل', 'التقييمات', '{price} لشخصين', 'نباتي', 'غير نباتي', 'الأكثر مبيعًا', 'مقترحات', 'غير متوفر حاليًا',
    'السلة', 'سلتك فارغة', 'عرض السلة', '{count} عناصر · {total}', 'تطبيق قسيمة', 'تفاصيل الفاتورة', 'إجمالي العناصر', 'الخصم', 'رسوم التوصيل ({km} كم)', 'التغليف', 'الضرائب', 'إكرامية', 'الإجمالي', 'المبلغ المستحق', 'ادفع · {total}', 'اختر عنوان التوصيل', 'قدّم إكرامية لمندوب التوصيل',
    'الدفع', 'تأكيد الطلب', 'بطاقة ائتمان / خصم', 'UPI', 'المحفظة', 'الدفع عند الاستلام', 'الخدمات المصرفية عبر الإنترنت', 'فشل الدفع', 'تم الدفع بنجاح',
    'تم الطلب!', 'تتبع الطلب', 'العودة للرئيسية', 'الطلب #{number}', 'إلغاء الطلب', 'إعادة الطلب', 'لا توجد طلبات بعد', 'قيّم هذا الطلب', 'مندوب التوصيل', 'يصل بحلول {time}',
    'تم الطلب', 'مقبول', 'قيد التحضير', 'جاهز للاستلام', 'في الطريق', 'تم التوصيل', 'ملغى', 'مرفوض',
    'العناوين', 'إضافة عنوان', 'المنزل', 'العمل', 'آخر', 'العنوان الكامل', 'استخدم موقعي الحالي',
    'تعديل الملف', 'العناوين المحفوظة', 'المفضلة', 'المحفظة', 'ادعُ واربح', 'العروض',
    'رصيد المحفظة', 'إضافة رصيد', 'الإشعارات', 'لا توجد إشعارات جديدة',
    'الإعدادات', 'اللغة', 'المظهر', 'النظام', 'فاتح', 'داكن',
    'من نحن', 'الشروط والأحكام', 'سياسة الخصوصية', 'سياسة الاسترداد', 'سنعود قريبًا', 'ابدأ', 'توصيل مجاني', 'خصم {percent}%', 'استخدم الرمز {code}'],
  fr: ['Accueil', 'Recherche', 'Commandes', 'Profil',
    'Ajouter', 'Appliquer', 'Annuler', 'Modifier', 'Fermer', 'Confirmer', 'Continuer', 'Supprimer', 'Terminé', 'Modifier', 'Chargement…', 'Suivant', 'Réessayer', 'Enregistrer', 'Rechercher', 'Tout voir', 'Passer', '{value} km', '{value} min',
    'Une erreur est survenue. Veuillez réessayer.', 'Impossible de joindre le serveur.',
    'Bienvenue sur {app}', 'Se connecter', 'Se déconnecter', "S'inscrire", "Pas encore de compte ?", 'ou', 'Nom complet', 'E-mail', 'Téléphone', 'E-mail ou téléphone', 'Mot de passe', 'Envoyer le code', 'Vérifiez votre numéro', 'Vérifier et continuer', 'Renvoyer le code', 'Mot de passe oublié ?', 'Continuer avec Google', 'Continuer avec Apple', 'Identifiants incorrects', 'Code invalide ou expiré',
    'Rechercher restaurants, cuisines ou plats', 'Une envie ?', 'Meilleures offres', 'Restaurants en vedette', 'Cuisines populaires', 'Les mieux notés', 'Tous les restaurants', 'Livrer à', 'Ajoutez une adresse de livraison', 'Aucun restaurant trouvé', 'Végétarien uniquement',
    'Fermé actuellement', '100 % végétarien', 'Avis', '{price} pour deux', 'Végétarien', 'Non végétarien', 'Meilleure vente', 'Recommandés', 'Indisponible',
    'Panier', 'Votre panier est vide', 'Voir le panier', '{count} articles · {total}', 'Appliquer un code promo', 'Détail de la facture', 'Total des articles', 'Réduction', 'Livraison ({km} km)', 'Emballage', 'Taxes', 'Pourboire', 'Total', 'À payer', 'Payer · {total}', "Choisir l'adresse", 'Laissez un pourboire à votre livreur',
    'Paiement', 'Commander', 'Carte de crédit / débit', 'UPI', 'Portefeuille', 'Paiement à la livraison', 'Virement en ligne', 'Échec du paiement', 'Paiement réussi',
    'Commande passée !', 'Suivre la commande', "Retour à l'accueil", 'Commande n°{number}', 'Annuler la commande', 'Commander à nouveau', 'Aucune commande pour le moment', 'Noter cette commande', 'Votre livreur', 'Arrivée vers {time}',
    'Commande passée', 'Acceptée', 'En préparation', 'Prête', 'En livraison', 'Livrée', 'Annulée', 'Refusée',
    'Adresses', 'Ajouter une adresse', 'Domicile', 'Travail', 'Autre', 'Adresse complète', 'Utiliser ma position',
    'Modifier le profil', 'Adresses enregistrées', 'Favoris', 'Portefeuille', 'Parrainage', 'Offres',
    'Solde du portefeuille', "Ajouter de l'argent", 'Notifications', 'Vous êtes à jour',
    'Paramètres', 'Langue', 'Apparence', 'Système', 'Clair', 'Sombre',
    'À propos', 'Conditions générales', 'Politique de confidentialité', 'Politique de remboursement', 'Nous revenons bientôt', 'Commencer', 'Livraison gratuite', '-{percent} %', 'Utilisez le code {code}'],
};

const META = {
  hi: { name: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
  es: { name: 'Spanish', nativeName: 'Español', isRTL: false },
  ar: { name: 'Arabic', nativeName: 'العربية', isRTL: true },
  fr: { name: 'French', nativeName: 'Français', isRTL: false },
};

Object.entries(T).forEach(([code, values]) => {
  if (values.length !== KEYS.length) throw new Error(`translations/${code}: expected ${KEYS.length} values, got ${values.length}`);
});

module.exports = Object.fromEntries(
  Object.entries(T).map(([code, values]) => [code, { ...META[code], strings: Object.fromEntries(KEYS.map((k, i) => [k, values[i]])) }])
);
