import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/app_config.dart';

/// Parses "#RRGGBB" / "#AARRGGBB" / "RRGGBB". Returns [fallback] on failure.
Color hexColor(String? hex, [Color fallback = Colors.grey]) {
  if (hex == null || hex.isEmpty) return fallback;
  var h = hex.replaceAll('#', '').trim();
  if (h.length == 3) h = h.split('').map((c) => '$c$c').join();
  if (h.length == 6) h = 'FF$h';
  final v = int.tryParse(h, radix: 16);
  return v == null ? fallback : Color(v);
}

/// Semantic colors that are not part of Material's ColorScheme, all from config.
class AppColors extends ThemeExtension<AppColors> {
  final Color success, warning, veg, nonVeg, accent;
  final double cardRadius, buttonRadius, inputRadius;

  const AppColors({
    required this.success,
    required this.warning,
    required this.veg,
    required this.nonVeg,
    required this.accent,
    required this.cardRadius,
    required this.buttonRadius,
    required this.inputRadius,
  });

  @override
  AppColors copyWith(
          {Color? success, Color? warning, Color? veg, Color? nonVeg, Color? accent, double? cardRadius, double? buttonRadius, double? inputRadius}) =>
      AppColors(
        success: success ?? this.success,
        warning: warning ?? this.warning,
        veg: veg ?? this.veg,
        nonVeg: nonVeg ?? this.nonVeg,
        accent: accent ?? this.accent,
        cardRadius: cardRadius ?? this.cardRadius,
        buttonRadius: buttonRadius ?? this.buttonRadius,
        inputRadius: inputRadius ?? this.inputRadius,
      );

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      veg: Color.lerp(veg, other.veg, t)!,
      nonVeg: Color.lerp(nonVeg, other.nonVeg, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      cardRadius: cardRadius + (other.cardRadius - cardRadius) * t,
      buttonRadius: buttonRadius + (other.buttonRadius - buttonRadius) * t,
      inputRadius: inputRadius + (other.inputRadius - inputRadius) * t,
    );
  }

  static AppColors of(BuildContext context) => Theme.of(context).extension<AppColors>()!;
}

/// Builds the complete ThemeData from the remote [ThemeConfig].
class DynamicTheme {
  static ThemeData build(ThemeConfig t, {required Brightness brightness}) {
    final primary = hexColor(t.primaryColor);
    final secondary = hexColor(t.secondaryColor);
    final error = hexColor(t.errorColor);
    final isDark = brightness == Brightness.dark;

    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      primary: primary,
      secondary: secondary,
      error: error,
      surface: isDark ? null : hexColor(t.backgroundColor),
      onSurface: isDark ? null : hexColor(t.textColor),
    );

    TextTheme text;
    try {
      text = GoogleFonts.getTextTheme(t.fontFamily, ThemeData(brightness: brightness).textTheme);
    } catch (_) {
      text = ThemeData(brightness: brightness).textTheme;
    }

    final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(t.buttonRadius));
    final inputBorder = OutlineInputBorder(borderRadius: BorderRadius.circular(t.inputRadius));
    final surfaceVariant = isDark ? scheme.surfaceContainerHighest : hexColor(t.surfaceColor);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      textTheme: text,
      scaffoldBackgroundColor: isDark ? scheme.surface : hexColor(t.backgroundColor),
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? scheme.surface : hexColor(t.backgroundColor),
        foregroundColor: isDark ? scheme.onSurface : hexColor(t.textColor),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surfaceVariant,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(t.cardRadius)),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: scheme.onPrimary,
          minimumSize: const Size.fromHeight(50),
          shape: buttonShape,
          textStyle: text.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(foregroundColor: primary, minimumSize: const Size.fromHeight(50), shape: buttonShape, side: BorderSide(color: primary)),
      ),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: primary)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: inputBorder.copyWith(borderSide: BorderSide.none),
        enabledBorder: inputBorder.copyWith(borderSide: BorderSide.none),
        focusedBorder: inputBorder.copyWith(borderSide: BorderSide(color: primary, width: 1.5)),
        errorBorder: inputBorder.copyWith(borderSide: BorderSide(color: error)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(t.buttonRadius))),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(selectedItemColor: primary, type: BottomNavigationBarType.fixed),
      navigationBarTheme: NavigationBarThemeData(indicatorColor: primary.withValues(alpha: 0.15)),
      floatingActionButtonTheme: FloatingActionButtonThemeData(backgroundColor: primary, foregroundColor: scheme.onPrimary),
      switchTheme: SwitchThemeData(thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? primary : null)),
      extensions: [
        AppColors(
          success: hexColor(t.successColor),
          warning: hexColor(t.warningColor),
          veg: hexColor(t.vegColor),
          nonVeg: hexColor(t.nonVegColor),
          accent: hexColor(t.accentColor),
          cardRadius: t.cardRadius,
          buttonRadius: t.buttonRadius,
          inputRadius: t.inputRadius,
        ),
      ],
    );
  }
}
