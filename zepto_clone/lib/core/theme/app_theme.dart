import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ZamzaColors {
  static const primary = Color(0xFFFF6A00);
  static const secondary = Color(0xFFFF8C1A);
  static const accent = Color(0xFF111111);
  static const background = Color(0xFFF8F8F8);
  static const card = Color(0xFFFFFFFF);
  static const success = Color(0xFF22C55E);
  static const error = Color(0xFFEF4444);
  static const grey100 = Color(0xFFF1F1F1);
  static const grey200 = Color(0xFFE0E0E0);
  static const grey500 = Color(0xFF9E9E9E);
  static const grey800 = Color(0xFF424242);
}

class ZamzaText {
  static final heading1 = GoogleFonts.poppins(
    fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: -0.5, color: ZamzaColors.accent);
  static final heading2 = GoogleFonts.poppins(
    fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -0.3, color: ZamzaColors.accent);
  static final heading3 = GoogleFonts.poppins(
    fontSize: 18, fontWeight: FontWeight.w600, color: ZamzaColors.accent);
  static final body = GoogleFonts.inter(
    fontSize: 14, fontWeight: FontWeight.w400, color: ZamzaColors.grey800);
  static final caption = GoogleFonts.inter(
    fontSize: 12, fontWeight: FontWeight.w400, color: ZamzaColors.grey500);
  static final price = GoogleFonts.poppins(
    fontSize: 18, fontWeight: FontWeight.bold, color: ZamzaColors.primary);
  static final button = GoogleFonts.poppins(
    fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white);
}

class ZamzaSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class ZamzaRadius {
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}

class ZamzaShadows {
  static const card = BoxShadow(
    color: Color(0x1A000000), blurRadius: 20, offset: Offset(0, 2));
  static const floating = BoxShadow(
    color: Color(0x1A000000), blurRadius: 40, offset: Offset(0, 8));
}