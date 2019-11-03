import { Product } from './components/Product.js';
import { Cart } from './components/Cart.js';
import { settings, select, classNames } from './settings.js';
import { Booking } from './components/Booking.js';
import { Home } from './components/Home.js';

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

  initPages: function() {
    this.pages = Array.from(document.querySelector(select.containerOf.pages).children);
    this.navlinks = Array.from(document.querySelectorAll(select.nav.links));
    let pagesHash = [];
    const { hash } = window.location;

    if (hash.length > 2) {
      pagesHash = this.pages.filter(page => page.id == hash.replace('#/', ''));
      if (!pagesHash.length) {
        pagesHash = this.pages.filter(page => page.id == hash.substring(2, 9));
      }
    }

    /* Na rozmowę
      Chciałem tutaj w linijce pod spodem odpalać tak że jak się wpisze uuid to
      żeby strona się sama przeładowała ale raz miałem this.booking a raz nie
    */
    // hash.length > 12 ? this.booking.updateBookingData() : null;

    this.activatePage(pagesHash.length ? pagesHash[0].id : this.pages[0].id, hash.substring(10));

    this.navlinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.activatePage(link.getAttribute('href').replace('#', ''));
      });
    });

  },

  initActions: function() {
    this.pages.forEach(page => {
      page.addEventListener('change-page', e => this.activatePage(e.detail.id));
    });

    window.addEventListener('hashchange', this.initPages.bind(this));
  },

  initBooking: function() {
    this.booking = new Booking(document.querySelector(select.containerOf.booking));
  },

  initHome: () => new Home(document.querySelector(select.containerOf.home)),

  activatePage: function(id, uuid='') {
    const { active } = classNames.nav;

    this.navlinks.forEach(link => {
      link.classList.toggle(active, link.getAttribute('href') == `#${id}`);
    });
    this.pages.forEach(page =>
      page.classList.toggle(active, page.getAttribute('id') == id)
    );
    uuid ? window.location.hash = `#/${id}/${uuid}` : (window.location.hash = `#/${id}`);
    this.toggleNavElements(id);
  },

  toggleNavElements: function(pageId) {
    const { mainNav, cart, header } = select.containerOf;
    const { hide } = classNames.home;
    [mainNav, cart, header].forEach(elem =>
      document.querySelector(elem).classList.toggle(hide, pageId === 'home')
    );
  },

  init: function() {
    this.initPages();
    this.initActions();
    this.initData();
    this.initCart();
    this.initBooking();
    this.initHome();
  }
};

app.init();
