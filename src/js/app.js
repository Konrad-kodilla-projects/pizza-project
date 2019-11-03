import { Product } from './components/Product.js';
import { Cart } from './components/Cart.js';
import { settings, select } from './settings.js';

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

    this.productList = document.querySelector(select.containerOf.menu);
    this.productList.addEventListener('add-to-cart', e => app.cart.add(e.detail.product));
  },

  init: function() {
    this.initData();
    this.initCart();
  }
};

app.init();
