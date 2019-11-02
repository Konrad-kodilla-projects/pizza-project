import { select, settings } from '../settings.js';
import { BaseWidget } from './BaseWidget.js';

export class AmountWidget extends BaseWidget {
  constructor(wrapper, initValue) {
    super(wrapper, settings.amountWidget.defaultValue);

    this.getElements();
    this.initActions();
    initValue ? this.dom.input.value = initValue : null;
  }

  isValid(val){
    const {defaultMax: max, defaultMin: min} = settings.amountWidget;
    return !isNaN(val) && val >= min && val <= max;
  }

  initActions() {
    this.dom.input.addEventListener('change', () => this.value = this.dom.input.value);

    this.dom.linkDecrease.addEventListener('click', e => {
      e.preventDefault();
      this.value--;
    });

    this.dom.linkIncrease.addEventListener('click', e => {
      e.preventDefault();
      this.value++;
    });
  }

  renderValue(){
    this.dom.input.value = this.value;
  }

  getElements() {
    const amount = select.widgets.amount;
    Object.keys(amount).forEach(
      elem => (this.dom[elem] = this.dom.wrapper.querySelector(amount[elem]))
    );
  }
}
