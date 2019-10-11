/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product'
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
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]'
      }
    }
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active'
    }
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
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
      this.priceElem.innerHTML = price;
    }

    getElements() {
      this.accordionTrigger = this.element.querySelector(select.menuProduct.clickable);
      this.form = this.element.querySelector(select.menuProduct.form);
      this.formInputs = this.form.querySelectorAll(select.all.formInputs);
      this.cartButton = this.element.querySelector(select.menuProduct.cartButton);
      this.priceElem = this.element.querySelector(select.menuProduct.priceElem);
      this.imageWrapper = this.element.querySelector(select.menuProduct.imageWrapper);
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
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      this.initData();
      this.initMenu();
    }
  };

  app.init();
}
