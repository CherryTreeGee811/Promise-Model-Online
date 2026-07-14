/**
 * Create a tippy tooltip on the given element for contextual guidance.
 * @param {Element} target - The DOM element to attach the tooltip to.
 * @param {string} title - The bold title of the tooltip.
 * @param {string} body - The body text of the tooltip.
 * @param {'top' | 'bottom' | 'left' | 'right'} [placement='top'] - Tooltip placement.
 */
export function createHelpTooltip(
  target: Element,
  title: string,
  body: string,
  placement: 'top' | 'bottom' | 'left' | 'right' = 'top',
): void {
  if (!target || !title) return;
  (target as HTMLElement).dataset.tooltip = 'help';
  tippy(target, {
    content: `<strong>${title}</strong><br>${body}`,
    allowHTML: true,
    interactive: false,
    placement,
    delay: [300, 0],
    maxWidth: 280,
    theme: 'help-tooltip',
    animation: false,
  });
}
