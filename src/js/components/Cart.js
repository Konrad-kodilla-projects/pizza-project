import { select, settings, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import { CartProduct } from './CartProduct.js';

export class Cart {
  constructor(elem) {
    this.products = [];
    this.deliveryFee = settings.cart.defaultDeliveryFee;
    this.getElements(elem);
    this.initActions();
  }

  getElements(elem) {
    this.dom = {
      wrapper: elem
    };

    Object.keys(select.cart).map(key => {
      this.dom[key] = this.dom.wrapper.querySelector(select.cart[key]);
    });

    this.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
    this.renderTotalsKeys.map(key => {
      this.dom[key] = this.dom.wrapper.querySelectorAll(select.cart[key]);
    });
  }

  initActions() {
    const { toggleTrigger, wrapper, productList, form } = this.dom;

    toggleTrigger.addEventListener('click', e => {
      e.preventDefault();
      wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    productList.addEventListener('updated', () => this.update());
    productList.addEventListener('remove', e => this.remove(e.detail.cartProduct));
    form.addEventListener('submit', e => {
      e.preventDefault();
      this.sendOrder();
    });
  }

  add(product) {
    const html = templates.cartProduct(product);
    this.element = utils.createDOMFromHTML(html);
    this.dom.productList.appendChild(this.element);

    this.products.push(new CartProduct(product, this.element));
    this.update();
  }

  update() {
    this.totalNumber = 0;
    this.subtotalPrice = 0;

    this.products.map(product => {
      this.subtotalPrice += product.price;
      this.totalNumber += product.amount;
    });

    this.subtotalPrice
      ? (this.totalPrice = this.subtotalPrice + this.deliveryFee)
      : (this.totalPrice = 0);

    this.renderTotalsKeys.map(key => {
      this.dom[key].forEach(elem => (elem.innerHTML = this[key]));
    });
  }

  remove(cartProduct) {
    this.products.splice(this.products.indexOf(cartProduct), 1);
    cartProduct.dom.wrapper.remove();
    this.update();
  }

  async sendOrder() {
    const { url, order } = settings.db;
    const { address, phone } = this.dom;

    const payload = {
      address: address.value,
      phone: phone.value,
      totalPrice: this.totalPrice,
      totalNumber: this.totalNumber,
      subtotalPrice: this.subtotalPrice,
      deliveryFee: this.deliveryFee,
      products: []
    };
    this.products.map(product => {
      payload.products.push(this.getData(product));
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    await fetch(`${url}/${order}`, options)
      .then(res => res.json())
      .then(parsedData => {
        console.log(parsedData);
      });
  }

  getData(obj) {
    return {
      id: obj.id,
      amount: obj.amount,
      price: obj.price,
      priceSingle: obj.priceSingle,
      params: obj.params
    };
  }
}
