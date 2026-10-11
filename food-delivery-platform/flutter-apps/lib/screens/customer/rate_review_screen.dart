import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/translation_manager.dart';
import '../../providers/order_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';

class RateReviewScreen extends ConsumerStatefulWidget {
  final String orderId;
  const RateReviewScreen({super.key, required this.orderId});
  @override
  ConsumerState<RateReviewScreen> createState() => _RateReviewScreenState();
}

class _RateReviewScreenState extends ConsumerState<RateReviewScreen> {
  int _food = 0;
  int _delivery = 0;
  final _comment = TextEditingController();
  final List<String> _images = [];
  bool _saving = false;

  Widget _stars(int value, ValueChanged<int> onChange) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          5,
          (i) => IconButton(
            iconSize: 36,
            icon: Icon(i < value ? Icons.star_rounded : Icons.star_outline_rounded, color: Theme.of(context).colorScheme.primary),
            onPressed: () => onChange(i + 1),
          ),
        ),
      );

  Future<void> _addPhoto() async {
    final f = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (f == null) return;
    try {
      final url = await ApiService.instance.upload(f.path, folder: 'reviews');
      setState(() => _images.add(url));
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      await ApiService.instance.review({
        'orderId': widget.orderId,
        'rating': _food,
        if (_delivery > 0) 'deliveryRating': _delivery,
        'comment': _comment.text.trim(),
        'images': _images,
      });
      ref.invalidate(orderHistoryProvider);
      ref.read(orderTrackerProvider(widget.orderId).notifier).refresh();
      if (mounted) {
        showMessage(context, 'review.thanks');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = ref.watch(orderTrackerProvider(widget.orderId)).order;
    return Scaffold(
      appBar: AppBar(title: Text(tr('review.title'))),
      body: o == null
          ? const LoadingView()
          : ListView(padding: const EdgeInsets.all(20), children: [
              Text(tr('review.foodQuestion', {'restaurant': o.restaurant.name}), textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
              _stars(_food, (v) => setState(() => _food = v)),
              if (o.deliveryPartner != null) ...[
                const SizedBox(height: 12),
                Text(tr('review.deliveryQuestion', {'name': o.deliveryPartner!.name}),
                    textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                _stars(_delivery, (v) => setState(() => _delivery = v)),
              ],
              const SizedBox(height: 16),
              TextField(controller: _comment, maxLines: 4, decoration: InputDecoration(labelText: tr('review.comment'))),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final u in _images) NetImage(u, width: 72, height: 72, radius: 8),
                InkWell(
                  onTap: _addPhoto,
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(border: Border.all(color: Theme.of(context).colorScheme.outline), borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.add_a_photo_outlined),
                  ),
                ),
              ]),
              const SizedBox(height: 24),
              AppButton(labelKey: 'review.submit', loading: _saving, onPressed: _food == 0 ? null : _submit),
            ]),
    );
  }
}
