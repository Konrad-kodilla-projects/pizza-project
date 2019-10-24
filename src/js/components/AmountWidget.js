import { select, settings } from '../settings.js';

export class AmountWidget {
  constructor(elem) {
    this.value = 1;

    this.getElements(elem);
    this.setValue(this.input.value);
    this.initActions();
  }

  setValue(val) {
    const newValue = parseInt(val);
    const range = settings.amountWidget;
    if (
      newValue !== this.value &&
      newValue >= range.defaultMin &&
      newValue <= range.defaultMax
    ) {
      this.value = newValue;
      this.announce();
    }
    this.input.value = this.value;
  }

  initActions() {
    this.input.addEventListener('change', () => this.setValue(this.input.value));

    this.linkDecrease.addEventListener('click', e => {
      e.preventDefault();
      // Na rozmowę => nie prościej jest this.value++?
      this.setValue(this.value - 1);
    });

    this.linkIncrease.addEventListener('click', e => {
      e.preventDefault();
      this.setValue(this.value + 1);
    });
  }

  announce() {
    const event = new CustomEvent('updated', {
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  getElements(element) {
    this.element = element;
    this.input = this.element.querySelector(select.widgets.amount.input);
    this.linkDecrease = this.element.querySelector(select.widgets.amount.linkDecrease);
    this.linkIncrease = this.element.querySelector(select.widgets.amount.linkIncrease);
  }
}
