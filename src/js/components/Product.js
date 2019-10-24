import { templates, select, classNames } from '../settings.js';
import { utils } from '../utils.js';
import { AmountWidget } from './AmountWidget.js';

export class Product {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.renderInMenu();
    this.getElements();
    this.initAccordion();
    this.initOrderForm();
    this.initAmountWidget();
    this.processOrder();
    // console.log('New Product: ', this);
  }

  renderInMenu() {
    const html = templates.menuProduct(this.data);
    this.element = utils.createDOMFromHTML(html);

    // const menuContainer = document.querySelector(select.containerOf.menu);
    document.querySelector(select.containerOf.menu).appendChild(this.element);
  }

  initAccordion() {
    this.accordionTrigger.addEventListener('click', e => {
      e.preventDefault();
      const activeClass = classNames.menuProduct.wrapperActive;
      this.element.classList.toggle(activeClass);

      document
        .querySelectorAll(select.all.menuProductsActive)
        .forEach(product =>
          product !== this.element ? product.classList.remove(activeClass) : null
        );
    });
  }

  initOrderForm() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      this.processOrder();
    });

    this.formInputs.forEach(input => {
      input.addEventListener('change', () => this.processOrder());
    });

    this.cartButton.addEventListener('click', e => {
      e.preventDefault();
      this.processOrder();
      this.addToCart();
    });
  }

  initAmountWidget() {
    this.amountWidget = new AmountWidget(this.amountWidgetElem);
    this.amountWidgetElem.addEventListener('updated', () => this.processOrder());
  }

  processOrder() {
    const formData = utils.serializeFormToObject(this.form);
    let price = this.data.price;
    const params = this.data.params;
    this.params = {};

    if (params) {
      Object.keys(params).map(param => {
        Object.keys(params[param].options).map(option => {
          const optionData = params[param].options[option];
          let formDataOption = false;
          formData[param] ? (formDataOption = formData[param].includes(option)) : null;

          if (formDataOption && !optionData.default) {
            price += optionData.price;
          } else if (!formDataOption && optionData.default) {
            price -= optionData.price;
          }

          const active = classNames.menuProduct.imageVisible;
          const imageSelector = this.imageWrapper.querySelector(`.${param}-${option}`);
          if (imageSelector) {
            formDataOption
              ? imageSelector.classList.add(active)
              : imageSelector.classList.remove(active);
          }

          if (formDataOption) {
            if (!this.params[param]) {
              this.params[param] = {
                label: params[param].label,
                options: {}
              };
            }
            this.params[param].options[option] = optionData.label;
          }
        });
      });
    }
    this.priceSingle = price;
    this.price = this.priceSingle * this.amountWidget.value;
    this.priceElem.innerHTML = this.price;
  }

  addToCart() {
    this.name = this.data.name;
    this.amount = this.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: this
      }
    });
    this.element.dispatchEvent(event);
  }

  getElements() {
    this.accordionTrigger = this.element.querySelector(select.menuProduct.clickable);
    this.form = this.element.querySelector(select.menuProduct.form);
    this.formInputs = this.form.querySelectorAll(select.all.formInputs);
    this.cartButton = this.element.querySelector(select.menuProduct.cartButton);
    this.priceElem = this.element.querySelector(select.menuProduct.priceElem);
    this.imageWrapper = this.element.querySelector(select.menuProduct.imageWrapper);
    this.amountWidgetElem = this.element.querySelector(select.menuProduct.amountWidget);
  }
}
