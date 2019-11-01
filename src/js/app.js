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
    }
    this.activatePage(pagesHash.length ? pagesHash[0].id : this.pages[0].id);

    this.navlinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.activatePage(link.getAttribute('href').replace('#', ''));
      });
    });

    this.pages.forEach(page =>{
      page.addEventListener('change-page', e => 
        this.activatePage(e.detail.id));
    });
  },

  initBooking: () => new Booking(document.querySelector(select.containerOf.booking)),

  initHome: () => new Home(document.querySelector(select.containerOf.home)),

  activatePage: function(id) {
    const { active } = classNames.nav;

    this.navlinks.forEach(link => {
      link.classList.toggle(active, link.getAttribute('href') == `#${id}`);
    });
    this.pages.forEach(page =>
      page.classList.toggle(active, page.getAttribute('id') == id)
    );

    window.location.hash = `#/${id}`;
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
    this.initData();
    this.initCart();
    this.initBooking();
    this.initHome();
  }
};

app.init();
