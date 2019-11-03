import { select } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';

export class CartProduct {
  constructor({ id, name, price, priceSingle, amount, params }, elem) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.priceSingle = priceSingle;
    this.amount = amount;
    this.params = JSON.parse(JSON.stringify(params));

    this.getElements(elem);
    this.initAmountWidget();
    this.initActions();
  }

  getElements(elem) {
    const { amountWidget, price, edit, remove } = select.cartProduct;
    this.dom = {
      wrapper: elem,
      amountWidget: elem.querySelector(amountWidget),
      price: elem.querySelector(price),
      edit: elem.querySelector(edit),
      remove: elem.querySelector(remove)
    };
  }

  initAmountWidget() {
    this.amountWidget = new AmountWidget(this.dom.amountWidget);
    this.dom.amountWidget.addEventListener('updated', () => {
      this.amount = this.amountWidget.value;
      this.price = this.priceSingle * this.amount;
      this.dom.price.innerHTML = this.price;
    });
  }

  initActions() {
    this.dom.edit.addEventListener('click', e => {
      e.preventDefault();
    });

    this.dom.remove.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });
  }

  remove() {
    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: this
      }
    });

    this.dom.wrapper.dispatchEvent(event);
  }
}
