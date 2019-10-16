/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');
  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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

      if (params) {
        Object.keys(params).map(param => {
          Object.keys(params[param].options).map(option => {
            const optionData = params[param].options[option];
            let formDataOption = false;
            formData[param] ? (formDataOption = formData[param].includes(option)) : null;

            if (formDataOption && !optionData.default) {
              // console.log('zawiera i niedomyślna');
              price += optionData.price;
            } else if (!formDataOption && optionData.default) {
              // console.log('nie zawiera domyślnej');
              price -= optionData.price;
            }

            const active = classNames.menuProduct.imageVisible;
            const imageSelector = this.imageWrapper.querySelector(`.${param}-${option}`);
            if (imageSelector) {
              formDataOption
                ? imageSelector.classList.add(active)
                : imageSelector.classList.remove(active);
            }
          });
        });
      }
      price *= this.amountWidget.value;
      this.priceElem.innerHTML = price;
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
      console.log('TCL: AmountWidget -> constructor -> elem', this);
    }

    setValue(val) {
      const newValue = parseInt(val);
      const range = settings.amountWidget;
      if (newValue !== this.value && newValue >= range.defaultMin && newValue <= range.defaultMax) {

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
      const event = new Event('updated');
      this.element.dispatchEvent(event);
    }

    getElements(element){
      this.element = element;
      this.input = this.element.querySelector(select.widgets.amount.input);
      this.linkDecrease = this.element.querySelector(select.widgets.amount.linkDecrease);
      this.linkIncrease = this.element.querySelector(select.widgets.amount.linkIncrease);
    }
  }

  const app = {
    initMenu: () => {
      Object.keys(this.data.products).forEach(
        product => new Product(product, this.data.products[product])
      );
    },
    
    initData: () => (this.data = dataSource),

    init: function() {
      this.initData();
      this.initMenu();
    }
  };

  app.init();
}
