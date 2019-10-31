import { templates, select, classNames, settings } from '../settings.js';

export class Home {
  constructor(elem) {
    this.data = {};
    this.slideId = 0;
    this.getData(elem);
    this.initActions();
  }

  render(elem) {
    /* Add handlebars context to wrapper */
    elem.innerHTML = templates.homePage(this.data);

    this.dom = {
      wrapper: elem,
      slider: elem.querySelectorAll(select.slider)
    };
  }

  initActions() {
    const { mainNav, cart, header } = select.containerOf;
    const { hide } = classNames.home;
    [mainNav, cart, header].forEach(elem =>
      document.querySelector(elem).classList.add(hide)
    );
  }

  initSlider(){
    const {active, prev} = classNames.home;
    this.dom.slider.forEach((slide, id) => {
      slide.classList.toggle(prev, slide.classList.contains(active));
      slide.classList.toggle(active, this.slideId == id);
    });
    this.slideId < this.data.slider.length - 1 ? this.slideId++ : this.slideId = 0;
    setTimeout(this.initSlider.bind(this), 4000); 
  }

  async getData(elem) {
    const {url, slider} = settings.db;
    const response = await fetch(`${url}/${slider}`);
    const parsedData = await response.json();
    this.data.slider = parsedData;
    // console.log('pobrano dane');
    this.render(elem);
    this.initSlider();

  }
}
