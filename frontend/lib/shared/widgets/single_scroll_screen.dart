import 'package:flutter/material.dart';

/// Wraps body in a single scrollable so the entire screen scrolls as one.
/// Use for pages that need one consistent scroll (no nested ListView/ScrollView).
class SingleScrollScreen extends StatelessWidget {
  const SingleScrollScreen({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.refreshIndicator,
  });

  final Widget child;
  final EdgeInsets padding;
  final Future<void> Function()? refreshIndicator;

  @override
  Widget build(BuildContext context) {
    final scrollView = SingleChildScrollView(
      padding: padding,
      physics: const AlwaysScrollableScrollPhysics(),
      child: child,
    );

    if (refreshIndicator != null) {
      return RefreshIndicator(
        onRefresh: refreshIndicator!,
        child: scrollView,
      );
    }

    return scrollView;
  }
}
