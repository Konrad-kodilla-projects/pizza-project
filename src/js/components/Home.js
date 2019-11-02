import { templates, select, classNames, settings } from '../settings.js';

export class Home {
  constructor(elem) {
    this.data = {};
    this.slideId = 0;
    this.init(elem);
  }

  /* NA ROZMOWE
  Czy jest jakaś lepsza opcja na to żeby pozostałe funkcje "poczekały" aż
  async dostarczy dane? np.
    construktor(){
      this.getData().then( i tutaj wszystkie funcje?)
    }
  */
  async init(elem) {
    const { url, slider, porfolio } = settings.db;

    /* Get slides */
    const responseSlider = await fetch(`${url}/${slider}`);
    const parsedData = await responseSlider.json();
    this.data.slider = parsedData;

    /* Get portfolio images */
    const responsePortfolio = await fetch(`${url}/${porfolio}`);
    this.data.images = await responsePortfolio.json();
    // console.log('data collected');

    /* Render elements */

    this.render(elem);
    this.initSlider();
    this.initActions();
  }

  render(elem) {
    /* Add handlebars context to wrapper */
    elem.innerHTML = templates.homePage(this.data);
    const { slider, dot } = select.slider;
    const { orderLink, bookingLink } = select.homePage;

    this.dom = {
      wrapper: elem,
      slider: elem.querySelectorAll(slider),
      dot: elem.querySelectorAll(dot),
      orderLink: elem.querySelector(orderLink),
      bookingLink: elem.querySelector(bookingLink)
    };
  }

  initSlider() {
    const { active, prev } = classNames.home;
    this.dom.slider.forEach((slide, id) => {
      slide.classList.toggle(prev, slide.classList.contains(active));
      slide.classList.toggle(active, this.slideId == id);
    });

    this.dom.dot.forEach((dot, id) => {
      dot.classList.toggle(active, this.slideId == id);
    });

    this.slideId < this.data.slider.length - 1 ? this.slideId++ : (this.slideId = 0);
    setTimeout(this.initSlider.bind(this), 4000);
  }

  initActions() {
    const { bookingLink, orderLink } = select.homePage;
    this.dom.bookingLink.addEventListener('click', () => {
      this.announce(bookingLink);
    });
    this.dom.orderLink.addEventListener('click', () => {
      this.announce(orderLink);
    });
  }

  announce(id) {
    this.dom.wrapper.dispatchEvent(
      new CustomEvent('change-page', {
        bubbles: true,
        detail: {
          id: id.replace('#', '')
        }
      })
    );
  }
}
