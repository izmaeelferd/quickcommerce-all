import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zepto_clone/core/theme/app_theme.dart';
import 'package:zepto_clone/main.dart' show Product; // adjust if needed

class ProductDetailPage extends StatefulWidget {
  final Product product;
  final bool isFavorite;
  final VoidCallback onFavoriteToggle;
  final Function(Product) onAddToCart;
  final Map<String, int> cart;

  const ProductDetailPage({
    super.key,
    required this.product,
    required this.isFavorite,
    required this.onFavoriteToggle,
    required this.onAddToCart,
    required this.cart,
  });

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  late PageController _imageController;
  int _currentImage = 0;

  List<String> get _images {
    if (widget.product.imageUrl != null && widget.product.imageUrl!.isNotEmpty) {
      return [widget.product.imageUrl!, widget.product.imageUrl!];
    }
    return [
      'https://via.placeholder.com/400x400/FF6A00/FFFFFF?text=ZAMZA',
      'https://via.placeholder.com/400x400/FF8C1A/FFFFFF?text=ZAMZA'
    ];
  }

  @override
  void initState() {
    super.initState();
    _imageController = PageController();
  }

  @override
  void dispose() {
    _imageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final quantity = widget.cart[product.name] ?? 0;

    return Scaffold(
      backgroundColor: ZamzaColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Stack(
                  children: [
                    SizedBox(
                      height: 350,
                      child: PageView.builder(
                        controller: _imageController,
                        onPageChanged: (i) => setState(() => _currentImage = i),
                        itemCount: _images.length,
                        itemBuilder: (_, i) => Container(
                          color: ZamzaColors.card,
                          child: Image.network(
                            _images[i],
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => Container(
                              color: ZamzaColors.grey200,
                              child: const Icon(Icons.image, size: 80, color: ZamzaColors.grey500),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 16,
                      child: CircleAvatar(
                        backgroundColor: ZamzaColors.card.withOpacity(0.9),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back, color: ZamzaColors.accent),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                    ),
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      right: 16,
                      child: CircleAvatar(
                        backgroundColor: ZamzaColors.card.withOpacity(0.9),
                        child: IconButton(
                          icon: Icon(
                            widget.isFavorite ? Icons.favorite : Icons.favorite_border,
                            color: widget.isFavorite ? Colors.red : ZamzaColors.accent,
                          ),
                          onPressed: widget.onFavoriteToggle,
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _images.length,
                          (i) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentImage == i ? ZamzaColors.primary : ZamzaColors.grey200,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ZamzaColors.card,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(ZamzaRadius.xl)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product.name, style: ZamzaText.heading2),
                      const SizedBox(height: 4),
                      Text(product.category, style: ZamzaText.body.copyWith(color: ZamzaColors.grey500)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text('₹${product.price.toStringAsFixed(0)}', style: ZamzaText.price),
                          const SizedBox(width: 8),
                          Text('MRP ₹${(product.price * 1.2).toStringAsFixed(0)}',
                              style: ZamzaText.caption.copyWith(decoration: TextDecoration.lineThrough)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: ZamzaColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('20% OFF', style: ZamzaText.caption.copyWith(color: ZamzaColors.primary, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 16, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text('4.5 (120 reviews)', style: ZamzaText.caption),
                          const Spacer(),
                          Text('Delivery in 10 mins', style: ZamzaText.caption.copyWith(color: ZamzaColors.primary)),
                        ],
                      ),
                      const Divider(height: 32),
                      Text('Description', style: ZamzaText.heading3),
                      const SizedBox(height: 8),
                      Text(
                        'Fresh ${product.name} sourced directly from local farms. Delivered to your doorstep in minutes.',
                        style: ZamzaText.body,
                      ),
                      const SizedBox(height: 24),
                      Text('Nutritional Facts', style: ZamzaText.heading3),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _nutritionChip('Calories', '52 kcal'),
                          _nutritionChip('Protein', '1.3 g'),
                          _nutritionChip('Carbs', '12 g'),
                          _nutritionChip('Fat', '0.2 g'),
                        ],
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: ZamzaColors.card,
                boxShadow: const [ZamzaShadows.card],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    if (quantity > 0) ...[
                      GestureDetector(
                        onTap: () => widget.onAddToCart(product),
                        child: const Icon(Icons.remove_circle, color: ZamzaColors.primary, size: 32),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text('$quantity', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                      ),
                      GestureDetector(
                        onTap: () => widget.onAddToCart(product),
                        child: const Icon(Icons.add_circle, color: ZamzaColors.primary, size: 32),
                      ),
                    ],
                    const Spacer(),
                    if (quantity == 0)
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => widget.onAddToCart(product),
                          icon: const Icon(Icons.shopping_cart_outlined),
                          label: const Text('Add to Cart'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ZamzaColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZamzaRadius.md)),
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Added to cart!')),
                            );
                            Navigator.pop(context);
                          },
                          icon: const Icon(Icons.check),
                          label: const Text('Go to Cart'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ZamzaColors.success,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZamzaRadius.md)),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _nutritionChip(String label, String value) {
    return Column(
      children: [
        Text(value, style: ZamzaText.body.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(label, style: ZamzaText.caption),
      ],
    );
  }
}