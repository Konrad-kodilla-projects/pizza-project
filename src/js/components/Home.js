import { templates, select, classNames } from '../settings.js';

export class Home {
  constructor(elem) {
    this.render(elem);
    this.initActions();
  }

  render(elem) {
    elem.innerHTML = templates.homePage();

    this.dom = {
      wrapper: elem
    };
  }

  initActions() {
    const { mainNav, cart, header } = select.containerOf;
    const { hide } = classNames.home;
    [mainNav, cart, header].forEach(elem =>
      document.querySelector(elem).classList.add(hide)
    );
  }
}
