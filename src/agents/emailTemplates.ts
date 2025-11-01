import { EmailAnalysis, ResponseStrategy } from '../types';

export class EmailTemplates {
  static getInitialInquiryResponse(
    analysis: EmailAnalysis,
    strategy: ResponseStrategy
  ): string {
    return `Hi,

Thanks for your interest in the item! I'm asking $${strategy.pricePoint.toFixed(2)}.

${strategy.incentives.length > 0 ? `Special offer: ${strategy.incentives.join(', ')}.` : ''}

The item is in excellent condition and ready to go. I can be flexible on price for the right buyer.

Feel free to reach out with any questions!

Best regards`;
  }

  static getNegotiationCounterOffer(
    offeredPrice: number,
    strategy: ResponseStrategy
  ): string {
    const counterPrice = Math.max(
      strategy.minAcceptable,
      offeredPrice * 1.08
    );

    return `Hi,

Thanks for your offer of $${offeredPrice.toFixed(2)}. 

I appreciate the interest! I can meet you at $${counterPrice.toFixed(2)} - that's my best price on this item.

${strategy.incentives.join('. ')}

Let me know if this works for you!

Best regards`;
  }

  static getDealClosingConfirmation(
    product: string,
    finalPrice: number,
    incentives: string[]
  ): string {
    return `Hi,

Excellent! We have a deal on ${product} for $${finalPrice.toFixed(2)}.

${incentives.length > 0 ? `Included: ${incentives.join(', ')}.` : ''}

Next steps:
1. I'll mark the item as sold
2. We'll coordinate pickup/delivery
3. Payment can be arranged (cash, Venmo, PayPal)

Thanks for the smooth negotiation!

Best regards`;
  }

  static getFollowUpEmail(
    daysSinceContact: number,
    product: string,
    strategy: ResponseStrategy
  ): string {
    return `Hi,

Just following up on your interest in ${product}. 

I'm still asking $${strategy.pricePoint.toFixed(2)}, but I'm open to reasonable offers. The item is still available and ready to go!

${strategy.incentives.length > 0 ? `Plus: ${strategy.incentives.join(', ')}.` : ''}

Let me know if you're still interested!

Best regards`;
  }
}

