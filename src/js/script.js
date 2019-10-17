/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');
  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product'
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart'
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select'
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]'
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]'
      }
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]'
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]'
    }
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active'
    },
    cart: {
      wrapperActive: 'active'
    }
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9
    },
    cart: {
      defaultDeliveryFee: 20
    },
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order'
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    )
  };

  class Product {
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
      app.cart.add(this);
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

  class AmountWidget {
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

  class Cart {
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

      this.renderTotalsKeys = [
        'totalNumber',
        'totalPrice',
        'subtotalPrice',
        'deliveryFee'
      ];
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

    sendOrder() {
      const { url, order } = settings.db;
      const {address, phone} = this.dom;

      const payload = {
        address: address.value,
        phone: phone.value,
        totalPrice: this.totalPrice,
        totalNumber: this.totalNumber,
        subtotalPrice: this.subtotalPrice,
        deliveryFee: this.deliveryFee,
        products: []
      };
      this.products.map(product =>{
        payload.products.push(this.getData(product));
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

      fetch(`${url}/${order}`, options)
        .then(res => res.json())
        .then(parsedData => console.log(parsedData));
    }

    getData(obj){
      return {
        id: obj.id,
        amount: obj.amount,
        price: obj.price,
        priceSingle: obj.priceSingle,
        params: obj.params
      };
    }
  }

  class CartProduct {
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

  const app = {
    initMenu: function() {
      const { products } = this.data;
      Object.keys(products).forEach(
        product => new Product(products[product].id, products[product])
      );
    },

    initData: function() {
      this.data = {};
      const { url, product } = settings.db;
      fetch(`${url}/${product}`)
        .then(rawRes => rawRes.json())
        .then(parsedData => {
          this.data.products = parsedData;
          this.initMenu();
        });
    },

    initCart: function() {
      const cart = document.querySelector(select.containerOf.cart);
      this.cart = new Cart(cart);
    },

    init: function() {
      this.initData();
      this.initCart();
    }
  };

  app.init();
}
